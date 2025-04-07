import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Edge function 'update-document-status' initializing.")

// Define the expected request body structure
interface RequestBody {
  documentId: string;
  filePath: string;
}

serve(async (req: Request) => {
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Extract data from request
    const body: RequestBody = await req.json()
    const { documentId, filePath } = body
    if (!documentId || !filePath) {
      throw new Error("Missing documentId or filePath in request body.")
    }

    // 2. Create Supabase client with Service Role Key
    // Ensure environment variables are set in Supabase dashboard
    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // Pass client's authorization header to validate the user session
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // 3. Verify user is authenticated (using the client's token passed in headers)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser()
    if (userError || !user) {
        console.error("User auth error:", userError)
        throw new Error("User not authenticated or error fetching user.")
    }
    console.log("User authenticated:", user.id)

    // 4. Update the document in the database using the admin client (bypasses RLS)
    console.log(`Updating document ${documentId} with path ${filePath}`)
    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ 
        status: 'completed', 
        file_path: filePath,
        updated_at: new Date().toISOString() // Also update timestamp
      })
      .eq('id', documentId)
      .select() // Important: Ensure the update returns data or error properly

    if (updateError) {
      console.error("Supabase update error:", updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`Document ${documentId} updated successfully.`)

    // 5. Return success response
    return new Response(JSON.stringify({ success: true, documentId: documentId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Edge function error:", error)
    // Ensure error is an instance of Error before accessing message
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400,
    })
  }
}) 
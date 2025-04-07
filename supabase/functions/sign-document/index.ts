import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Edge function 'sign-document' initializing.")

interface RequestBody {
  documentId: string;
}

serve(async (req: Request) => {
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Extract documentId from request
    const body: RequestBody = await req.json()
    const { documentId } = body
    if (!documentId) {
      throw new Error("Missing documentId in request body.")
    }

    // 2. Create Supabase client with Service Role Key
    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } } 
    )
    
    // 3. Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser()
    if (userError || !user) {
        console.error("User auth error:", userError)
        throw new Error("User not authenticated or error fetching user.")
    }
    console.log("User authenticated:", user.id)

    // 4. Update the document status and signed_at timestamp
    console.log(`Signing document ${documentId} for user ${user.id}`)
    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ 
        status: 'completed', 
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('type', 'sign') // Ensure we only update 'sign' type documents
      .select() // Ensure the update returns data or error properly

    if (updateError) {
      console.error("Supabase update error:", updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`Document ${documentId} signed successfully.`)

    // 5. Return success response
    return new Response(JSON.stringify({ success: true, documentId: documentId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Edge function error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400,
    })
  }
}) 
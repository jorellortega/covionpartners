import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Edge function 'confirm-signature' initializing.")

interface RequestBody {
  documentId: string;
  signerName: string;
  signatureDate: string; // Expecting YYYY-MM-DD format
}

serve(async (req: Request) => {
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Extract data from request
    const body: RequestBody = await req.json()
    const { documentId, signerName, signatureDate } = body
    if (!documentId || !signerName || !signatureDate) {
      throw new Error("Missing documentId, signerName, or signatureDate in request body.")
    }
    // Basic validation for date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(signatureDate)) {
      throw new Error("Invalid signatureDate format. Expected YYYY-MM-DD.");
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

    // 4. Update the document with signature details
    console.log(`Confirming signature for document ${documentId} by ${signerName} on ${signatureDate}`)
    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ 
        status: 'completed', 
        signed_at: new Date().toISOString(), // Timestamp of function execution
        signer_name: signerName,
        signature_date: signatureDate,      // User-provided date
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('type', 'sign') // Ensure we only update 'sign' type documents
      .neq('status', 'completed') // Prevent re-signing
      .select() 

    if (updateError) {
      console.error("Supabase update error:", updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`Document ${documentId} signature confirmed successfully.`)

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
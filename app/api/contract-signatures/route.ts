import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CreateSignatureRequest } from '@/types/contract-library'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const body: CreateSignatureRequest = await request.json()
    const { contract_id, signer_name, signer_email, signature_data, notes, signature_field_values } = body

    if (!contract_id || !signer_name) {
      return NextResponse.json({ error: 'Contract ID and signer name are required' }, { status: 400 })
    }

    // Get user agent and IP address
    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown'

    // Try to get authenticated user (but don't require it)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Check if contract exists and is accessible
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, status, organization_id')
      .eq('id', contract_id)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Check if contract is in a signable state - allow more statuses for testing
    if (!['draft', 'pending', 'sent'].includes(contract.status)) {
      return NextResponse.json({ 
        error: `Contract is not available for signing. Current status: ${contract.status}` 
      }, { status: 400 })
    }

    console.log('Creating signature with data:', {
      contract_id,
      signer_name,
      signer_email,
      signer_user_id: user?.id || null,
      signature_data_length: signature_data?.length || 0,
      ip_address: ipAddress,
      user_agent: userAgent
    })

    // Create signature
    const { data: signature, error } = await supabase
      .from('contract_signatures')
      .insert({
        contract_id,
        signer_name,
        signer_email,
        signer_user_id: user?.id || null,
        signature_data,
        signature_field_values: signature_field_values || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        notes,
        status: signature_data ? 'signed' : 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating signature:', error)
      return NextResponse.json({ 
        error: 'Failed to create signature',
        details: error.message 
      }, { status: 500 })
    }

    // If signature was created successfully and user is authenticated, update contract status
    if (user && signature_data) {
      await supabase
        .from('contracts')
        .update({ status: 'signed' })
        .eq('id', contract_id)
    }

    return NextResponse.json({ signature }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contract-signatures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contract_id')

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 })
    }

    // Get signatures for contract
    const { data: signatures, error } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching signatures:', error)
      return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 })
    }

    return NextResponse.json({ signatures: signatures || [] })
  } catch (error) {
    console.error('Error in GET /api/contract-signatures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const signatureId = searchParams.get('id')

    if (!signatureId) {
      return NextResponse.json({ error: 'Signature ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { signature_data, status, notes, signature_field_values } = body

    // Update signature
    const updateData: any = {}
    if (signature_data !== undefined) updateData.signature_data = signature_data
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (signature_field_values !== undefined) updateData.signature_field_values = signature_field_values

    const { data: signature, error } = await supabase
      .from('contract_signatures')
      .update(updateData)
      .eq('id', signatureId)
      .select()
      .single()

    if (error) {
      console.error('Error updating signature:', error)
      return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 })
    }

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('Error in PUT /api/contract-signatures:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
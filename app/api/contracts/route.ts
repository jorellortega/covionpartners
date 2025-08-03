import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CreateContractRequest, UpdateContractRequest } from '@/types/contract-library'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const contractId = searchParams.get('id')

    if (contractId) {
      // Get single contract with signatures
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          *,
          signatures:contract_signatures(*)
        `)
        .eq('id', contractId)
        .single()

      if (error) {
        console.error('Error fetching contract:', error)
        return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 })
      }

      return NextResponse.json({ contract })
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('contracts')
      .select('*')
      .eq('organization_id', organizationId)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: contracts, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contracts:', error)
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
    }

    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Error in GET /api/contracts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateContractRequest = await request.json()
    const { 
      organization_id, 
      template_id, 
      title, 
      description, 
      contract_text, 
      file_url, 
      file_name, 
      file_type, 
      category, 
      variables, 
      signature_fields,
      expires_at 
    } = body

    // Validate required fields
    if (!organization_id || !title || !contract_text) {
      return NextResponse.json({ error: 'Organization ID, title, and contract text are required' }, { status: 400 })
    }

    // Check if user has access to the organization
    const { data: orgAccess, error: accessError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organization_id)
      .eq('owner_id', user.id)
      .single()

    if (accessError || !orgAccess) {
      return NextResponse.json({ error: 'Access denied to organization' }, { status: 403 })
    }

    // Create contract
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        organization_id,
        template_id,
        title,
        description,
        contract_text,
        file_url,
        file_name,
        file_type,
        category: category || 'general',
        variables: variables || {},
        signature_fields: signature_fields || [],
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contract:', error)
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }

    return NextResponse.json({ contract }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contracts:', error)
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
    const contractId = searchParams.get('id')

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 })
    }

    const body: UpdateContractRequest = await request.json()
    const { title, description, contract_text, status, category, variables, signature_fields, expires_at } = body

    // Check if user has access to the contract
    const { data: contractAccess, error: accessError } = await supabase
      .from('contracts')
      .select('organization_id')
      .eq('id', contractId)
      .single()

    if (accessError || !contractAccess) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Check organization access
    const { data: orgAccess, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', contractAccess.organization_id)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !orgAccess) {
      return NextResponse.json({ error: 'Access denied to contract' }, { status: 403 })
    }

    // Update contract
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (contract_text !== undefined) updateData.contract_text = contract_text
    if (status !== undefined) updateData.status = status
    if (category !== undefined) updateData.category = category
    if (variables !== undefined) updateData.variables = variables
    if (signature_fields !== undefined) updateData.signature_fields = signature_fields
    if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null

    const { data: contract, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contract:', error)
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
    }

    return NextResponse.json({ contract })
  } catch (error) {
    console.error('Error in PUT /api/contracts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('id')

    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 })
    }

    // Check if user has access to the contract
    const { data: contractAccess, error: accessError } = await supabase
      .from('contracts')
      .select('organization_id')
      .eq('id', contractId)
      .single()

    if (accessError || !contractAccess) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Check organization access
    const { data: orgAccess, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', contractAccess.organization_id)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !orgAccess) {
      return NextResponse.json({ error: 'Access denied to contract' }, { status: 403 })
    }

    // Delete contract
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId)

    if (error) {
      console.error('Error deleting contract:', error)
      return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Contract deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/contracts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
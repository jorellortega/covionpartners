import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CreateContractTemplateRequest, UpdateContractTemplateRequest } from '@/types/contract-library'

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
    const category = searchParams.get('category')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('contract_templates')
      .select('*')
      .eq('organization_id', organizationId)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contract templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error in GET /api/contract-templates:', error)
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

    const body: CreateContractTemplateRequest = await request.json()
    const { organization_id, name, description, category, contract_text, variables, is_public } = body

    // Validate required fields
    if (!organization_id || !name || !contract_text) {
      return NextResponse.json({ error: 'Organization ID, name, and contract text are required' }, { status: 400 })
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

    // Create template
    const { data: template, error } = await supabase
      .from('contract_templates')
      .insert({
        organization_id,
        name,
        description,
        category: category || 'general',
        contract_text,
        variables: variables || [],
        is_public: is_public || false,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contract template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contract-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
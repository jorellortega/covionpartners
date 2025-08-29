import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CreateAccessCodeRequest } from '@/types/contract-library'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateAccessCodeRequest = await request.json()
    const { contract_id, expires_at, max_uses } = body

    if (!contract_id) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 })
    }

    // Check if user has access to the contract
    const { data: contractAccess, error: accessError } = await supabase
      .from('contracts')
      .select('organization_id')
      .eq('id', contract_id)
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

    // Generate unique access code
    let accessCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      // Generate a 8-character alphanumeric code
      accessCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      // Check if code already exists
      const { data: existingCodes, error: checkError } = await supabase
        .from('contract_access_codes')
        .select('id')
        .eq('access_code', accessCode)

      if (checkError) {
        console.error('Error checking code uniqueness:', checkError)
        continue
      }

      if (!existingCodes || existingCodes.length === 0) {
        break // Code is unique
      }

      attempts++
    } while (attempts < maxAttempts)

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Unable to generate unique access code' }, { status: 500 })
    }

    // Create access code
    const { data: accessCodeData, error } = await supabase
      .from('contract_access_codes')
      .insert({
        contract_id,
        access_code: accessCode,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        max_uses: max_uses || 10,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating access code:', error)
      return NextResponse.json({ error: 'Failed to create access code' }, { status: 500 })
    }

    return NextResponse.json({ access_code: accessCodeData }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/contract-access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/contract-access called')
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const contractId = searchParams.get('contract_id')
    
    console.log('🔍 Search params:', { code, contractId })

    if (!code && !contractId) {
      console.log('🔍 No code or contract_id provided')
      return NextResponse.json({ error: 'Code or contract_id parameter is required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    if (code) {
      console.log('🔍 Looking up contract by access code:', code)
      // Look up contract by access code
      const { data: accessCodeData, error: accessError } = await supabase
        .from('contract_access_codes')
        .select('*')
        .eq('access_code', code)
        .single()

      console.log('🔍 Access code lookup result:', { accessCodeData, accessError })

      if (accessError || !accessCodeData) {
        console.log('🔍 Access code not found or error:', accessError)
        if (accessError?.code === 'PGRST116') {
          return NextResponse.json({ 
            error: 'Access code not found. Please check the code or generate a new one.',
            code: code,
            suggestion: 'Generate a new access code from the contract library page'
          }, { status: 404 })
        }
        return NextResponse.json({ 
          error: 'Invalid access code',
          code: code,
          suggestion: 'Please verify the access code is correct'
        }, { status: 404 })
      }

      // Check if code has expired
      if (accessCodeData.expires_at && new Date(accessCodeData.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Access code has expired' }, { status: 410 })
      }

      // Check if max uses exceeded
      if (accessCodeData.max_uses && accessCodeData.current_uses >= accessCodeData.max_uses) {
        return NextResponse.json({ error: 'Access code usage limit exceeded' }, { status: 410 })
      }

      // Get the contract
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', accessCodeData.contract_id)
        .single()

      if (contractError || !contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }

      // Increment usage count
      await supabase
        .from('contract_access_codes')
        .update({ current_uses: (accessCodeData.current_uses || 0) + 1 })
        .eq('id', accessCodeData.id)

      return NextResponse.json({ contract })
    } else if (contractId) {
      // Get access codes for a contract (requires authentication)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

      // Get access codes for the contract
      const { data: accessCodes, error: codesError } = await supabase
        .from('contract_access_codes')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })

      if (codesError) {
        return NextResponse.json({ error: 'Failed to fetch access codes' }, { status: 500 })
      }

      return NextResponse.json({ access_codes: accessCodes })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error in GET /api/contract-access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
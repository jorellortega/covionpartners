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
        max_uses: max_uses || 1,
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
    const { searchParams } = new URL(request.url)
    const accessCode = searchParams.get('code')
    const contractId = searchParams.get('contract_id')

    if (!accessCode && !contractId) {
      return NextResponse.json({ error: 'Access code or contract ID is required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    if (accessCode) {
      // Validate access code and get contract
      const { data: accessCodeData, error: accessError } = await supabase
        .from('contract_access_codes')
        .select('*')
        .eq('access_code', accessCode)
        .single()

      if (accessError || !accessCodeData) {
        return NextResponse.json({ error: 'Invalid access code' }, { status: 404 })
      }

      // Check if code is expired
      if (accessCodeData.expires_at && new Date(accessCodeData.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Access code has expired' }, { status: 410 })
      }

      // Note: Removed max uses check to allow multiple access to the same contract
      // Check if max uses exceeded
      // if (accessCodeData.current_uses >= accessCodeData.max_uses) {
      //   return NextResponse.json({ error: 'Access code usage limit exceeded' }, { status: 410 })
      // }

      // Get contract without signatures for now
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', accessCodeData.contract_id)
        .single()

      if (contractError || !contract) {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
      }

      // Note: Removed usage count increment to allow multiple access
      // Increment usage count
      // await supabase
      //   .from('contract_access_codes')
      //   .update({ current_uses: accessCodeData.current_uses + 1 })
      //   .eq('id', accessCodeData.id)

      return NextResponse.json({ contract, access_code: accessCodeData })
    } else {
      // Get access codes for a specific contract (for authenticated users)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // First check if user has access to this contract
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

      // Get access codes for this contract
      const { data: accessCodes, error: codesError } = await supabase
        .from('contract_access_codes')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })

      if (codesError) {
        console.error('Error fetching access codes:', codesError)
        return NextResponse.json({ error: 'Failed to fetch access codes' }, { status: 500 })
      }

      return NextResponse.json({ access_codes: accessCodes || [] })
    }
  } catch (error) {
    console.error('Error in GET /api/contract-access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
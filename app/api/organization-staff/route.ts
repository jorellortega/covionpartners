import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 })
  }

  // Fetch from the view that includes user info
  const { data, error } = await supabase
    .from('organization_staff_with_user')
    .select('*')
    .eq('organization_id', organizationId)
    .order('access_level', { ascending: false })

  if (error) {
    return NextResponse.json({ message: 'Failed to fetch staff', error }, { status: 500 })
  }

  // Transform the data to match frontend expectations
  const transformedData = data?.map(staff => ({
    id: staff.id,
    organization_id: staff.organization_id,
    user_id: staff.user_id,
    position: staff.position,
    department: staff.department,
    role: staff.role,
    access_level: staff.access_level,
    status: staff.status,
    hire_date: staff.hire_date,
    salary_range: staff.salary_range,
    reports_to: staff.reports_to,
    created_at: staff.created_at,
    updated_at: staff.updated_at,
    user: {
      id: staff.user_id,
      name: staff.name,
      email: staff.email,
      avatar_url: staff.avatar_url
    },
    manager: staff.manager_name ? {
      id: staff.reports_to,
      name: staff.manager_name,
      email: staff.manager_email,
      avatar_url: staff.manager_avatar_url
    } : null
  })) || []

  return NextResponse.json(transformedData)
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { organization_id, user_id, position, department, role, access_level, status, hire_date } = body

  if (!organization_id || !user_id || !position || !role) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('organization_staff')
    .insert([
      {
        organization_id,
        user_id,
        position,
        department,
        role,
        access_level,
        status: status || 'Active',
        hire_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: 'Failed to add staff', error }, { status: 500 })
  }

  // Fetch the complete data with user info from the view
  const { data: completeData, error: fetchError } = await supabase
    .from('organization_staff_with_user')
    .select('*')
    .eq('id', data.id)
    .single()

  if (fetchError) {
    return NextResponse.json({ message: 'Failed to fetch complete staff data', error: fetchError }, { status: 500 })
  }

  // Transform the data to match frontend expectations
  const transformedData = {
    id: completeData.id,
    organization_id: completeData.organization_id,
    user_id: completeData.user_id,
    position: completeData.position,
    department: completeData.department,
    role: completeData.role,
    access_level: completeData.access_level,
    status: completeData.status,
    hire_date: completeData.hire_date,
    salary_range: completeData.salary_range,
    reports_to: completeData.reports_to,
    created_at: completeData.created_at,
    updated_at: completeData.updated_at,
    user: {
      id: completeData.user_id,
      name: completeData.name,
      email: completeData.email,
      avatar_url: completeData.avatar_url
    }
  }

  return NextResponse.json(transformedData)
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  const { id, position, department, role, access_level, status, hire_date, reports_to } = body

  if (!id) {
    return NextResponse.json({ message: 'Staff member ID is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('organization_staff')
    .update({
      position,
      department,
      role,
      access_level,
      status,
      hire_date,
      reports_to,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: 'Failed to update staff', error }, { status: 500 })
  }

  // Fetch the complete data with user info from the view
  const { data: completeData, error: fetchError } = await supabase
    .from('organization_staff_with_user')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ message: 'Failed to fetch complete staff data', error: fetchError }, { status: 500 })
  }

  // Transform the data to match frontend expectations
  const transformedData = {
    id: completeData.id,
    organization_id: completeData.organization_id,
    user_id: completeData.user_id,
    position: completeData.position,
    department: completeData.department,
    role: completeData.role,
    access_level: completeData.access_level,
    status: completeData.status,
    hire_date: completeData.hire_date,
    salary_range: completeData.salary_range,
    reports_to: completeData.reports_to,
    created_at: completeData.created_at,
    updated_at: completeData.updated_at,
    user: {
      id: completeData.user_id,
      name: completeData.name,
      email: completeData.email,
      avatar_url: completeData.avatar_url
    }
  }

  return NextResponse.json(transformedData)
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ message: 'Staff member ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('organization_staff')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ message: 'Failed to delete staff', error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
} 
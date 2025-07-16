import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const search = searchParams.get('search')

    if (!organizationId) {
      return NextResponse.json(
        { message: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const { data: orgAccess, error: accessError } = await supabase
      .from('organizations')
      .select('id')
      .or(`owner_id.eq.${session.user.id},id.in.(select organization_id from organization_staff where user_id = ${session.user.id})`)
      .eq('id', organizationId)
      .single()

    if (accessError || !orgAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - No access to this organization' },
        { status: 403 }
      )
    }

    // Fetch organization staff (no join)
    const { data: members, error } = await supabase
      .from('organization_staff')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organization staff:', error)
      return NextResponse.json(
        { message: 'Failed to fetch organization staff' },
        { status: 500 }
      )
    }

    // Fetch user info for all staff
    const userIds = (members || []).map(m => m.user_id).filter(Boolean)
    let users: any[] = []
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url, role')
        .in('id', userIds)
      if (!usersError && usersData) users = usersData
    }
    // Merge user info into staff
    const merged = (members || []).map(m => ({
      ...m,
      user: users.find(u => u.id === m.user_id) || null
    }))
    return NextResponse.json(merged)
  } catch (error) {
    console.error('Error in organization staff GET:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { organizationId, email, role, status } = await request.json()

    if (!organizationId || !email || !role) {
      return NextResponse.json(
        { message: 'Organization ID, email, and role are required' },
        { status: 400 }
      )
    }

    // Verify user has admin access to this organization
    const { data: orgAccess, error: accessError } = await supabase
      .from('organizations')
      .select('id')
      .or(`owner_id.eq.${session.user.id},id.in.(select organization_id from organization_staff where user_id = ${session.user.id} and role in ('owner', 'admin'))`)
      .eq('id', organizationId)
      .single()

    if (accessError || !orgAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from('organization_staff')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { message: 'User is already a member of this organization' },
        { status: 409 }
      )
    }

    // Add user to organization
    const { data, error } = await supabase
      .from('organization_staff')
      .insert([
        {
          organization_id: organizationId,
          user_id: userData.id,
          role,
          status: status || 'pending',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select(`
        *,
        user:users(id, name, email, avatar_url, role)
      `)
      .single()

    if (error) {
      console.error('Error adding staff member:', error)
      return NextResponse.json(
        { message: 'Failed to add staff member' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in organization staff POST:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { memberId, role, status } = await request.json()

    if (!memberId || !role) {
      return NextResponse.json(
        { message: 'Member ID and role are required' },
        { status: 400 }
      )
    }

    // Get the member to verify organization access
    const { data: member, error: memberError } = await supabase
      .from('organization_staff')
      .select('organization_id, user_id')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Verify user has admin access to this organization
    const { data: orgAccess, error: accessError } = await supabase
      .from('organizations')
      .select('id')
      .or(`owner_id.eq.${session.user.id},id.in.(select organization_id from organization_staff where user_id = ${session.user.id} and role in ('owner', 'admin'))`)
      .eq('id', member.organization_id)
      .single()

    if (accessError || !orgAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Update member
    const { data, error } = await supabase
      .from('organization_staff')
      .update({
        role,
        status: status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select(`
        *,
        user:users(id, name, email, avatar_url, role)
      `)
      .single()

    if (error) {
      console.error('Error updating staff member:', error)
      return NextResponse.json(
        { message: 'Failed to update staff member' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in organization staff PUT:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session to verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { message: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Get the member to verify organization access
    const { data: member, error: memberError } = await supabase
      .from('organization_staff')
      .select('organization_id, user_id')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { message: 'Member not found' },
        { status: 404 }
      )
    }

    // Verify user has admin access to this organization
    const { data: orgAccess, error: accessError } = await supabase
      .from('organizations')
      .select('id')
      .or(`owner_id.eq.${session.user.id},id.in.(select organization_id from organization_staff where user_id = ${session.user.id} and role in ('owner', 'admin'))`)
      .eq('id', member.organization_id)
      .single()

    if (accessError || !orgAccess) {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Delete member
    const { error } = await supabase
      .from('organization_staff')
      .delete()
      .eq('id', memberId)

    if (error) {
      console.error('Error deleting staff member:', error)
      return NextResponse.json(
        { message: 'Failed to delete staff member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in organization staff DELETE:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 
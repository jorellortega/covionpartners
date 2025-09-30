import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('organization_goals')
      .select(`
        *,
        project:projects(id, name, description)
      `)
      .eq('organization_id', organizationId)
      .order('target_date', { ascending: true })

    if (error) {
      return NextResponse.json({ message: 'Failed to fetch goals', error }, { status: 500 })
    }

    // Get organization staff for assignment details
    const { data: staffData } = await supabase
      .from('organization_staff')
      .select(`
        id,
        user:users(name, email),
        profile:profiles(avatar_url)
      `)
      .eq('organization_id', organizationId)

    // Transform the data to match frontend expectations
    const transformedData = data?.map(goal => ({
      ...goal,
      assigned_users: goal.assigned_to?.map(staffId => {
        const staff = staffData?.find(s => s.id === staffId);
        return {
          id: staffId,
          name: staff?.user?.name || 'Unknown',
          email: staff?.user?.email || '',
          avatar_url: staff?.profile?.avatar_url || '',
          status: 'assigned',
          notes: '',
          assigned_at: goal.created_at
        };
      }) || [],
      // Keep backward compatibility with single assignment
      assigned_to: goal.assigned_to?.[0] || null
    })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching organization goals:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log('POST /api/organization-goals called')
  
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('Session error:', sessionError)
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 400 }
      )
    }

    const { title, description, target_date, priority, category, goal_type, project_id, organization_id, assigned_to, assigned_users } = await request.json()

    console.log('Received goal data:', { title, description, target_date, priority, category, goal_type, project_id, organization_id, assigned_to })

    if (!title || !organization_id) {
      return NextResponse.json(
        { message: 'Title and organization ID are required' },
        { status: 400 }
      )
    }

    // Verify user has permission to create goals in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', organization_id)
      .eq('user_id', session.user.id)
      .single()

    console.log('User access check for goals:', { userAccess, accessError, userId: session.user.id, orgId: organization_id })

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organization_id)
        .single()

      console.log('Owner check for goals:', { orgOwner, ownerError, isOwner: orgOwner?.owner_id === session.user.id })

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Get the user's organization_staff record ID for assigned_by
    const { data: staffRecord, error: staffError } = await supabase
      .from('organization_staff')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('user_id', session.user.id)
      .single()

    if (staffError) {
      console.error('Staff lookup error:', staffError)
      return NextResponse.json(
        { message: 'User not found in organization staff', error: staffError.message },
        { status: 400 }
      )
    }

    const insertData = {
      title,
      description,
      target_date: target_date || null,
      priority: priority || 'medium',
      category: category || 'strategic',
      goal_type: goal_type || 'yearly',
      project_id: project_id === 'no-project' ? null : project_id,
      organization_id,
      assigned_to: null, // We'll handle assignments separately
      assigned_by: staffRecord.id,
      status: 'active'
    }

    console.log('Attempting to insert goal with data:', insertData)

    const { data: goalData, error: goalError } = await supabase
      .from('organization_goals')
      .insert([insertData])
      .select()
      .single()

    if (goalError) {
      console.error('Error creating organization goal:', goalError)
      return NextResponse.json(
        { message: 'Failed to create goal', error: goalError.message, details: goalError.details },
        { status: 500 }
      )
    }

    // Handle multiple assignments - update the goal with assigned_users array
    const staffIds = assigned_users || (assigned_to ? [assigned_to] : [])
    
    if (staffIds.length > 0) {
      const { error: updateError } = await supabase
        .from('organization_goals')
        .update({ assigned_to: staffIds })
        .eq('id', goalData.id)

      if (updateError) {
        console.error('Error updating goal assignments:', updateError)
        // Don't fail the entire operation, just log the error
      }
    }

    console.log('Goal created successfully:', goalData)
    return NextResponse.json(goalData)
  } catch (error) {
    console.error('Unexpected error in organization goal creation:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { id, assigned_users, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { message: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Get the goal to check organization
    const { data: existingGoal, error: fetchError } = await supabase
      .from('organization_goals')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { message: 'Goal not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to update goals in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', existingGoal.organization_id)
      .eq('user_id', session.user.id)
      .single()

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', existingGoal.organization_id)
        .single()

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Clean up the update data
    const cleanedUpdateData = { ...updateData };
    
    // Handle assigned_to field - convert 'unassigned' to null
    if (cleanedUpdateData.assigned_to === 'unassigned') {
      cleanedUpdateData.assigned_to = null;
    }
    
    // Handle project_id field - convert 'no-project' to null
    if (cleanedUpdateData.project_id === 'no-project') {
      cleanedUpdateData.project_id = null;
    }

    const { data, error } = await supabase
      .from('organization_goals')
      .update({
        ...cleanedUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization goal:', error)
      console.error('Update data that failed:', cleanedUpdateData)
      return NextResponse.json(
        { message: 'Failed to update goal', error: error.message, details: error.details },
        { status: 500 }
      )
    }

    // Handle assignment updates if provided
    if (assigned_users !== undefined) {
      // Update the goal with new assigned_users array
      const { error: assignmentError } = await supabase
        .from('organization_goals')
        .update({ assigned_to: assigned_users })
        .eq('id', id)

      if (assignmentError) {
        console.error('Error updating goal assignments:', assignmentError)
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in organization goal update:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Get the goal to check organization
    const { data: existingGoal, error: fetchError } = await supabase
      .from('organization_goals')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { message: 'Goal not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to delete goals in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', existingGoal.organization_id)
      .eq('user_id', session.user.id)
      .single()

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', existingGoal.organization_id)
        .single()

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('organization_goals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting organization goal:', error)
      return NextResponse.json(
        { message: 'Failed to delete goal' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error in organization goal deletion:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

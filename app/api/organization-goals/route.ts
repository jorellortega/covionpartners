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

    if (!data || data.length === 0) {
      return NextResponse.json([])
    }

    // Get all unique staff IDs from assigned_to arrays (uuid[])
    const allStaffIds = data
      .filter(goal => goal.assigned_to && Array.isArray(goal.assigned_to) && goal.assigned_to.length > 0)
      .flatMap(goal => goal.assigned_to)
      .filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates
    
    console.log('[DEBUG] GET /api/organization-goals - Unique staff IDs from assigned_to arrays:', allStaffIds)
    
    // Fetch staff and user details
    let assignedUsersMap: Map<string, any> = new Map()
    
    if (allStaffIds.length > 0) {
      // Since organization_staff RLS is off, we can query directly
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', allStaffIds)
        .eq('organization_id', organizationId)

      console.log('[DEBUG] GET /api/organization-goals - Staff data fetched:', staffData?.length || 0, 'Error:', staffError)

      if (staffData && staffData.length > 0) {
        const userIds = staffData.map(s => s.user_id).filter(Boolean)
        console.log('[DEBUG] GET /api/organization-goals - User IDs to fetch:', userIds)
        console.log('[DEBUG] GET /api/organization-goals - Staff data details:', staffData.map(s => ({ id: s.id, user_id: s.user_id })))
        
        if (userIds.length === 0) {
          console.log('[DEBUG] GET /api/organization-goals - WARNING: Staff records have null user_id values!')
        }
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('[DEBUG] GET /api/organization-goals - Users data fetched:', usersData?.length || 0, 'Error:', usersError)
        if (usersError) {
          console.error('[DEBUG] GET /api/organization-goals - Users error details:', JSON.stringify(usersError, null, 2))
        }
        if (usersData && usersData.length > 0) {
          console.log('[DEBUG] GET /api/organization-goals - Sample user data:', usersData[0])
        }

        // Fetch profiles separately
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', userIds)

        if (usersData && usersData.length > 0) {
          staffData.forEach(staff => {
            const user = usersData.find(u => u.id === staff.user_id)
            const profile = profilesData?.find(p => p.user_id === staff.user_id)
            const userData = {
              id: staff.id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown',
              avatar_url: profile?.avatar_url || ''
            }
            assignedUsersMap.set(staff.id, userData)
            console.log('[DEBUG] GET /api/organization-goals - Mapped staff:', staff.id, 'user_id:', staff.user_id, 'to user:', userData.name, userData.email)
          })
        } else {
          console.log('[DEBUG] GET /api/organization-goals - No users data found for staff IDs:', allStaffIds)
        }
      } else {
        console.log('[DEBUG] GET /api/organization-goals - No staff data found for staff IDs:', allStaffIds)
        if (staffError) {
          console.error('[DEBUG] GET /api/organization-goals - Staff error details:', JSON.stringify(staffError, null, 2))
        }
      }
    } else {
      console.log('[DEBUG] GET /api/organization-goals - No staff IDs found in assigned_to arrays')
    }

    // Transform the data to include multiple assigned users from assigned_to array
    const transformedData = data.map(goal => {
      // Get assigned users from the assigned_to uuid[] array
      const staffIds = goal.assigned_to && Array.isArray(goal.assigned_to) ? goal.assigned_to : []
      const assignedUsers = staffIds
        .map((staffId: string) => assignedUsersMap.get(staffId))
        .filter(Boolean)

      console.log('[DEBUG] GET /api/organization-goals - Goal:', goal.id, 'assigned_to array:', staffIds, 'Assigned users:', assignedUsers.length, assignedUsers.map(u => ({ name: u.name, email: u.email })))

      // Keep backward compatibility with single assignment
      const assignedUser = assignedUsers.length > 0 ? assignedUsers[0] : null

      // Debug: Log project data
      if (goal.project_id) {
        console.log('[DEBUG] GET /api/organization-goals - Goal has project_id:', goal.project_id, 'Project data:', goal.project)
      }

      return {
        ...goal,
        assigned_users: assignedUsers,
        assigned_user: assignedUser, // For backward compatibility
        assigned_to: staffIds, // Keep the original array for backward compatibility
        project: goal.project || null // Preserve project data from the join (Supabase returns it as nested object)
      }
    })
    
    console.log('[DEBUG] GET /api/organization-goals - Transformed data sample:', transformedData[0] ? {
      id: transformedData[0].id,
      title: transformedData[0].title,
      project_id: transformedData[0].project_id,
      project: transformedData[0].project,
      assigned_users_count: transformedData[0].assigned_users?.length || 0,
      assigned_users: transformedData[0].assigned_users?.map((u: any) => ({ name: u.name, email: u.email })) || []
    } : 'No goals')

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
    // Note: Owners might not have a staff record, that's OK
    const { data: staffRecord } = await supabase
      .from('organization_staff')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('user_id', session.user.id)
      .single()

    // If no staff record, user might be owner - that's fine, assigned_by can be null

    const insertData = {
      title,
      description,
      target_date: target_date || null,
      priority: priority || 'medium',
      category: category || 'strategic',
      goal_type: goal_type || 'yearly',
      project_id: project_id === 'no-project' ? null : project_id,
      organization_id,
      assigned_to: null, // We'll handle assignments separately via junction table
      assigned_by: staffRecord?.id || null, // Can be null for owners
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

    // Handle multiple assignments using assigned_to uuid[] array
    const staffIdsToAssign = assigned_users && Array.isArray(assigned_users)
      ? assigned_users.filter(id => id && id !== 'unassigned')
      : (assigned_to && assigned_to !== 'unassigned' ? [assigned_to] : [])

    console.log('[DEBUG] POST /api/organization-goals - Staff IDs to assign:', staffIdsToAssign, 'Staff record:', staffRecord?.id)

    // Update the goal with the assigned_to array
    if (staffIdsToAssign.length > 0) {
      const { error: updateError } = await supabase
        .from('organization_goals')
        .update({ assigned_to: staffIdsToAssign })
        .eq('id', goalData.id)

      if (updateError) {
        console.error('[DEBUG] POST /api/organization-goals - Error updating goal assigned_to:', updateError)
      } else {
        console.log('[DEBUG] POST /api/organization-goals - Updated assigned_to array:', staffIdsToAssign.length, 'staff IDs')
        // Update goalData with the new assigned_to
        goalData.assigned_to = staffIdsToAssign
      }
    }

    // Fetch staff and user details to return complete data
    let assignedUsers: any[] = []
    if (staffIdsToAssign.length > 0) {
      console.log('[DEBUG] POST /api/organization-goals - Fetching staff data for:', staffIdsToAssign)
      
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', staffIdsToAssign)
        .eq('organization_id', organization_id)

      console.log('[DEBUG] POST /api/organization-goals - Staff data fetched:', staffData?.length || 0, 'Error:', staffError)

      if (staffData && staffData.length > 0) {
        const userIds = staffData.map(s => s.user_id).filter(Boolean)
        console.log('[DEBUG] POST /api/organization-goals - User IDs to fetch:', userIds)
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('[DEBUG] POST /api/organization-goals - Users data fetched:', usersData?.length || 0, 'Error:', usersError)

        if (usersData && usersData.length > 0) {
          assignedUsers = staffData.map(staff => {
            const user = usersData.find(u => u.id === staff.user_id)
            const userData = {
              id: staff.id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown'
            }
            console.log('[DEBUG] POST /api/organization-goals - Mapped staff:', staff.id, 'to user:', userData.name, userData.email)
            return userData
          })
        } else {
          console.log('[DEBUG] POST /api/organization-goals - No users data found')
        }
      } else {
        console.log('[DEBUG] POST /api/organization-goals - No staff data found for staff IDs:', staffIdsToAssign)
      }
    }

    console.log('[DEBUG] POST /api/organization-goals - Returning goal with assigned_users:', assignedUsers.length)

    // Fetch project data if project_id exists
    let projectData = null
    if (goalData.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', goalData.project_id)
        .single()
      
      projectData = project
    }

    console.log('Goal created successfully:', goalData)
    return NextResponse.json({
      ...goalData,
      assigned_users,
      assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to: staffIdsToAssign, // Return the array of staff IDs
      project: projectData
    })
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

    // Clean up the update data - remove assigned_to and assigned_users as we'll handle them separately
    const cleanedUpdateData: any = { ...updateData }
    delete cleanedUpdateData.assigned_to // Remove assigned_to, we use junction table
    delete cleanedUpdateData.assigned_users // Remove assigned_users, we use junction table
    
    // Handle project_id field - convert 'no-project' to null
    if (cleanedUpdateData.project_id === 'no-project') {
      cleanedUpdateData.project_id = null
    }

    // Update the goal (excluding assignments)
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

    // Handle assignment updates if provided - update assigned_to uuid[] array
    if (assigned_users !== undefined) {
      console.log('[DEBUG] PUT /api/organization-goals - Updating assigned_to array for goal:', id, 'New assignments:', assigned_users)
      
      // Determine which staff IDs to assign
      const staffIdsToAssign = Array.isArray(assigned_users)
        ? assigned_users.filter(id => id && id !== 'unassigned')
        : []

      // Update the goal with the new assigned_to array
      const { error: assignmentError } = await supabase
        .from('organization_goals')
        .update({ assigned_to: staffIdsToAssign })
        .eq('id', id)

      if (assignmentError) {
        console.error('[DEBUG] PUT /api/organization-goals - Error updating goal assigned_to:', assignmentError)
        // Don't fail the entire operation, just log the error
      } else {
        console.log('[DEBUG] PUT /api/organization-goals - Updated assigned_to array:', staffIdsToAssign.length, 'staff IDs')
        // Update data with the new assigned_to
        data.assigned_to = staffIdsToAssign
      }
    }

    // Fetch staff and user details to return complete data
    const staffIds = data.assigned_to && Array.isArray(data.assigned_to) ? data.assigned_to : []
    let assignedUsers: any[] = []
    
    if (staffIds.length > 0) {
      console.log('[DEBUG] PUT /api/organization-goals - Fetching staff data for:', staffIds)
      
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', staffIds)
        .eq('organization_id', existingGoal.organization_id)

      console.log('[DEBUG] PUT /api/organization-goals - Staff data fetched:', staffData?.length || 0, 'Error:', staffError)

      if (staffData && staffData.length > 0) {
        const userIds = staffData.map(s => s.user_id).filter(Boolean)
        console.log('[DEBUG] PUT /api/organization-goals - User IDs to fetch:', userIds)
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('[DEBUG] PUT /api/organization-goals - Users data fetched:', usersData?.length || 0, 'Error:', usersError)

        if (usersData && usersData.length > 0) {
          assignedUsers = staffData.map(staff => {
            const user = usersData.find(u => u.id === staff.user_id)
            const userData = {
              id: staff.id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown'
            }
            console.log('[DEBUG] PUT /api/organization-goals - Mapped staff:', staff.id, 'to user:', userData.name, userData.email)
            return userData
          })
        } else {
          console.log('[DEBUG] PUT /api/organization-goals - No users data found')
        }
      } else {
        console.log('[DEBUG] PUT /api/organization-goals - No staff data found for staff IDs:', staffIds)
      }
    }

    console.log('[DEBUG] PUT /api/organization-goals - Returning goal with assigned_users:', assignedUsers.length)

    // Fetch project data if project_id exists
    let projectData = null
    if (data.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', data.project_id)
        .single()
      
      projectData = project
    }

    return NextResponse.json({
      ...data,
      assigned_users,
      assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to: staffIds, // Return the array of staff IDs
      project: projectData
    })
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

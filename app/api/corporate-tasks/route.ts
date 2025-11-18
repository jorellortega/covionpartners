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

  try {
    const { data, error } = await supabase
      .from('corporate_tasks')
      .select(`
        *,
        project:projects(id, name, description)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DEBUG] GET /api/corporate-tasks - Error fetching tasks:', error)
      return NextResponse.json({ message: 'Failed to fetch tasks', error }, { status: 500 })
    }

    console.log('[DEBUG] GET /api/corporate-tasks - Fetched tasks count:', data?.length || 0)

    if (!data || data.length === 0) {
      return NextResponse.json([])
    }

    // Get all unique staff IDs from assigned_to arrays (uuid[])
    const allStaffIds = data
      .filter(task => task.assigned_to && Array.isArray(task.assigned_to) && task.assigned_to.length > 0)
      .flatMap(task => task.assigned_to)
      .filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates
    
    console.log('[DEBUG] GET /api/corporate-tasks - Unique staff IDs from assigned_to arrays:', allStaffIds)
    
    // Fetch staff and user details
    let assignedUsersMap: Map<string, any> = new Map()
    
    if (allStaffIds.length > 0) {
      // Since organization_staff RLS is off, we can query directly
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', allStaffIds)
        .eq('organization_id', organizationId)

      console.log('[DEBUG] GET /api/corporate-tasks - Staff data fetched:', staffData?.length || 0, 'Error:', staffError)

      if (staffData && staffData.length > 0) {
        const userIds = staffData.map(s => s.user_id).filter(Boolean)
        console.log('[DEBUG] GET /api/corporate-tasks - User IDs to fetch:', userIds)
        console.log('[DEBUG] GET /api/corporate-tasks - Staff data details:', staffData.map(s => ({ id: s.id, user_id: s.user_id })))
        
        if (userIds.length === 0) {
          console.log('[DEBUG] GET /api/corporate-tasks - WARNING: Staff records have null user_id values!')
        }
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('[DEBUG] GET /api/corporate-tasks - Users data fetched:', usersData?.length || 0, 'Error:', usersError)
        if (usersError) {
          console.error('[DEBUG] GET /api/corporate-tasks - Users error details:', JSON.stringify(usersError, null, 2))
        }
        if (usersData && usersData.length > 0) {
          console.log('[DEBUG] GET /api/corporate-tasks - Sample user data:', usersData[0])
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
            console.log('[DEBUG] GET /api/corporate-tasks - Mapped staff:', staff.id, 'user_id:', staff.user_id, 'to user:', userData.name, userData.email)
          })
        } else {
          console.log('[DEBUG] GET /api/corporate-tasks - No users data found for staff IDs:', allStaffIds)
        }
      } else {
        console.log('[DEBUG] GET /api/corporate-tasks - No staff data found for staff IDs:', allStaffIds)
        if (staffError) {
          console.error('[DEBUG] GET /api/corporate-tasks - Staff error details:', JSON.stringify(staffError, null, 2))
        }
      }
    } else {
      console.log('[DEBUG] GET /api/corporate-tasks - No staff IDs found in assigned_to arrays')
    }

    // Transform the data to include multiple assigned users from assigned_to array
    const transformedData = data.map(task => {
      // Get assigned users from the assigned_to uuid[] array
      const staffIds = task.assigned_to && Array.isArray(task.assigned_to) ? task.assigned_to : []
      const assignedUsers = staffIds
        .map((staffId: string) => assignedUsersMap.get(staffId))
        .filter(Boolean)

      console.log('[DEBUG] GET /api/corporate-tasks - Task:', task.id, 'assigned_to array:', staffIds, 'Assigned users:', assignedUsers.length, assignedUsers.map(u => ({ name: u.name, email: u.email })))

      // Keep backward compatibility with single assignment
      const assignedUser = assignedUsers.length > 0 ? assignedUsers[0] : null

      return {
        ...task,
        assigned_users: assignedUsers,
        assigned_user: assignedUser, // For backward compatibility
        assigned_to: staffIds // Keep the original array for backward compatibility
      }
    })

    console.log('[DEBUG] GET /api/corporate-tasks - Transformed data sample:', transformedData[0] ? {
      id: transformedData[0].id,
      title: transformedData[0].title,
      assigned_to: transformedData[0].assigned_to,
      assigned_users_count: transformedData[0].assigned_users?.length || 0,
      assigned_users: transformedData[0].assigned_users?.map((u: any) => ({ name: u.name, email: u.email })) || []
    } : 'No tasks')

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching corporate tasks:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log('POST /api/corporate-tasks called')
  
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('Session error:', sessionError)
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 400 }
      )
    }

    const { title, description, priority, assigned_to, assigned_users, due_date, category, project_id, organization_id } = await request.json()

    if (!title || !organization_id) {
      return NextResponse.json(
        { message: 'Title and organization ID are required' },
        { status: 400 }
      )
    }

    // Verify user has permission to create tasks in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', organization_id)
      .eq('user_id', session.user.id)
      .single()

    console.log('User access check:', { userAccess, accessError, userId: session.user.id, orgId: organization_id })

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organization_id)
        .single()

      console.log('Owner check:', { orgOwner, ownerError, isOwner: orgOwner?.owner_id === session.user.id })

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
      priority: priority || 'medium',
      assigned_to: null, // We'll handle assignments separately
      assigned_by: staffRecord.id,
      due_date: due_date || null,
      category: category || 'other',
      project_id: project_id === 'no-project' ? null : project_id,
      organization_id,
      status: 'pending'
    }

    console.log('Attempting to insert task with data:', insertData)

    const { data: taskData, error: taskError } = await supabase
      .from('corporate_tasks')
      .insert([insertData])
      .select()
      .single()

    if (taskError) {
      console.error('Error creating corporate task:', taskError)
      return NextResponse.json(
        { message: 'Failed to create task', error: taskError.message, details: taskError.details },
        { status: 500 }
      )
    }

    // Handle multiple assignments using assigned_to uuid[] array
    const staffIds = assigned_users || (assigned_to ? [assigned_to] : [])
    
    console.log('[DEBUG] POST /api/corporate-tasks - Staff IDs to assign:', staffIds)
    
    // Update the task with the assigned_to array
    if (staffIds.length > 0) {
      const { error: updateError } = await supabase
        .from('corporate_tasks')
        .update({ assigned_to: staffIds })
        .eq('id', taskData.id)

      if (updateError) {
        console.error('[DEBUG] POST /api/corporate-tasks - Error updating task assigned_to:', updateError)
      } else {
        console.log('[DEBUG] POST /api/corporate-tasks - Updated assigned_to array:', staffIds.length, 'staff IDs')
        // Update taskData with the new assigned_to
        taskData.assigned_to = staffIds
      }
    }

    // Fetch staff and user details to return complete data
    let assignedUsers: any[] = []
    if (staffIds.length > 0) {
      const { data: assignmentStaffData, error: staffError } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', staffIds)
        .eq('organization_id', organization_id)

      console.log('[DEBUG] POST /api/corporate-tasks - Staff data fetched:', assignmentStaffData?.length || 0, 'Error:', staffError)

      if (assignmentStaffData && assignmentStaffData.length > 0) {
        const userIds = assignmentStaffData.map(s => s.user_id).filter(Boolean)
        console.log('[DEBUG] POST /api/corporate-tasks - User IDs to fetch:', userIds)
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('[DEBUG] POST /api/corporate-tasks - Users data fetched:', usersData?.length || 0, 'Error:', usersError)

        if (usersData && usersData.length > 0) {
          assignedUsers = assignmentStaffData.map(staff => {
            const user = usersData.find(u => u.id === staff.user_id)
            return {
              id: staff.id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown'
            }
          })
          console.log('[DEBUG] POST /api/corporate-tasks - Mapped assigned users:', assignedUsers.map(u => ({ name: u.name, email: u.email })))
        }
      }
    }

    console.log('[DEBUG] POST /api/corporate-tasks - Returning task with assigned_users:', assignedUsers.length)

    return NextResponse.json({
      ...taskData,
      assigned_users: assignedUsers,
      assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to: staffIds // Return the array of staff IDs
    })
  } catch (error) {
    console.error('Unexpected error in corporate task creation:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
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
        { message: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get the task to check organization
    const { data: existingTask, error: fetchError } = await supabase
      .from('corporate_tasks')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to update tasks in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', existingTask.organization_id)
      .eq('user_id', session.user.id)
      .single()

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', existingTask.organization_id)
        .single()

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Clean up the update data - only include fields that can be updated
    // Allowed fields: title, description, priority, status, due_date, category, project_id
    const allowedFields = ['title', 'description', 'priority', 'status', 'due_date', 'category', 'project_id']
    const cleanedUpdateData: any = {}
    
    // Only include allowed fields
    for (const field of allowedFields) {
      if (field in updateData) {
        cleanedUpdateData[field] = updateData[field]
      }
    }
    
    // Handle project_id field - convert 'no-project' to null
    if (cleanedUpdateData.project_id === 'no-project') {
      cleanedUpdateData.project_id = null
    }
    
    // Handle due_date field - convert empty string to null
    if (cleanedUpdateData.due_date === '' || cleanedUpdateData.due_date === null || cleanedUpdateData.due_date === undefined) {
      cleanedUpdateData.due_date = null
    }

    console.log('[DEBUG] PUT /api/corporate-tasks - Cleaning update data, only including allowed fields')
    console.log('[DEBUG] PUT /api/corporate-tasks - Original updateData:', updateData)
    console.log('[DEBUG] PUT /api/corporate-tasks - Original due_date:', updateData.due_date)
    console.log('[DEBUG] PUT /api/corporate-tasks - Cleaned due_date:', cleanedUpdateData.due_date)
    console.log('[DEBUG] PUT /api/corporate-tasks - Cleaned update data:', cleanedUpdateData)

    const { data, error } = await supabase
      .from('corporate_tasks')
      .update({
        ...cleanedUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[DEBUG] PUT /api/corporate-tasks - Error updating corporate task:', error)
      console.error('[DEBUG] PUT /api/corporate-tasks - Update data that failed:', cleanedUpdateData)
      return NextResponse.json(
        { message: 'Failed to update task', error: error.message, details: error.details },
        { status: 500 }
      )
    }

    // Handle assignment updates if provided - update assigned_to uuid[] array
    if (assigned_users !== undefined) {
      console.log('[DEBUG] PUT /api/corporate-tasks - Updating assigned_to array for task:', id, 'New assignments:', assigned_users)
      
      // Update the task with the new assigned_to array
      const { error: assignmentError } = await supabase
        .from('corporate_tasks')
        .update({ assigned_to: assigned_users })
        .eq('id', id)

      if (assignmentError) {
        console.error('[DEBUG] PUT /api/corporate-tasks - Error updating task assigned_to:', assignmentError)
        // Don't fail the entire operation, just log the error
      } else {
        console.log('[DEBUG] PUT /api/corporate-tasks - Updated assigned_to array:', assigned_users.length, 'staff IDs')
        // Update data with the new assigned_to
        data.assigned_to = assigned_users
      }
    }

    // Fetch staff and user details to return complete data
    const staffIds = data.assigned_to && Array.isArray(data.assigned_to) ? data.assigned_to : []
    let assignedUsers: any[] = []
    
    if (staffIds.length > 0) {
      console.log('[DEBUG] PUT /api/corporate-tasks - Fetching staff data for:', staffIds)
      
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', staffIds)
        .eq('organization_id', existingTask.organization_id)

      console.log('[DEBUG] PUT /api/corporate-tasks - Staff data fetched:', staffData?.length || 0, 'Error:', staffError)

      if (staffData && staffData.length > 0) {
        const userIds = staffData.map(s => s.user_id).filter(Boolean)
        console.log('[DEBUG] PUT /api/corporate-tasks - User IDs to fetch:', userIds)
        
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('[DEBUG] PUT /api/corporate-tasks - Users data fetched:', usersData?.length || 0, 'Error:', usersError)

        if (usersData && usersData.length > 0) {
          assignedUsers = staffData.map(staff => {
            const user = usersData.find(u => u.id === staff.user_id)
            return {
              id: staff.id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown'
            }
          })
          console.log('[DEBUG] PUT /api/corporate-tasks - Mapped assigned users:', assignedUsers.map(u => ({ name: u.name, email: u.email })))
        }
      }
    }

    console.log('[DEBUG] PUT /api/corporate-tasks - Returning task with assigned_users:', assignedUsers.length)

    return NextResponse.json({
      ...data,
      assigned_users: assignedUsers,
      assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to: staffIds // Return the array of staff IDs
    })
  } catch (error) {
    console.error('Error in corporate task update:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
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
        { message: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get the task to check organization
    const { data: existingTask, error: fetchError } = await supabase
      .from('corporate_tasks')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to delete tasks in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', existingTask.organization_id)
      .eq('user_id', session.user.id)
      .single()

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', existingTask.organization_id)
        .single()

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('corporate_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting corporate task:', error)
      return NextResponse.json(
        { message: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error in corporate task deletion:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

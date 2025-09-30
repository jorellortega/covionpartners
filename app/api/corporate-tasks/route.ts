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
      return NextResponse.json({ message: 'Failed to fetch tasks', error }, { status: 500 })
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
    const transformedData = data?.map(task => ({
      ...task,
      assigned_users: task.assigned_to?.map(staffId => {
        const staff = staffData?.find(s => s.id === staffId);
        return {
          id: staffId,
          name: staff?.user?.name || 'Unknown',
          email: staff?.user?.email || '',
          avatar_url: staff?.profile?.avatar_url || '',
          status: 'assigned',
          notes: '',
          assigned_at: task.created_at
        };
      }) || [],
      // Keep backward compatibility with single assignment
      assigned_to: task.assigned_to?.[0] || null
    })) || []

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

    // Handle multiple assignments - update the task with assigned_users array
    const staffIds = assigned_users || (assigned_to ? [assigned_to] : [])
    
    if (staffIds.length > 0) {
      const { error: updateError } = await supabase
        .from('corporate_tasks')
        .update({ assigned_to: staffIds })
        .eq('id', taskData.id)

      if (updateError) {
        console.error('Error updating task assignments:', updateError)
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json(taskData)
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

    const { data, error } = await supabase
      .from('corporate_tasks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating corporate task:', error)
      return NextResponse.json(
        { message: 'Failed to update task' },
        { status: 500 }
      )
    }

    // Handle assignment updates if provided
    if (assigned_users !== undefined) {
      // Update the task with new assigned_users array
      const { error: assignmentError } = await supabase
        .from('corporate_tasks')
        .update({ assigned_to: assigned_users })
        .eq('id', id)

      if (assignmentError) {
        console.error('Error updating task assignments:', assignmentError)
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json(data)
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

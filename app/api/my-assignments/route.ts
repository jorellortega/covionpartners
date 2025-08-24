import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 })
    }

    // Get the user's organization_staff record to get their ID
    const { data: staffRecord, error: staffError } = await supabase
      .from('organization_staff')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single()

    if (staffError || !staffRecord) {
      return NextResponse.json(
        { message: 'User not found in organization' },
        { status: 404 }
      )
    }

    const staffId = staffRecord.id

    // Fetch assigned tasks
    const { data: assignedTasks, error: tasksError } = await supabase
      .from('corporate_tasks')
      .select(`
        *,
        project:projects(id, name, description),
        assigned_by_staff:organization_staff!corporate_tasks_assigned_by_fkey(
          user:users(name, email),
          profile:profiles(avatar_url)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('assigned_to', staffId)
      .order('due_date', { ascending: true })

    if (tasksError) {
      console.error('Error fetching assigned tasks:', tasksError)
      return NextResponse.json(
        { message: 'Failed to fetch assigned tasks' },
        { status: 500 }
      )
    }

    // Fetch assigned goals
    const { data: assignedGoals, error: goalsError } = await supabase
      .from('organization_goals')
      .select(`
        *,
        assigned_by_staff:organization_staff!organization_goals_assigned_by_fkey(
          user:users(name, email),
          profile:profiles(avatar_url)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('assigned_to', staffId)
      .order('target_date', { ascending: true })

    if (goalsError) {
      console.error('Error fetching assigned goals:', goalsError)
      return NextResponse.json(
        { message: 'Failed to fetch assigned goals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tasks: assignedTasks || [],
      goals: assignedGoals || []
    })

  } catch (error) {
    console.error('Error in my-assignments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

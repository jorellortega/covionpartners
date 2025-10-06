import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this goal
    const { data: goal, error: goalError } = await supabase
      .from('organization_goals')
      .select(`
        id,
        organization_id,
        organizations!inner(
          id,
          owner_id
        )
      `)
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if user has access to the organization
    const { data: staffAccess } = await supabase
      .from('organization_staff')
      .select('id')
      .eq('organization_id', goal.organization_id)
      .eq('user_id', user.id)
      .single();

    const isOwner = goal.organizations.owner_id === user.id;
    const hasStaffAccess = !!staffAccess;

    if (!isOwner && !hasStaffAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch subtasks first
    const { data: subtasks, error: subtasksError } = await supabase
      .from('organization_goal_subtasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        created_at,
        updated_at,
        created_by
      `)
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true });

    if (subtasksError) {
      console.error('Error fetching subtasks:', subtasksError);
      return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
    }

    // Fetch user details for assigned users separately
    const assignedUserIds = subtasks?.filter(s => s.assigned_to).map(s => s.assigned_to) || [];
    let assignedUsers: any[] = [];
    
    if (assignedUserIds.length > 0) {
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select(`
          id,
          user_id
        `)
        .in('id', assignedUserIds);

      if (!staffError && staffData) {
        const userIds = staffData.map(s => s.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (!usersError && usersData) {
          assignedUsers = staffData.map(staff => {
            const user = usersData.find(u => u.id === staff.user_id);
            return {
              id: staff.id,
              user_id: staff.user_id,
              user: user || { name: 'Unknown', email: 'Unknown' }
            };
          });
        }
      }
    }

    // Transform the data to include user information
    const transformedSubtasks = subtasks?.map(subtask => ({
      ...subtask,
      assigned_user: subtask.assigned_to ? assignedUsers.find(au => au.id === subtask.assigned_to)?.user : null
    })) || [];

    return NextResponse.json(transformedSubtasks);
  } catch (error) {
    console.error('Error in GET /api/goal-subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();
    const { goalId, title, description, priority, assigned_to, due_date } = body;

    if (!goalId || !title) {
      return NextResponse.json({ error: 'Goal ID and title are required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this goal
    const { data: goal, error: goalError } = await supabase
      .from('organization_goals')
      .select(`
        id,
        organization_id,
        organizations!inner(
          id,
          owner_id
        )
      `)
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if user has access to the organization
    const { data: staffAccess } = await supabase
      .from('organization_staff')
      .select('id')
      .eq('organization_id', goal.organization_id)
      .eq('user_id', user.id)
      .single();

    const isOwner = goal.organizations.owner_id === user.id;
    const hasStaffAccess = !!staffAccess;

    if (!isOwner && !hasStaffAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create the subtask
    const { data: subtask, error: createError } = await supabase
      .from('organization_goal_subtasks')
      .insert({
        goal_id: goalId,
        title,
        description: description || null,
        priority: priority || 'medium',
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        created_by: user.id
      })
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (createError) {
      console.error('Error creating subtask:', createError);
      return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
    }

    return NextResponse.json(subtask);
  } catch (error) {
    console.error('Error in POST /api/goal-subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();
    const { id, title, description, status, priority, assigned_to, due_date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subtask ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this subtask
    const { data: subtask, error: subtaskError } = await supabase
      .from('organization_goal_subtasks')
      .select(`
        id,
        created_by,
        assigned_to,
        organization_staff!assigned_to(
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (subtaskError || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Check if user can update this subtask
    const isCreator = subtask.created_by === user.id;
    const isAssigned = subtask.assigned_to && subtask.organization_staff?.user_id === user.id;

    if (!isCreator && !isAssigned) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update the subtask
    const { data: updatedSubtask, error: updateError } = await supabase
      .from('organization_goal_subtasks')
      .update({
        title: title || subtask.title,
        description: description !== undefined ? description : subtask.description,
        status: status || subtask.status,
        priority: priority || subtask.priority,
        assigned_to: assigned_to !== undefined ? assigned_to : subtask.assigned_to,
        due_date: due_date !== undefined ? due_date : subtask.due_date
      })
      .eq('id', id)
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (updateError) {
      console.error('Error updating subtask:', updateError);
      return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
    }

    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error('Error in PUT /api/goal-subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subtask ID is required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this subtask
    const { data: subtask, error: subtaskError } = await supabase
      .from('organization_goal_subtasks')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (subtaskError || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Check if user can delete this subtask (only creator)
    if (subtask.created_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the subtask
    const { error: deleteError } = await supabase
      .from('organization_goal_subtasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting subtask:', deleteError);
      return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/goal-subtasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

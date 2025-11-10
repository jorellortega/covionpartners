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

    if (!subtasks || subtasks.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch assignments from junction table
    const subtaskIds = subtasks.map(s => s.id);
    const { data: assignments, error: assignmentsError } = await supabase
      .from('organization_goal_subtask_assignments')
      .select(`
        id,
        subtask_id,
        staff_id,
        status,
        assigned_at
      `)
      .in('subtask_id', subtaskIds);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      // Continue without assignments if there's an error
    }

    // Get all unique staff IDs from assignments
    const staffIds = assignments ? Array.from(new Set(assignments.map(a => a.staff_id))) : [];
    
    // Fetch staff and user details
    let assignedUsersMap: Map<string, any> = new Map();
    
    if (staffIds.length > 0) {
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select(`
          id,
          user_id
        `)
        .in('id', staffIds);

      if (!staffError && staffData) {
        const userIds = staffData.map(s => s.user_id);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (!usersError && usersData) {
          staffData.forEach(staff => {
            const user = usersData.find(u => u.id === staff.user_id);
            assignedUsersMap.set(staff.id, {
              id: staff.id,
              user_id: staff.user_id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown'
            });
          });
        }
      }
    }

    // Transform the data to include multiple assigned users
    const transformedSubtasks = subtasks.map(subtask => {
      const subtaskAssignments = assignments?.filter(a => a.subtask_id === subtask.id) || [];
      const assignedUsers = subtaskAssignments
        .map(assignment => assignedUsersMap.get(assignment.staff_id))
        .filter(Boolean);

      // Keep backward compatibility with single assignment
      const assignedUser = assignedUsers.length > 0 ? assignedUsers[0] : null;

      return {
        ...subtask,
        assigned_users: assignedUsers,
        assigned_user: assignedUser, // For backward compatibility
        assigned_to: assignedUsers.length > 0 ? assignedUsers[0]?.id : subtask.assigned_to // Keep for backward compatibility
      };
    });

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
    const { goalId, title, description, priority, assigned_to, assigned_users, due_date } = body;

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

    // Get the staff ID for assigned_by
    const assignedByStaffId = staffAccess?.id || null;

    // Determine which staff IDs to assign
    // Support both new array format (assigned_users) and old single format (assigned_to)
    const staffIdsToAssign = assigned_users && Array.isArray(assigned_users) 
      ? assigned_users.filter(id => id && id !== 'unassigned')
      : (assigned_to && assigned_to !== 'unassigned' ? [assigned_to] : []);

    // Create the subtask (without assigned_to for now, we'll use junction table)
    const { data: subtask, error: createError } = await supabase
      .from('organization_goal_subtasks')
      .insert({
        goal_id: goalId,
        title,
        description: description || null,
        priority: priority || 'medium',
        assigned_to: null, // We'll use junction table instead
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

    // Create assignments in junction table
    if (staffIdsToAssign.length > 0) {
      const assignments = staffIdsToAssign.map(staffId => ({
        subtask_id: subtask.id,
        staff_id: staffId,
        assigned_by: assignedByStaffId, // Can be null for owners
        status: 'assigned'
      }));

      const { error: assignmentError } = await supabase
        .from('organization_goal_subtask_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating assignments:', assignmentError);
        // Don't fail the entire operation, just log the error
      }
    }

    // Fetch the created subtask with assignments
    const { data: assignments } = await supabase
      .from('organization_goal_subtask_assignments')
      .select('id, staff_id')
      .eq('subtask_id', subtask.id);

    // Fetch staff and user details
    let assignedUsers: any[] = [];
    if (assignments && assignments.length > 0) {
      const staffIds = assignments.map(a => a.staff_id);
      const { data: staffData } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', staffIds);

      if (staffData) {
        const userIds = staffData.map(s => s.user_id);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (usersData) {
          assignedUsers = staffData.map(staff => {
            const user = usersData.find(u => u.id === staff.user_id);
            return {
              id: staff.id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown'
            };
          });
        }
      }
    }

    return NextResponse.json({
      ...subtask,
      assigned_users,
      assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to: assignedUsers.length > 0 ? assignedUsers[0]?.id : null
    });
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
    const { id, title, description, status, priority, assigned_to, assigned_users, due_date } = body;

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
        goal_id,
        created_by,
        organization_goals!inner(
          organization_id
        )
      `)
      .eq('id', id)
      .single();

    if (subtaskError || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Check if user has access to the organization
    const { data: staffAccess } = await supabase
      .from('organization_staff')
      .select('id, access_level')
      .eq('organization_id', subtask.organization_goals.organization_id)
      .eq('user_id', user.id)
      .single();

    const { data: orgData } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', subtask.organization_goals.organization_id)
      .single();

    const isOwner = orgData?.owner_id === user.id;
    const isCreator = subtask.created_by === user.id;
    const hasStaffAccess = !!staffAccess;
    const canManage = isOwner || (hasStaffAccess && staffAccess.access_level >= 4);

    // Check if user can update this subtask (creator, assigned user, or manager)
    if (!isCreator && !canManage) {
      // Check if user is assigned to this subtask (only if they have a staff record)
      if (staffAccess?.id) {
        const { data: userAssignment } = await supabase
          .from('organization_goal_subtask_assignments')
          .select('id')
          .eq('subtask_id', id)
          .eq('staff_id', staffAccess.id)
          .single();

        if (!userAssignment) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      } else {
        // User doesn't have staff record and isn't creator or manager
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Update the subtask (excluding assigned_to, we'll handle assignments separately)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date;

    const { data: updatedSubtask, error: updateError } = await supabase
      .from('organization_goal_subtasks')
      .update(updateData)
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

    // Handle assignment updates if provided
    if (assigned_users !== undefined || assigned_to !== undefined) {
      // Determine which staff IDs to assign
      const staffIdsToAssign = assigned_users && Array.isArray(assigned_users)
        ? assigned_users.filter(id => id && id !== 'unassigned')
        : (assigned_to && assigned_to !== 'unassigned' ? [assigned_to] : []);

      // Get current assignments
      const { data: currentAssignments } = await supabase
        .from('organization_goal_subtask_assignments')
        .select('staff_id')
        .eq('subtask_id', id);

      const currentStaffIds = new Set(currentAssignments?.map(a => a.staff_id) || []);
      const newStaffIds = new Set(staffIdsToAssign);

      // Get the staff ID for assigned_by
      const assignedByStaffId = staffAccess?.id;

      // Delete assignments that are no longer needed
      const toDelete = Array.from(currentStaffIds).filter(id => !newStaffIds.has(id));
      if (toDelete.length > 0) {
        await supabase
          .from('organization_goal_subtask_assignments')
          .delete()
          .eq('subtask_id', id)
          .in('staff_id', toDelete);
      }

      // Add new assignments
      const toAdd = Array.from(newStaffIds).filter(id => !currentStaffIds.has(id));
      if (toAdd.length > 0) {
        const newAssignments = toAdd.map(staffId => ({
          subtask_id: id,
          staff_id: staffId,
          assigned_by: assignedByStaffId, // Can be null for owners
          status: 'assigned'
        }));

        await supabase
          .from('organization_goal_subtask_assignments')
          .insert(newAssignments);
      }
    }

    // Fetch updated assignments
    const { data: assignments } = await supabase
      .from('organization_goal_subtask_assignments')
      .select('id, staff_id')
      .eq('subtask_id', id);

    // Fetch staff and user details
    let assignedUsers: any[] = [];
    if (assignments && assignments.length > 0) {
      const staffIds = assignments.map(a => a.staff_id);
      const { data: staffData } = await supabase
        .from('organization_staff')
        .select('id, user_id')
        .in('id', staffIds);

      if (staffData) {
        const userIds = staffData.map(s => s.user_id);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds);

        if (usersData) {
          assignedUsers = staffData.map(staff => {
            const user = usersData.find(u => u.id === staff.user_id);
            return {
              id: staff.id,
              name: user?.name || 'Unknown',
              email: user?.email || 'Unknown'
            };
          });
        }
      }
    }

    return NextResponse.json({
      ...updatedSubtask,
      assigned_users,
      assigned_user: assignedUsers.length > 0 ? assignedUsers[0] : null,
      assigned_to: assignedUsers.length > 0 ? assignedUsers[0]?.id : null
    });
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

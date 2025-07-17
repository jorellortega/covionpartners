'use client';

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Briefcase, Users, ClipboardList, Calendar, CheckCircle, Clock, AlertCircle, FileText, DollarSign, FolderKanban } from "lucide-react";

export default function WorkDashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchWorkData();
  }, [user]);

  const fetchWorkData = async () => {
    if (!user) return;
    
    try {
      console.log("Fetching work data for user:", user.id);
      
      // Fetch project role work assignments for the current user (the new system)
      const { data: projectRoleAssignments, error: projectRoleError } = await supabase
        .from("project_role_work_assignments")
        .select(`
          *,
          project:projects(name, description),
          role:project_open_roles(role_name, description)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (projectRoleError) throw projectRoleError;
      console.log("Project role assignments data:", projectRoleAssignments);

      // Fetch timeline items for these assignments
      const projectIds = (projectRoleAssignments || []).map(a => a.project_id);
      const { data: timelineItems, error: timelineError } = await supabase
        .from("timeline")
        .select("*")
        .eq("user_id", user.id)
        .in("project_id", projectIds)
        .eq("action", "work_assigned");

      if (timelineError) {
        console.error("Error fetching timeline items:", timelineError);
      }

      console.log("Timeline items found:", timelineItems);

      // Fetch task information for timeline items that have related_task_id
      const taskIds = (timelineItems || [])
        .filter(item => item.related_task_id)
        .map(item => item.related_task_id);

      console.log("Task IDs from timeline:", taskIds);

      let tasks: any[] = [];
      if (taskIds.length > 0) {
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .in("id", taskIds);

        if (taskError) {
          console.error("Error fetching tasks:", taskError);
        } else {
          tasks = taskData || [];
        }
      }

      console.log("Tasks found:", tasks);

      // Also try to fetch tasks directly assigned to the user for these projects
      const { data: directTasks, error: directTaskError } = await supabase
        .from("tasks")
        .select("*")
        .in("project_id", projectIds)
        .eq("assigned_to", user.id);

      if (directTaskError) {
        console.error("Error fetching direct tasks:", directTaskError);
      } else {
        console.log("Direct tasks found:", directTasks);
        // Merge direct tasks with timeline tasks
        tasks = [...tasks, ...(directTasks || [])];
      }

      // Map the assignments to the expected format with task information
      const allAssignments = (projectRoleAssignments || []).map(assignment => {
        const timelineItem = (timelineItems || []).find(item => 
          item.project_id === assignment.project_id && 
          item.user_id === assignment.user_id &&
          item.action === 'work_assigned'
        );
        
        console.log(`Looking for task for assignment ${assignment.id}:`, {
          project_id: assignment.project_id,
          user_id: assignment.user_id,
          timelineItem: timelineItem,
          timelineTaskId: timelineItem?.related_task_id
        });

        // Try to find task from timeline first
        let task = timelineItem?.related_task_id ? 
          tasks.find(t => t.id === timelineItem.related_task_id) : null;

        // If no task found from timeline, try to find a task assigned to this user in this project
        if (!task) {
          task = tasks.find(t => 
            t.project_id === assignment.project_id && 
            t.assigned_to === assignment.user_id
          );
        }

        console.log(`Task found for assignment ${assignment.id}:`, task);

        return {
          ...assignment,
          type: 'project_role',
          title: assignment.project_title,
          description: assignment.work_description || assignment.role?.description || "No description available",
          category: assignment.role?.role_name || "Project Role",
          assignedTask: task
        };
      });

      console.log("Mapped assignments:", allAssignments);
      setAssignments(allAssignments);
    } catch (error: any) {
      console.error("Error fetching work data:", error);
      toast.error("Failed to fetch work data");
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      // Find the assignment
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      console.log("Assignment data:", assignment);
      console.log("Assignment project_id:", assignment.project_id);
      console.log("Assignment project:", assignment.project);

      // If starting work, add user to project team
      if (status === 'in_progress') {
        await addUserToProjectTeam(assignment);
      }

      // Update the project role work assignment
      const { error } = await supabase
        .from("project_role_work_assignments")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", assignmentId);

      if (error) throw error;

      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId ? { ...assignment, status } : assignment
      ));

      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const addUserToProjectTeam = async (assignment: any) => {
    if (!user || !assignment.project_id) return;

    try {
      console.log("Starting addUserToProjectTeam with:", { user: user.id, project_id: assignment.project_id });
      
      // First, validate that the project exists
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', assignment.project_id)
        .single();

      if (projectError || !projectData) {
        console.error("Project not found:", assignment.project_id);
        toast.error("Project not found. Cannot add to team.");
        return;
      }

      console.log("Project found:", projectData);
      
      // Check if user is already a team member
      const { data: existingMember, error: checkError } = await supabase
        .from("team_members")
        .select("id")
        .eq("project_id", assignment.project_id)
        .eq("user_id", user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing member:", checkError);
        throw checkError;
      }

      if (existingMember) {
        console.log("User already a team member");
        return;
      }

      // Add user to project team with all correct columns
      const teamMemberData = {
        project_id: assignment.project_id,
        user_id: user.id,
        role: 'member', // Use a valid team_members role value
        project_role: assignment.role?.role_name || 'member', // Keep the original role name in project_role
        status: 'approved',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("Adding team member with data:", teamMemberData);

      const { data: insertData, error: teamError } = await supabase
        .from("team_members")
        .insert(teamMemberData)
        .select();

      if (teamError) {
        console.error("Error adding user to team:", teamError);
        console.error("Error details:", {
          message: teamError.message,
          details: teamError.details,
          hint: teamError.hint,
          code: teamError.code
        });
        
        // Provide specific error messages
        if (teamError.code === '23503') {
          toast.error("Foreign key constraint failed. Project or user not found.");
        } else {
          toast.error("Failed to add user to team: " + (teamError.message || 'Unknown error'));
        }
        return;
      }

      console.log("Successfully added team member:", insertData);

      // Create timeline item for the work assignment
      await createWorkTimelineItem(assignment);

      toast.success("Added to project team and created timeline item");
    } catch (error) {
      console.error("Error adding user to project team:", error);
      toast.error("Failed to add user to project team");
    }
  };

  const createWorkTimelineItem = async (assignment: any) => {
    if (!user || !assignment.project_id) return;

    try {
      const timelineData = {
        project_id: assignment.project_id,
        type: 'task',
        title: assignment.project_title || assignment.title,
        description: assignment.work_description || assignment.description,
        due_date: assignment.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'in_progress',
        progress: 0,
        assignee_name: user.email,
        created_by: user.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("timeline")
        .insert(timelineData);

      if (error) {
        console.error("Error creating timeline item:", error);
      }
    } catch (error) {
      console.error("Error creating timeline item:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-block px-3 py-1 rounded-full font-semibold text-sm";
    switch (status) {
      case 'assigned':
        return `${baseClasses} bg-blue-900/40 text-blue-400 border border-blue-500/50`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-900/40 text-yellow-400 border border-yellow-500/50`;
      case 'completed':
        return `${baseClasses} bg-green-900/40 text-green-400 border border-green-500/50`;
      case 'cancelled':
        return `${baseClasses} bg-red-900/40 text-red-400 border border-red-500/50`;
      default:
        return `${baseClasses} bg-gray-900/40 text-gray-400 border border-gray-500/50`;
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen text-gray-400">Loading...</div>;
  }
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="leonardo-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 py-4 px-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-blue-400" /> Work Dashboard
          </h1>
          <p className="text-gray-400 text-base">Track your assigned work and submissions</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="flex gap-4 mb-6">
              <Button 
                onClick={() => window.location.href = '/workmode'}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
              >
                <FolderKanban className="w-4 h-4 mr-2" />
                Go to Workmode
              </Button>
              <Button 
                onClick={() => {
                  setLoading(true);
                  fetchWorkData();
                }}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600/20"
                disabled={loading}
              >
                <Clock className="w-4 h-4 mr-2" />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {/* Assigned Work */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">Assigned Work</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {assignments.length} assignments
                </Badge>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No work assignments yet.</p>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {assignment.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2">
                              {assignment.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {assignment.type === 'project_role' ? (
                                  <>Start: {assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : "Not set"}</>
                                ) : (
                                  <>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "Not set"}</>
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {assignment.category}
                              </span>
                              {assignment.type === 'project_role' && assignment.hourly_rate && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${assignment.hourly_rate}/hr
                                </span>
                              )}
                            </div>
                            
                            {/* Show additional details for project role assignments */}
                            {assignment.type === 'project_role' && (
                              <div className="mt-3 space-y-2">
                                {/* Assigned Task Information */}
                                {assignment.assignedTask && (
                                  <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="w-4 h-4 text-blue-400" />
                                      <span className="text-sm font-medium text-blue-400">Assigned Task</span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-white mb-1">
                                      {assignment.assignedTask.title}
                                    </h4>
                                    <p className="text-xs text-gray-300 mb-2">
                                      {assignment.assignedTask.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                      <span>Due: {assignment.assignedTask.due_date ? new Date(assignment.assignedTask.due_date).toLocaleDateString() : "Not set"}</span>
                                      <span>Priority: {assignment.assignedTask.priority}</span>
                                      <span>Status: {assignment.assignedTask.status}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {assignment.deliverables && (
                                  <div className="bg-gray-900 p-2 rounded">
                                    <p className="text-xs text-gray-400 mb-1">Deliverables:</p>
                                    <p className="text-sm text-gray-300">{assignment.deliverables}</p>
                                  </div>
                                )}
                                {assignment.timeline_days && (
                                  <div className="text-xs text-gray-400">
                                    Timeline: {assignment.timeline_days} days
                                  </div>
                                )}
                                {assignment.payment_terms && (
                                  <div className="text-xs text-gray-400">
                                    Payment: {assignment.payment_terms}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={getStatusBadge(assignment.status)}>
                            {assignment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {(assignment.notes || assignment.milestones) && (
                          <div className="bg-gray-900 p-3 rounded mb-3">
                            {assignment.notes && (
                              <p className="text-gray-300 text-sm mb-2">{assignment.notes}</p>
                            )}
                            {assignment.milestones && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">Milestones:</p>
                                <p className="text-sm text-gray-300">{assignment.milestones}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {(assignment.status === 'assigned' || assignment.status === 'active') && (
                            <Button
                              onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Start Work
                            </Button>
                          )}
                          {assignment.status === 'in_progress' && (
                            <>
                              <Button
                                onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Complete
                              </Button>
                              {assignment.project_id && (
                                <Button
                                  onClick={() => window.location.href = `/workmode?project=${assignment.project_id}`}
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                                >
                                  <FolderKanban className="w-4 h-4 mr-2" />
                                  Go to Workmode
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>


          </>
        )}
      </main>
    </div>
  );
} 
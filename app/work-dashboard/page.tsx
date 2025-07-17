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
import { Briefcase, Users, ClipboardList, Calendar, CheckCircle, Clock, AlertCircle, FileText, DollarSign } from "lucide-react";

export default function WorkDashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [approvedPositionsCount, setApprovedPositionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchWorkData();
  }, [user]);

  const fetchWorkData = async () => {
    if (!user) return;
    
    try {
      // Fetch work assignments for the current user (work submissions)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("work_assignments")
        .select(`
          *,
          work_submissions:submission_id(*)
        `)
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });

      if (assignmentError) throw assignmentError;

      // Fetch project role work assignments for the current user
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

      // Fetch user's own submissions
      const { data: submissionData, error: submissionError } = await supabase
        .from("work_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (submissionError) throw submissionError;

      // Check for approved positions that need setup
      await checkApprovedPositions();

      // Combine both types of assignments
      const allAssignments = [
        ...(assignmentData || []).map(assignment => ({
          ...assignment,
          type: 'work_submission',
          title: assignment.work_submissions?.title || "Untitled Project",
          description: assignment.work_submissions?.description || "No description available",
          category: assignment.work_submissions?.category || "General"
        })),
        ...(projectRoleAssignments || []).map(assignment => ({
          ...assignment,
          type: 'project_role',
          title: assignment.project_title,
          description: assignment.work_description || assignment.role?.description || "No description available",
          category: assignment.role?.role_name || "Project Role"
        }))
      ];

      setAssignments(allAssignments);
      setSubmissions(submissionData || []);
    } catch (error: any) {
      toast.error("Failed to fetch work data");
    } finally {
      setLoading(false);
    }
  };

  const checkApprovedPositions = async () => {
    if (!user) return;
    
    try {
      // Count approved job applications
      const { count: jobCount, error: jobError } = await supabase
        .from("job_applications")
        .select("*", { count: 'exact', head: true })
        .eq("applicant_id", user.id)
        .eq("status", "accepted");

      // Count approved project role applications  
      const { count: roleCount, error: roleError } = await supabase
        .from("project_role_applications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("status", "approved");

      if (jobError || roleError) {
        console.error("Error checking approved positions:", jobError || roleError);
        return;
      }

      // Get existing work assignments to filter out already converted positions
      const { data: assignments } = await supabase
        .from("work_assignments")
        .select("metadata")
        .eq("assigned_to", user.id);

      const convertedApplications = assignments?.filter(a => 
        a.metadata?.application_id && 
        (a.metadata?.type === 'job_application' || a.metadata?.type === 'project_role_application')
      ).length || 0;

      const totalApproved = (jobCount || 0) + (roleCount || 0);
      setApprovedPositionsCount(Math.max(0, totalApproved - convertedApplications));
    } catch (error) {
      console.error("Error checking approved positions:", error);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      // Find the assignment to determine its type
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      // Update based on assignment type
      if (assignment.type === 'project_role') {
        const { error } = await supabase
          .from("project_role_work_assignments")
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq("id", assignmentId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("work_assignments")
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq("id", assignmentId);

        if (error) throw error;
      }

      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId ? { ...assignment, status } : assignment
      ));

      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      toast.error("Failed to update status");
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
            {/* Approved Positions Alert */}
            {approvedPositionsCount > 0 && (
              <Card className="leonardo-card border-yellow-600 bg-yellow-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-yellow-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-200">
                          {approvedPositionsCount} Approved Position{approvedPositionsCount > 1 ? 's' : ''} Need Setup
                        </h3>
                        <p className="text-yellow-300/80 text-sm">
                          You have approved job/project applications that need to be converted to work assignments.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => window.location.href = '/approved-positions'}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      Set Up Work
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                            <Button
                              onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Submissions */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-lg text-white">My Submissions</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {submissions.length} submissions
                </Badge>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No submissions yet.</p>
                    <Button 
                      onClick={() => window.location.href = '/work-submission'}
                      className="bg-cyan-700 text-white hover:bg-cyan-600"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Submit Work Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {submission.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2">
                              {submission.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {submission.category}
                              </span>
                              {submission.budget_min && submission.budget_max && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${submission.budget_min} - ${submission.budget_max}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(submission.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(submission.status)}>
                            {submission.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {submission.admin_notes && (
                          <div className="bg-yellow-900/20 border border-yellow-600/50 p-3 rounded">
                            <p className="text-yellow-200 text-sm">
                              <strong>Admin Notes:</strong> {submission.admin_notes}
                            </p>
                          </div>
                        )}
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
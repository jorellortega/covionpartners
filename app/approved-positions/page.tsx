'use client';

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Briefcase, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Building,
  User,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApprovedJobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  applied_at: string;
  job?: {
    title: string;
    company: string;
    salary_min?: number;
    salary_max?: number;
    job_type: string;
    location?: string;
    remote: boolean;
    description: string;
    employer_id: string;
  };
}

interface ApprovedRoleApplication {
  id: string;
  project_id: string;
  role_id: string;
  user_id: string;
  role_name: string;
  status: string;
  created_at: string;
  project?: {
    name: string;
    description: string;
    owner_id: string;
  };
}

interface WorkSetup {
  title: string;
  description: string;
  requirements: string;
  timeline_days: number;
  budget_min: number;
  budget_max: number;
  start_date: string;
  deliverables: string;
  notes: string;
}

export default function ApprovedPositionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobApplications, setJobApplications] = useState<ApprovedJobApplication[]>([]);
  const [roleApplications, setRoleApplications] = useState<ApprovedRoleApplication[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<WorkSetup>({
    title: "",
    description: "",
    requirements: "",
    timeline_days: 30,
    budget_min: 0,
    budget_max: 0,
    start_date: new Date().toISOString().split('T')[0],
    deliverables: "",
    notes: ""
  });
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchApprovedPositions();
  }, [user]);

  const fetchApprovedPositions = async () => {
    if (!user) return;
    
    try {
      // Fetch approved job applications
      const { data: jobData, error: jobError } = await supabase
        .from("job_applications")
        .select(`
          *,
          job:jobs(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .order("applied_at", { ascending: false });

      if (jobError) throw jobError;

      // Fetch approved project role applications
      const { data: roleData, error: roleError } = await supabase
        .from("project_role_applications")
        .select(`
          *,
          project:projects(*)
        `)
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (roleError) throw roleError;

      // Filter out positions that have already been converted to work assignments
      const existingAssignments = await checkExistingAssignments(
        [...(jobData || []), ...(roleData || [])],
        user.id
      );

      const filteredJobs = (jobData || []).filter(job => 
        !existingAssignments.some(assignment => 
          assignment.metadata?.application_id === job.id && 
          assignment.metadata?.type === 'job_application'
        )
      );

      const filteredRoles = (roleData || []).filter(role => 
        !existingAssignments.some(assignment => 
          assignment.metadata?.application_id === role.id && 
          assignment.metadata?.type === 'project_role_application'
        )
      );

      setJobApplications(filteredJobs);
      setRoleApplications(filteredRoles);
    } catch (error: any) {
      toast.error("Failed to fetch approved positions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingAssignments = async (applications: any[], userId: string) => {
    if (applications.length === 0) return [];
    
    const applicationIds = applications.map(app => app.id);
    
    const { data, error } = await supabase
      .from("work_assignments")
      .select("metadata")
      .eq("assigned_to", userId)
      .in("metadata->application_id", applicationIds);

    if (error) {
      console.error("Error checking existing assignments:", error);
      return [];
    }

    return data || [];
  };

  const handleSetupPosition = (position: any, type: 'job' | 'role') => {
    setSelectedPosition({ ...position, type });
    
    // Pre-fill setup data based on position type
    if (type === 'job') {
      setSetupData({
        title: position.job?.title || "",
        description: position.job?.description || "",
        requirements: "",
        timeline_days: 30,
        budget_min: position.job?.salary_min || 0,
        budget_max: position.job?.salary_max || 0,
        start_date: new Date().toISOString().split('T')[0],
        deliverables: "",
        notes: `Job position at ${position.job?.company || 'Unknown Company'}`
      });
    } else {
      setSetupData({
        title: position.role_name || "",
        description: position.project?.description || "",
        requirements: "",
        timeline_days: 30,
        budget_min: 0,
        budget_max: 0,
        start_date: new Date().toISOString().split('T')[0],
        deliverables: "",
        notes: `Project role in ${position.project?.name || 'Unknown Project'}`
      });
    }
    
    setShowSetup(true);
  };

  const handleConvertToWork = async () => {
    if (!selectedPosition || !user) return;
    
    setConverting(true);
    try {
      // Create work submission first
      const submissionData = {
        user_id: user.id,
        title: setupData.title,
        description: setupData.description,
        category: selectedPosition.type === 'job' ? 'employment' : 'project_work',
        budget_min: setupData.budget_min,
        budget_max: setupData.budget_max,
        timeline_days: setupData.timeline_days,
        deliverables: setupData.deliverables,
        additional_requirements: setupData.requirements,
        status: 'approved', // Auto-approve since this comes from approved applications
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      const { data: submission, error: submissionError } = await supabase
        .from("work_submissions")
        .insert(submissionData)
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Create work assignment
      const assignmentData = {
        submission_id: submission.id,
        assigned_to: user.id,
        assigned_by: selectedPosition.type === 'job' 
          ? selectedPosition.job?.employer_id 
          : selectedPosition.project?.owner_id,
        status: "assigned",
        start_date: setupData.start_date,
        due_date: new Date(Date.now() + setupData.timeline_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: setupData.notes,
        metadata: {
          application_id: selectedPosition.id,
          type: selectedPosition.type === 'job' ? 'job_application' : 'project_role_application',
          original_position: selectedPosition.type === 'job' 
            ? selectedPosition.job?.title 
            : selectedPosition.role_name,
          company_or_project: selectedPosition.type === 'job' 
            ? selectedPosition.job?.company 
            : selectedPosition.project?.name
        }
      };

      const { error: assignmentError } = await supabase
        .from("work_assignments")
        .insert(assignmentData);

      if (assignmentError) throw assignmentError;

      toast.success("Position converted to work assignment successfully!");
      setShowSetup(false);
      setSelectedPosition(null);
      
      // Refresh the list
      fetchApprovedPositions();
      
      // Redirect to work dashboard after a moment
      setTimeout(() => {
        window.location.href = '/work-dashboard';
      }, 2000);

    } catch (error: any) {
      toast.error("Failed to convert position to work assignment");
      console.error(error);
    } finally {
      setConverting(false);
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
            <CheckCircle className="w-7 h-7 text-green-400" /> Approved Positions
          </h1>
          <p className="text-gray-400 text-base">
            Convert your approved applications into structured work assignments
          </p>
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
                onClick={() => window.location.href = '/work-dashboard'}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Work Dashboard
              </Button>
            </div>

            {/* Approved Job Applications */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-lg text-white">Approved Job Applications</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {jobApplications.length} positions
                </Badge>
              </CardHeader>
              <CardContent>
                {jobApplications.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No approved job applications to set up.</p>
                ) : (
                  <div className="space-y-4">
                    {jobApplications.map((application) => (
                      <div key={application.id} className="border border-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {application.job?.title || "Unknown Position"}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                              <span className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                {application.job?.company || "Unknown Company"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Applied: {new Date(application.applied_at).toLocaleDateString()}
                              </span>
                              {application.job?.salary_min && application.job?.salary_max && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${application.job.salary_min.toLocaleString()} - ${application.job.salary_max.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {application.job?.description || "No description available"}
                            </p>
                          </div>
                          <Badge className="bg-green-900/40 text-green-400 border border-green-500/50">
                            Accepted
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t border-gray-700">
                          <Button
                            onClick={() => handleSetupPosition(application, 'job')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Set Up Work Assignment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Project Role Applications */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-lg text-white">Approved Project Roles</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {roleApplications.length} roles
                </Badge>
              </CardHeader>
              <CardContent>
                {roleApplications.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No approved project roles to set up.</p>
                ) : (
                  <div className="space-y-4">
                    {roleApplications.map((application) => (
                      <div key={application.id} className="border border-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {application.role_name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {application.project?.name || "Unknown Project"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Applied: {new Date(application.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {application.project?.description || "No description available"}
                            </p>
                          </div>
                          <Badge className="bg-green-900/40 text-green-400 border border-green-500/50">
                            Approved
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 pt-3 border-t border-gray-700">
                          <Button
                            onClick={() => handleSetupPosition(application, 'role')}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Set Up Work Assignment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Empty State */}
            {jobApplications.length === 0 && roleApplications.length === 0 && (
              <Card className="leonardo-card border-gray-800">
                <CardContent className="text-center py-16">
                  <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">All Set!</h3>
                  <p className="text-gray-400 mb-6">
                    You don't have any approved positions waiting to be set up.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      onClick={() => window.location.href = '/work-dashboard'}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Go to Work Dashboard
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/jobs'}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Browse Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      {/* Setup Work Assignment Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Set Up Work Assignment</DialogTitle>
            <DialogDescription className="text-gray-400">
              Define the work requirements, timeline, and payment details for your approved position.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Work Title</Label>
                <Input
                  id="title"
                  value={setupData.title}
                  onChange={(e) => setSetupData({...setupData, title: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter work title"
                />
              </div>
              <div>
                <Label htmlFor="timeline" className="text-gray-300">Timeline (Days)</Label>
                <Input
                  id="timeline"
                  type="number"
                  value={setupData.timeline_days}
                  onChange={(e) => setSetupData({...setupData, timeline_days: parseInt(e.target.value) || 30})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={setupData.description}
                onChange={(e) => setSetupData({...setupData, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Describe the work to be done"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="requirements" className="text-gray-300">Requirements</Label>
              <Textarea
                id="requirements"
                value={setupData.requirements}
                onChange={(e) => setSetupData({...setupData, requirements: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="List specific requirements and expectations"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min" className="text-gray-300">Budget Min ($)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={setupData.budget_min}
                  onChange={(e) => setSetupData({...setupData, budget_min: parseFloat(e.target.value) || 0})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="budget_max" className="text-gray-300">Budget Max ($)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={setupData.budget_max}
                  onChange={(e) => setSetupData({...setupData, budget_max: parseFloat(e.target.value) || 0})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="start_date" className="text-gray-300">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={setupData.start_date}
                onChange={(e) => setSetupData({...setupData, start_date: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="deliverables" className="text-gray-300">Expected Deliverables</Label>
              <Textarea
                id="deliverables"
                value={setupData.deliverables}
                onChange={(e) => setSetupData({...setupData, deliverables: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="List what should be delivered upon completion"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-300">Additional Notes</Label>
              <Textarea
                id="notes"
                value={setupData.notes}
                onChange={(e) => setSetupData({...setupData, notes: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Any additional notes or context"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowSetup(false)}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToWork}
              disabled={converting || !setupData.title || !setupData.description}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {converting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Work Assignment
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
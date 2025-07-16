"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  DollarSign, 
  Calendar, 
  Eye,
  FileText,
  UserCheck,
  Building,
  Mail,
  Globe,
  ExternalLink
} from "lucide-react";

export default function AdminWorkSubmissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("work-submissions");
  const [loading, setLoading] = useState(true);
  
  // Work Submissions
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignment, setAssignment] = useState({
    assigned_to: "",
    start_date: "",
    due_date: "",
    notes: ""
  });
  const [adminNotes, setAdminNotes] = useState("");

  // Job Applications
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [selectedJobApplication, setSelectedJobApplication] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Project Role Applications
  const [roleApplications, setRoleApplications] = useState<any[]>([]);
  const [selectedRoleApplication, setSelectedRoleApplication] = useState<any>(null);
  const [showRoleDetails, setShowRoleDetails] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSubmissions(),
      fetchJobApplications(),
      fetchRoleApplications()
    ]);
    setLoading(false);
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("work_submissions")
        .select(`
          *,
          submitter:user_id(name,email),
          approver:approved_by(name,email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch submissions");
    }
  };

  const fetchJobApplications = async () => {
    try {
      // First get job applications
      const { data: applications, error: appError } = await supabase
        .from("job_applications")
        .select("*")
        .order("applied_at", { ascending: false });

      if (appError) throw appError;

      if (!applications || applications.length === 0) {
        setJobApplications([]);
        return;
      }

      // Get unique user IDs and job IDs
      const userIds = [...new Set(applications.map(app => app.user_id).filter(Boolean))];
      const jobIds = [...new Set(applications.map(app => app.job_id))];

      // Fetch user data
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);

      // Fetch job data
      const { data: jobs, error: jobError } = await supabase
        .from("jobs")
        .select("id, title, company, salary_min, salary_max")
        .in("id", jobIds);

      if (userError || jobError) {
        console.error("Error fetching related data:", { userError, jobError });
      }

      // Create maps for easy lookup
      const usersMap = new Map(users?.map(u => [u.id, u]) || []);
      const jobsMap = new Map(jobs?.map(j => [j.id, j]) || []);

      // Combine data
      const enrichedApplications = applications.map(app => ({
        ...app,
        user: usersMap.get(app.user_id) || null,
        job: jobsMap.get(app.job_id) || null
      }));

      setJobApplications(enrichedApplications);
    } catch (error: any) {
      toast.error("Failed to fetch job applications");
    }
  };

  const fetchRoleApplications = async () => {
    try {
      // First get role applications
      const { data: applications, error: appError } = await supabase
        .from("project_role_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (appError) throw appError;

      if (!applications || applications.length === 0) {
        setRoleApplications([]);
        return;
      }

      // Get unique user IDs and project IDs
      const userIds = [...new Set(applications.map(app => app.user_id))];
      const projectIds = [...new Set(applications.map(app => app.project_id))];

      // Fetch user data
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);

      // Fetch project data
      const { data: projects, error: projectError } = await supabase
        .from("projects")
        .select("id, name, description")
        .in("id", projectIds);

      if (userError || projectError) {
        console.error("Error fetching related data:", { userError, projectError });
      }

      // Create maps for easy lookup
      const usersMap = new Map(users?.map(u => [u.id, u]) || []);
      const projectsMap = new Map(projects?.map(p => [p.id, p]) || []);

      // Combine data
      const enrichedApplications = applications.map(app => ({
        ...app,
        user: usersMap.get(app.user_id) || null,
        project: projectsMap.get(app.project_id) || null
      }));

      setRoleApplications(enrichedApplications);
    } catch (error: any) {
      toast.error("Failed to fetch role applications");
    }
  };

  const handleStatusUpdate = async (submissionId: string, status: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === "approved") {
        updateData.approved_by = user?.id;
        updateData.approved_at = new Date().toISOString();
      }

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from("work_submissions")
        .update(updateData)
        .eq("id", submissionId);

      if (error) throw error;

      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId ? { ...sub, ...updateData } : sub
      ));

      toast.success(`Submission ${status} successfully`);
      setAdminNotes("");
    } catch (error: any) {
      toast.error("Failed to update submission");
    }
  };

  const handleJobApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) throw error;

      // Find the application to get user and job details
      const application = jobApplications.find(app => app.id === applicationId);
      
      if (application && (status === 'accepted' || status === 'rejected' || status === 'shortlisted')) {
        let notificationTitle = "";
        let notificationContent = "";
        
        switch (status) {
          case 'accepted':
            notificationTitle = `Your job application has been accepted!`;
            notificationContent = `Congratulations! Your application for the ${application.job?.title} position at ${application.job?.company} has been accepted. You should expect to hear from them soon regarding next steps.`;
            break;
          case 'rejected':
            notificationTitle = `Your job application has been rejected`;
            notificationContent = `Unfortunately, your application for the ${application.job?.title} position at ${application.job?.company} has been rejected. Keep applying to other opportunities!`;
            break;
          case 'shortlisted':
            notificationTitle = `You've been shortlisted for a job!`;
            notificationContent = `Good news! Your application for the ${application.job?.title} position at ${application.job?.company} has been shortlisted. You're one step closer to getting the job!`;
            break;
        }

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: application.user_id,
            type: "job_application",
            title: notificationTitle,
            content: notificationContent,
            metadata: {
              application_id: applicationId,
              job_id: application.job_id,
              job_title: application.job?.title || "Unknown Job",
              company: application.job?.company || "Unknown Company",
              status: status,
              updated_by: user?.id
            }
          });

        if (notificationError) {
          console.error("Failed to create notification:", notificationError);
          // Don't throw error, just log it so the main operation still succeeds
        }
      }

      setJobApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));

      toast.success(`Job application ${status} successfully`);
    } catch (error: any) {
      toast.error("Failed to update job application");
    }
  };

  const handleRoleApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("project_role_applications")
        .update({ status })
        .eq("id", applicationId);

      if (error) throw error;

      // Find the application to get user and project details
      const application = roleApplications.find(app => app.id === applicationId);
      
      if (application && (status === 'accepted' || status === 'rejected')) {
        // Create notification for the applicant
        const notificationTitle = status === 'accepted' 
          ? `Your application for ${application.role_name} has been accepted!`
          : `Your application for ${application.role_name} has been rejected`;
        
        const notificationContent = status === 'accepted'
          ? `Congratulations! Your application for the ${application.role_name} position in the project "${application.project?.name}" has been accepted. You can now start working on this project.`
          : `Unfortunately, your application for the ${application.role_name} position in the project "${application.project?.name}" has been rejected. Don't worry, there are many other opportunities available.`;

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: application.user_id,
            type: "project_role_application",
            title: notificationTitle,
            content: notificationContent,
            metadata: {
              application_id: applicationId,
              project_id: application.project_id,
              project_name: application.project?.name || "Unknown Project",
              role_name: application.role_name,
              status: status,
              updated_by: user?.id
            }
          });

        if (notificationError) {
          console.error("Failed to create notification:", notificationError);
          // Don't throw error, just log it so the main operation still succeeds
        }
      }

      setRoleApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));

      toast.success(`Role application ${status} successfully`);
    } catch (error: any) {
      toast.error("Failed to update role application");
    }
  };

  const handleAssignWork = async () => {
    if (!selectedSubmission || !assignment.assigned_to) {
      toast.error("Please select a worker and fill in required fields");
      return;
    }

    try {
      // Create work assignment
      const { error: assignmentError } = await supabase
        .from("work_assignments")
        .insert({
          submission_id: selectedSubmission.id,
          assigned_to: assignment.assigned_to,
          assigned_by: user?.id,
          start_date: assignment.start_date,
          due_date: assignment.due_date,
          notes: assignment.notes,
          status: "assigned"
        });

      if (assignmentError) throw assignmentError;

      // Update submission status
      const { error: updateError } = await supabase
        .from("work_submissions")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedSubmission.id);

      if (updateError) throw updateError;

      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id ? { ...sub, status: "in_progress" } : sub
      ));

      toast.success("Work assigned successfully");
      setShowAssign(false);
      setAssignment({ assigned_to: "", start_date: "", due_date: "", notes: "" });
    } catch (error: any) {
      toast.error("Failed to assign work");
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-block px-3 py-1 rounded-full font-semibold text-sm";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-900/40 text-yellow-400 border border-yellow-500/50`;
      case 'approved':
      case 'accepted':
        return `${baseClasses} bg-green-900/40 text-green-400 border border-green-500/50`;
      case 'denied':
      case 'rejected':
        return `${baseClasses} bg-red-900/40 text-red-400 border border-red-500/50`;
      case 'in_progress':
      case 'reviewed':
      case 'shortlisted':
        return `${baseClasses} bg-blue-900/40 text-blue-400 border border-blue-500/50`;
      case 'completed':
        return `${baseClasses} bg-purple-900/40 text-purple-400 border border-purple-500/50`;
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
        <div className="max-w-6xl mx-auto flex flex-col gap-2 py-4 px-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-blue-400" /> Applications Management
          </h1>
          <p className="text-gray-400 text-base">Manage work submissions, job applications, and project role applications</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="work-submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Work Submissions ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="job-applications" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Job Applications ({jobApplications.length})
            </TabsTrigger>
            <TabsTrigger value="role-applications" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Project Role Applications ({roleApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* Work Submissions Tab */}
          <TabsContent value="work-submissions">
            {loading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : submissions.length === 0 ? (
              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-400">No work submissions found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="leonardo-card border-gray-800">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {submission.title}
                              </h3>
                              <p className="text-gray-400 text-sm mb-2">
                                Submitted by {submission.submitter?.name || submission.submitter?.email}
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
                                {submission.timeline_days && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {submission.timeline_days} days
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusBadge(submission.status)}>
                              {submission.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                            {submission.description}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {submission.skills_required?.map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:flex-shrink-0">
                          <Dialog open={showDetails && selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                            setShowDetails(open);
                            if (open) setSelectedSubmission(submission);
                            else setSelectedSubmission(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full lg:w-auto">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Work Submission Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Project Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-400">Title:</span> {submission.title}</p>
                                    <p><span className="text-gray-400">Category:</span> {submission.category}</p>
                                    <p><span className="text-gray-400">Description:</span></p>
                                    <p className="text-gray-300 bg-gray-900 p-3 rounded">{submission.description}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-gray-400 text-sm">Budget Range</p>
                                    <p className="text-white">
                                      ${submission.budget_min || '0'} - ${submission.budget_max || '0'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-400 text-sm">Timeline</p>
                                    <p className="text-white">{submission.timeline_days || 'Not specified'} days</p>
                                  </div>
                                </div>

                                {submission.deliverables && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Deliverables</p>
                                    <p className="text-gray-300 bg-gray-900 p-3 rounded">{submission.deliverables}</p>
                                  </div>
                                )}

                                {submission.additional_requirements && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Additional Requirements</p>
                                    <p className="text-gray-300 bg-gray-900 p-3 rounded">{submission.additional_requirements}</p>
                                  </div>
                                )}

                                <div>
                                  <p className="text-gray-400 text-sm mb-2">Admin Notes</p>
                                  <Textarea
                                    placeholder="Add admin notes..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2 pt-4">
                                  {submission.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => handleStatusUpdate(submission.id, 'approved')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Button
                                        onClick={() => handleStatusUpdate(submission.id, 'denied')}
                                        variant="destructive"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Deny
                                      </Button>
                                    </>
                                  )}
                                  {submission.status === 'approved' && (
                                    <Button
                                      onClick={() => {
                                        setSelectedSubmission(submission);
                                        setShowAssign(true);
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <User className="w-4 h-4 mr-2" />
                                      Assign Work
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {submission.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleStatusUpdate(submission.id, 'approved')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleStatusUpdate(submission.id, 'denied')}
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Job Applications Tab */}
          <TabsContent value="job-applications">
            {loading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : jobApplications.length === 0 ? (
              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-400">No job applications found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobApplications.map((application) => (
                  <Card key={application.id} className="leonardo-card border-gray-800">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {application.job?.title || 'Job Title Not Available'}
                              </h3>
                              <p className="text-gray-400 text-sm mb-2">
                                <span className="flex items-center gap-1">
                                  <Building className="w-4 h-4" />
                                  {application.job?.company || 'Company Not Available'}
                                </span>
                              </p>
                              <p className="text-gray-400 text-sm mb-2">
                                Applied by: {application.user?.name || application.user?.email || 'User Not Available'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(application.applied_at).toLocaleDateString()}
                                </span>
                                {application.job?.salary_min && application.job?.salary_max && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    ${application.job.salary_min} - ${application.job.salary_max}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusBadge(application.status)}>
                              {application.status}
                            </Badge>
                          </div>
                          
                          {application.cover_letter && (
                            <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                              {application.cover_letter}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:flex-shrink-0">
                          <Dialog open={showJobDetails && selectedJobApplication?.id === application.id} onOpenChange={(open) => {
                            setShowJobDetails(open);
                            if (open) setSelectedJobApplication(application);
                            else setSelectedJobApplication(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full lg:w-auto">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Job Application Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Job Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-400">Position:</span> {application.job?.title}</p>
                                    <p><span className="text-gray-400">Company:</span> {application.job?.company}</p>
                                    <p><span className="text-gray-400">Applied:</span> {new Date(application.applied_at).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-white mb-2">Applicant Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-400">Name:</span> {application.user?.name || 'N/A'}</p>
                                    <p><span className="text-gray-400">Email:</span> {application.user?.email || 'N/A'}</p>
                                  </div>
                                </div>

                                {application.cover_letter && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Cover Letter</p>
                                    <p className="text-gray-300 bg-gray-900 p-3 rounded">{application.cover_letter}</p>
                                  </div>
                                )}

                                {application.resume_url && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Resume</p>
                                    <a 
                                      href={application.resume_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      View Resume
                                    </a>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                  {application.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => handleJobApplicationStatus(application.id, 'reviewed')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Mark as Reviewed
                                      </Button>
                                      <Button
                                        onClick={() => handleJobApplicationStatus(application.id, 'shortlisted')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Shortlist
                                      </Button>
                                      <Button
                                        onClick={() => handleJobApplicationStatus(application.id, 'rejected')}
                                        variant="destructive"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {application.status === 'shortlisted' && (
                                    <Button
                                      onClick={() => handleJobApplicationStatus(application.id, 'accepted')}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Accept
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {application.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleJobApplicationStatus(application.id, 'shortlisted')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Shortlist
                              </Button>
                              <Button
                                onClick={() => handleJobApplicationStatus(application.id, 'rejected')}
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Project Role Applications Tab */}
          <TabsContent value="role-applications">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Project Role Applications</h3>
                <p className="text-sm text-gray-400">Review and manage applications for project roles</p>
              </div>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                onClick={() => window.open('/open-roles', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Open Roles
              </Button>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : roleApplications.length === 0 ? (
              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-400">No project role applications found.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {roleApplications.map((application) => (
                  <Card key={application.id} className="leonardo-card border-gray-800">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {application.role_name}
                              </h3>
                              <p className="text-gray-400 text-sm mb-2">
                                <span className="flex items-center gap-1">
                                  <Globe className="w-4 h-4" />
                                  {application.project?.name || 'Project Not Available'}
                                </span>
                              </p>
                              <p className="text-gray-400 text-sm mb-2">
                                Applied by: {application.user?.name || application.user?.email || 'User Not Available'}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(application.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {application.user?.email || 'No email'}
                                </span>
                              </div>
                            </div>
                            <Badge className={getStatusBadge(application.status)}>
                              {application.status}
                            </Badge>
                          </div>
                          
                          {application.cover_letter && (
                            <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                              {application.cover_letter}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:flex-shrink-0">
                          <Dialog open={showRoleDetails && selectedRoleApplication?.id === application.id} onOpenChange={(open) => {
                            setShowRoleDetails(open);
                            if (open) setSelectedRoleApplication(application);
                            else setSelectedRoleApplication(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full lg:w-auto">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Project Role Application Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold text-white mb-2">Role Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-400">Role:</span> {application.role_name}</p>
                                    <p><span className="text-gray-400">Project:</span> {application.project?.name}</p>
                                    <p><span className="text-gray-400">Applied:</span> {new Date(application.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-white mb-2">Applicant Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-400">Name:</span> {application.user?.name || 'N/A'}</p>
                                    <p><span className="text-gray-400">Email:</span> {application.user?.email || 'N/A'}</p>
                                  </div>
                                </div>

                                {application.cover_letter && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Cover Letter</p>
                                    <p className="text-gray-300 bg-gray-900 p-3 rounded">{application.cover_letter}</p>
                                  </div>
                                )}

                                {application.experience && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Experience</p>
                                    <p className="text-gray-300 bg-gray-900 p-3 rounded">{application.experience}</p>
                                  </div>
                                )}

                                {application.portfolio_url && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Portfolio</p>
                                    <a 
                                      href={application.portfolio_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      View Portfolio
                                    </a>
                                  </div>
                                )}

                                {application.social_links && (
                                  <div>
                                    <p className="text-gray-400 text-sm mb-2">Social Links</p>
                                    <p className="text-gray-300 bg-gray-900 p-3 rounded">{application.social_links}</p>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                  {application.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => handleRoleApplicationStatus(application.id, 'accepted')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Accept
                                      </Button>
                                      <Button
                                        onClick={() => handleRoleApplicationStatus(application.id, 'rejected')}
                                        variant="destructive"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {application.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleRoleApplicationStatus(application.id, 'accepted')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                onClick={() => handleRoleApplicationStatus(application.id, 'rejected')}
                                size="sm"
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Assign Work Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Work</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assign to Worker</label>
              <Select value={assignment.assigned_to} onValueChange={(value) => setAssignment({ ...assignment, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker1">John Doe (Web Developer)</SelectItem>
                  <SelectItem value="worker2">Jane Smith (UI/UX Designer)</SelectItem>
                  <SelectItem value="worker3">Mike Johnson (Content Writer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={assignment.start_date}
                onChange={(e) => setAssignment({ ...assignment, start_date: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <input
                type="date"
                value={assignment.due_date}
                onChange={(e) => setAssignment({ ...assignment, due_date: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add assignment notes..."
                value={assignment.notes}
                onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
                rows={3}
              />
            </div>
            
            <Button onClick={handleAssignWork} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Assign Work
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
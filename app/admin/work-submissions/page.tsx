"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Briefcase, CheckCircle, XCircle, Clock, User, DollarSign, Calendar, Eye } from "lucide-react";

export default function AdminWorkSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!user) return;
    fetchSubmissions();
  }, [user]);

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
    } finally {
      setLoading(false);
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
        return `${baseClasses} bg-green-900/40 text-green-400 border border-green-500/50`;
      case 'denied':
        return `${baseClasses} bg-red-900/40 text-red-400 border border-red-500/50`;
      case 'rejected':
        return `${baseClasses} bg-red-900/40 text-red-400 border border-red-500/50`;
      case 'in_progress':
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
            <Briefcase className="w-7 h-7 text-blue-400" /> Work Submissions Management
          </h1>
          <p className="text-gray-400 text-base">Review and manage work for hire submissions</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 space-y-6">
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
                            <DialogTitle>Submission Details</DialogTitle>
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
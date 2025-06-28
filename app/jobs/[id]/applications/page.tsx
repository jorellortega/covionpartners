'use client'
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function JobApplicationsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string
  const { user, loading: userLoading } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast();
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ];
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, { id: string; name: string }>>({})

  useEffect(() => {
    async function fetchJobAndApplications() {
      setLoading(true)
      setError(null)
      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      if (jobError) {
        setError('Job not found')
        setLoading(false)
        return
      }
      setJob(jobData)
      // Check permission
      if (!user || jobData.employer_id !== user.id) {
        setError('You do not have permission to view applications for this job.')
        setLoading(false)
        return
      }
      // Fetch applications
      const { data: apps, error: appsError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false })
      if (appsError) {
        setError('Failed to load applications')
      } else {
        setApplications(apps)
        // Fetch user profiles for applications with user_id
        const userIds = apps.filter(a => a.user_id).map(a => a.user_id)
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds)
          const profileMap: Record<string, { id: string; name: string }> = {}
          profiles?.forEach((p: { id: string; name: string }) => { profileMap[p.id] = p })
          setUserProfiles(profileMap)
        }
      }
      setLoading(false)
    }
    if (jobId && user && !userLoading) fetchJobAndApplications()
  }, [jobId, user, userLoading])

  const handleStatusChange = async (appId: string, newStatus: string) => {
    // Debug: log values before update
    console.log("Updating application", appId, "to status", newStatus, typeof newStatus);
    if (!appId || typeof appId !== "string" || !newStatus || typeof newStatus !== "string") {
      toast({ title: "Invalid data", description: "App ID or status is invalid", variant: "destructive" });
      return;
    }
    setUpdatingId(appId);
    const { error } = await supabase
      .from('job_applications')
      .update({ status: newStatus })
      .eq('id', appId);
    setUpdatingId(null);
    if (error) {
      console.error("Supabase update error:", error);
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    } else {
      setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      toast({ title: 'Status updated', description: 'Application status updated successfully.' });
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-500">Error</h2>
          <p className="text-gray-400">{error}</p>
          <Button onClick={() => router.push(`/jobs/${jobId}`)}>Back to Job</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push(`/jobs/${jobId}`)} className="text-gray-400 hover:text-white mr-2">
            Back to Job
          </Button>
          <h1 className="text-2xl font-bold ml-4">Applications for: {job?.title}</h1>
        </div>
        {applications.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No applications yet.</div>
        ) : (
          <div className="space-y-6">
            {applications.map(app => (
              <div key={app.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
                  <div>
                    <div className="font-bold text-lg text-blue-300">
                      {app.user_id && userProfiles[String(app.user_id)] ? (
                        <Link href={`/profile/${app.user_id}`} className="hover:underline text-blue-400">
                          {userProfiles[String(app.user_id)].name || app.name}
                        </Link>
                      ) : (
                        app.name
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">{app.email}</div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    <div className="text-xs text-gray-400">Applied: {app.applied_at ? new Date(app.applied_at).toLocaleString() : '-'}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      Status:
                      <Select value={app.status} onValueChange={val => handleStatusChange(app.id, val)} disabled={updatingId === app.id}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {updatingId === app.id && <span className="text-blue-400 ml-2">Updating...</span>}
                    </div>
                  </div>
                </div>
                {app.resume_url && (
                  <div className="mt-2">
                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View Resume</a>
                  </div>
                )}
                {app.cover_letter && (
                  <div className="mt-2 text-gray-300">
                    <div className="font-semibold">Cover Letter:</div>
                    <div>{app.cover_letter}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
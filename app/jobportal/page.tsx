"use client"
import Link from 'next/link';
import { Briefcase, Plus, Users, Settings, FileText, ClipboardList, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function JobPortalPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, applications: 0, organizations: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [recentPostedApps, setRecentPostedApps] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      // Fetch jobs and organizations in parallel
      const [{ data: jobsData }, { data: orgsData }] = await Promise.all([
        supabase.from('jobs').select('*').eq('poster_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('organizations').select('id, name, slug, logo, banner').eq('owner_id', user!.id)
      ]);
      // Merge organization info into each job
      const jobsWithOrg = (jobsData || []).map(job => {
        const org = orgsData?.find(org => org.id === job.organization_id);
        return {
          ...job,
          organization: org ? { ...org } : undefined
        };
      });
      // Fetch applications submitted by the user
      const { data: appsData } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user!.id)
        .order('applied_at', { ascending: false });
      // Fetch applications for jobs the user posted
      let postedApps: any[] = [];
      if (jobsWithOrg.length > 0) {
        const jobIds = jobsWithOrg.map(j => j.id);
        const { data: postedAppsData } = await supabase
          .from('job_applications')
          .select('*')
          .in('job_id', jobIds)
          .order('applied_at', { ascending: false });
        postedApps = postedAppsData || [];
      }
      setStats({
        jobs: jobsWithOrg.length,
        applications: appsData?.length || 0,
        organizations: orgsData?.length || 0,
      });
      setRecentJobs(jobsWithOrg.slice(0, 3));
      setRecentApps(appsData?.slice(0, 3) || []);
      setRecentPostedApps(postedApps.slice(0, 3));
      setOrgs(orgsData || []);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  // Only use conditional for rendering, not for skipping hooks
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-400" />
            Job Portal
          </h1>
          <p className="text-gray-400 mb-6">Please log in to view your job dashboard.</p>
          <Link href="/login">
            <button className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition">Login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-blue-400" />
          Job Portal
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Stats */}
          <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 flex items-center gap-4">
              <Briefcase className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.jobs}</div>
                <div className="text-gray-400">Jobs Posted</div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 flex items-center gap-4">
              <ClipboardList className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.applications}</div>
                <div className="text-gray-400">Applications</div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 flex items-center gap-4">
              <Building2 className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.organizations}</div>
                <div className="text-gray-400">Organizations</div>
              </div>
            </div>
          </div>
          {/* Recent Jobs */}
          <div className="md:col-span-2 bg-gray-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Recent Jobs</h2>
            </div>
            {loading ? <div className="text-gray-400">Loading...</div> : recentJobs.length === 0 ? <div className="text-gray-400">No jobs posted yet.</div> : (
              <ul className="space-y-2">
                {recentJobs.map(job => (
                  <li key={job.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-800 rounded-lg px-4 py-2">
                    <div>
                      <span className="text-white font-medium">{job.title}</span>
                      {job.organization && (
                        <span className="ml-2 text-xs text-blue-300">@ {job.organization.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <span className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString()}</span>
                      <span className={`text-xs ml-2 ${job.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>{job.status || 'closed'}</span>
                      <Link href={`/jobs/${job.id}`} className="ml-4 text-blue-400 hover:underline text-xs">View</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Recent Applications (user's own) */}
          <div className="md:col-span-2 bg-gray-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Recent Applications</h2>
            </div>
            {loading ? <div className="text-gray-400">Loading...</div> : recentApps.length === 0 ? <div className="text-gray-400">No applications yet.</div> : (
              <ul className="space-y-2">
                {recentApps.map(app => (
                  <li key={app.id} className="flex justify-between items-center bg-gray-800 rounded-lg px-4 py-2">
                    <span className="text-white font-medium">{app.job_title || app.job_id}</span>
                    <span className="text-xs text-gray-400">{new Date(app.applied_at).toLocaleDateString()}</span>
                    <span className={`text-xs ml-2 ${app.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'}`}>{app.status}</span>
                    <Link href={`/jobs/${app.job_id || ''}`} className="ml-4 text-blue-400 hover:underline text-xs">View</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Recent Applications for Jobs I Posted */}
          <div className="md:col-span-4 bg-gray-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">Recent Applications for My Jobs</h2>
            </div>
            {loading ? <div className="text-gray-400">Loading...</div> : recentPostedApps.length === 0 ? <div className="text-gray-400">No applications for your jobs yet.</div> : (
              <ul className="space-y-2">
                {recentPostedApps.map(app => (
                  <li key={app.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-800 rounded-lg px-4 py-2">
                    <div>
                      <span className="text-white font-medium">{app.job_title || app.job_id}</span>
                      <span className="ml-2 text-xs text-blue-300">Applicant: {app.user_id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <span className="text-xs text-gray-400">{new Date(app.applied_at).toLocaleDateString()}</span>
                      <span className={`text-xs ml-2 ${app.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'}`}>{app.status}</span>
                      <Link href={`/jobs/${app.job_id || ''}`} className="ml-4 text-blue-400 hover:underline text-xs">View</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Quick Actions */}
          <div className="md:col-span-4 mt-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/jobs">
                <button className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition">
                  <Briefcase className="w-5 h-5" />
                  View Job Board
                </button>
              </Link>
              <Link href="/jobs/post">
                <button className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-black/70 border border-gray-700 hover:bg-black/90 transition">
                  <Plus className="w-5 h-5" />
                  Post a Job
                </button>
              </Link>
              <Link href="/admin/organizations/create">
                <button className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-black/70 border border-gray-700 hover:bg-black/90 transition">
                  <Briefcase className="w-5 h-5" />
                  Create Organization
                </button>
              </Link>
              <Link href="/myorganizations">
                <button className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-black/70 border border-gray-700 hover:bg-black/90 transition">
                  <Users className="w-5 h-5" />
                  My Organizations
                </button>
              </Link>
              <Link href="/jobs/applications">
                <button className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white bg-black/70 border border-gray-700 hover:bg-black/90 transition">
                  <Users className="w-5 h-5" />
                  My Job Applications
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
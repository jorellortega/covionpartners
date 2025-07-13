"use client"

import { useRouter, useParams } from "next/navigation"
import { mockJobs, mockCompanies } from "@/app/jobs/mockJobs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ExternalLink, Linkedin, Globe, Users, Briefcase, MapPin, Settings, Pencil, CheckCircle, FolderKanban, Star, MessageSquare, Calendar, DollarSign, TrendingUp, Handshake } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"

export default function CompanyProfilePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const { user } = useAuth()
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoHover, setLogoHover] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerHover, setBannerHover] = useState(false)

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) setError(error.message)
      setCompany(data)
      setLoading(false)
    }
    fetchCompany()
  }, [slug])

  useEffect(() => {
    if (!company?.id) return;
    async function fetchProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', company.id)
      if (data) setProjects(data)
    }
    fetchProjects()
  }, [company?.id])

  useEffect(() => {
    if (!company?.id) return;
    async function fetchJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('organization_id', company.id)
      if (data) setJobs(data)
    }
    fetchJobs()
  }, [company?.id])

  // Handler for logo upload
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !company) return;
    setLogoUploading(true);
    const file = e.target.files[0];
    try {
      const fileExt = file.name.split('.').pop();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `org-logos/${company.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('partnerfiles').getPublicUrl(filePath);
      await supabase.from('organizations').update({ logo: data.publicUrl }).eq('id', company.id);
      window.location.reload();
    } catch (err) {
      alert('Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  // Handler for banner upload
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !company) return;
    setBannerUploading(true);
    const file = e.target.files[0];
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `user_banners/${company.id}_${Date.now()}_${sanitizedFileName}`;
    const { error } = await supabase.storage.from('partnerfiles').upload(filePath, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('partnerfiles').getPublicUrl(filePath);
      await supabase.from('organizations').update({ banner: data.publicUrl }).eq('id', company.id);
      window.location.reload();
    }
    setBannerUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    )
  }
  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
          <Button onClick={() => router.push('/jobs')}>Back to Jobs</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => router.push('/jobs')} className="text-gray-400 hover:text-white">
            Back to Jobs
          </Button>
          <div className="flex gap-2 items-center">
            <Button onClick={() => router.push(`/company/${slug}/job-history`)} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              Job History
            </Button>
            {user && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Organization Settings"
                onClick={() => router.push(`/companysettings?org=${company.id}`)}
                className="ml-2"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center gap-6 mb-6">
          <div
            className="relative group"
            onMouseEnter={() => setLogoHover(true)}
            onMouseLeave={() => setLogoHover(false)}
            style={{ width: '6rem', height: '6rem' }}
          >
            <img
              src={company.logo}
              alt={company.name + " logo"}
              className="w-24 h-24 rounded-lg object-contain bg-white border border-gray-200 shadow"
            />
            {user && company.owner_id === user.id && (
              <>
                <label htmlFor="logo-upload" className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg cursor-pointer transition-opacity duration-200 ${logoHover ? 'opacity-100' : 'opacity-0'}`}
                  style={{ pointerEvents: logoHover ? 'auto' : 'none' }}
                >
                  <Pencil className="w-7 h-7 text-white" />
                  <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} disabled={logoUploading} className="hidden" />
                </label>
                {logoUploading && <span className="absolute bottom-0 left-0 right-0 text-xs text-blue-400 bg-black/70 text-center rounded-b-lg">Uploading...</span>}
              </>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">{company.name}</h1>
            <div className="flex flex-wrap gap-2 items-center text-gray-400 mb-2">
              <MapPin className="w-4 h-4" /> {company.location}
              <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {company.industry}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {company.employees} employees</span>
              <span>Founded {company.founded}</span>
            </div>
            <div className="flex gap-3 items-center mt-2">
              {company.website && (
                <a href={
                  company.website?.startsWith('http://') || company.website?.startsWith('https://')
                    ? company.website
                    : `https://${company.website}`
                } target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                  <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {company.socials?.linkedin && (
                <a href={company.socials.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              )}
              {company.socials?.twitter && (
                <a href={company.socials.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 0 0 1.963-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 16.11 4c-2.48 0-4.49 2.01-4.49 4.49 0 .352.04.695.116 1.022C7.728 9.37 4.1 7.6 1.67 4.905c-.386.664-.607 1.437-.607 2.26 0 1.56.795 2.936 2.006 3.744a4.48 4.48 0 0 1-2.034-.563v.057c0 2.18 1.55 4.002 3.604 4.418-.377.102-.775.157-1.185.157-.29 0-.57-.028-.844-.08.57 1.78 2.23 3.08 4.2 3.12A8.98 8.98 0 0 1 2 19.54a12.7 12.7 0 0 0 6.88 2.02c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.1 9.1 0 0 0 24 4.59a8.98 8.98 0 0 1-2.54.697z"/></svg>
                  Twitter
                </a>
              )}
            </div>
          </div>
        </div>
        {/* Banner */}
        <div
          className="w-full h-56 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-6 relative group"
          onMouseEnter={() => setBannerHover(true)}
          onMouseLeave={() => setBannerHover(false)}
        >
          <img
            src={company.banner || "/placeholder.jpg"}
            alt={company.name + " banner"}
            className="w-full h-full object-cover"
          />
          {user && company.owner_id === user.id && (
            <>
              <label
                htmlFor="banner-upload"
                className={`absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity duration-200 ${bannerHover ? 'opacity-100' : 'opacity-0'}`}
                style={{ pointerEvents: bannerHover ? 'auto' : 'none' }}
              >
                <Pencil className="w-8 h-8 text-white" />
                <Input id="banner-upload" type="file" accept="image/*" onChange={handleBannerChange} disabled={bannerUploading} className="hidden" />
              </label>
              {bannerUploading && <span className="absolute bottom-2 left-2 text-xs text-blue-400 bg-black/70 px-2 py-1 rounded">Uploading...</span>}
            </>
          )}
        </div>
        {/* Company Stats Card - Upgraded Look */}
        <div className="mb-6">
          <div className="flex flex-row flex-wrap gap-2 justify-center items-center">
            <div className="flex items-center gap-1 bg-blue-900/30 rounded-full px-3 py-1 shadow-sm min-w-[90px]">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-blue-200 text-sm">{jobs.length}</span>
              <span className="text-xs text-gray-400 ml-1">Jobs Posted</span>
            </div>
            <div className="flex items-center gap-1 bg-green-900/30 rounded-full px-3 py-1 shadow-sm min-w-[90px]">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="font-bold text-green-200 text-sm">{Math.floor(jobs.length * 0.7)}</span>
              <span className="text-xs text-gray-400 ml-1">Hired</span>
            </div>
            <div className="flex items-center gap-1 bg-purple-900/30 rounded-full px-3 py-1 shadow-sm min-w-[110px]">
              <FolderKanban className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-purple-200 text-sm">{projects.filter((p: any) => p.visibility === 'public').length}</span>
              <span className="text-xs text-gray-400 ml-1">Public Projects</span>
            </div>
            <div className="flex items-center gap-1 bg-pink-900/30 rounded-full px-3 py-1 shadow-sm min-w-[110px]">
              <Handshake className="w-4 h-4 text-pink-400" />
              <span className="font-bold text-pink-200 text-sm">7</span>
              <span className="text-xs text-gray-400 ml-1">Deals</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-900/30 rounded-full px-3 py-1 shadow-sm min-w-[90px]">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-yellow-200 text-sm">4.8</span>
              <span className="text-xs text-gray-400 ml-1">Rating</span>
            </div>
            <div className="flex items-center gap-1 bg-orange-900/30 rounded-full px-3 py-1 shadow-sm min-w-[110px]">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-orange-200 text-sm">12</span>
              <span className="text-xs text-gray-400 ml-1">Reviews</span>
            </div>
            <div className="flex items-center gap-1 bg-lime-900/30 rounded-full px-3 py-1 shadow-sm min-w-[110px]">
              <Calendar className="w-4 h-4 text-lime-400" />
              <span className="font-bold text-lime-200 text-sm">{company.founded ? (new Date().getFullYear() - Number(company.founded)) : '—'}</span>
              <span className="text-xs text-gray-400 ml-1">Years</span>
            </div>
            <div className="flex items-center gap-1 bg-emerald-900/30 rounded-full px-3 py-1 shadow-sm min-w-[120px]">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-emerald-200 text-sm">5</span>
              <span className="text-xs text-gray-400 ml-1">Projects Funded</span>
            </div>
            <div className="flex items-center gap-1 bg-indigo-900/30 rounded-full px-3 py-1 shadow-sm min-w-[120px]">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-indigo-200 text-sm">3</span>
              <span className="text-xs text-gray-400 ml-1">Funded Projects</span>
            </div>
          </div>
        </div>
        {/* About */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">About {company.name}</h2>
          <p className="text-gray-200 whitespace-pre-line">{company.description}</p>
        </div>
        {/* Open Jobs */}
        <h2 className="text-xl font-semibold mb-4">Open Jobs at {company.name}</h2>
        <div className="space-y-4 mb-8">
          {jobs.length === 0 && <div className="text-gray-400">No jobs found for this company.</div>}
          {jobs.map((job: any) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
              <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-gray-800 hover:border-blue-500/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/10 cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-400 group-hover:underline">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {job.location || 'Remote'}
                    {job.remote && <Badge variant="secondary" className="ml-2">Remote</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-300 line-clamp-2 mb-2">{job.description}</div>
                  <div className="flex flex-wrap gap-2">
                    {(job.skills || []).map((skill: any) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {/* Media Section */}
        {company.media && company.media.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {company.media.map((item: any, idx: number) => (
                item.type === "image" ? (
                  <div key={idx} className="rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
                    <img src={item.url} alt={item.title} className="w-full h-48 object-cover" />
                    <div className="p-2 text-gray-300 text-center text-sm">{item.title}</div>
                  </div>
                ) : (
                  <div key={idx} className="rounded-lg overflow-hidden border border-gray-800 bg-gray-900 flex flex-col items-center">
                    <iframe
                      width="100%"
                      height="220"
                      src={item.url}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full"
                    />
                    <div className="p-2 text-gray-300 text-center text-sm">{item.title}</div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
        {/* Team Section */}
        {company.team && company.team.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Team</h2>
            <div className="flex flex-wrap gap-6">
              {company.team.map((member: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center w-32">
                  <img src={member.photo} alt={member.name} className="w-20 h-20 rounded-full object-cover border border-gray-700 mb-2" />
                  <div className="font-semibold text-gray-200 text-center">{member.name}</div>
                  <div className="text-xs text-gray-400 text-center">{member.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Projects */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.filter((project: any) => project.visibility === 'public').length === 0 && <div className="text-gray-400">No public projects found for this company.</div>}
            {projects.filter((project: any) => project.visibility === 'public').map((project: any) => (
              <Link key={project.id} href={`/publicprojects/${project.id}`} className="block group">
                <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-gray-800 group-hover:border-blue-500/40 transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-blue-400">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-300">{project.description}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
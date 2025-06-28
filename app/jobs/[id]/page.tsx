"use client"

import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign, Users, Eye, ArrowLeft, Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import { Job } from "@/app/types"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Input } from "@/components/ui/input"

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string
  const [job, setJob] = useState<Job | null>(null)
  const [organization, setOrganization] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerHover, setBannerHover] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      if (error) {
        setError(error.message)
        setJob(null)
      } else {
        setJob(data as Job)
        if (data && data.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id, name, slug, logo, banner, owner_id')
            .eq('id', data.organization_id)
            .single()
          setOrganization(orgData)
        } else {
          setOrganization(null)
        }
      }
      setLoading(false)
    }
    if (jobId) fetchJob()
  }, [jobId])

  // Handler for logo upload
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !organization) return;
    setLogoUploading(true);
    const file = e.target.files[0];
    const filePath = `user_logos/${organization.id}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('partnerfiles').upload(filePath, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('partnerfiles').getPublicUrl(filePath);
      await supabase.from('organizations').update({ logo: data.publicUrl }).eq('id', organization.id);
      window.location.reload();
    }
    setLogoUploading(false);
  };

  // Handler for organization banner upload
  const handleOrgBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !job) return;
    setBannerUploading(true);
    const file = e.target.files[0];
    const filePath = `job_banners/${job.id}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('partnerfiles').upload(filePath, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('partnerfiles').getPublicUrl(filePath);
      await supabase.from('jobs').update({ job_image_url: data.publicUrl }).eq('id', job.id);
      window.location.reload();
    }
    setBannerUploading(false);
  };

  if (user && organization) {
    console.log('user.id:', user.id, 'organization.owner_id:', organization.owner_id);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-500">Job Not Found</h2>
          <p className="text-gray-400">{error || "No job found with this ID."}</p>
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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/jobs/${job.id}/edit`)} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              Edit
            </Button>
            {user && job.employer_id === user.id && (
              <Button onClick={() => router.push(`/jobs/${job.id}/applications`)} variant="outline">
                View Applications
              </Button>
            )}
          </div>
        </div>
        {/* Banner */}
        <div
          className="w-full h-56 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center mb-6 relative group"
          onMouseEnter={() => setBannerHover(true)}
          onMouseLeave={() => setBannerHover(false)}
        >
          <img
            src={job.job_image_url || organization?.banner || "/placeholder.jpg"}
            alt={job.title + " banner"}
            className="w-full h-full object-cover"
          />
          {user && job.employer_id === user.id && (
            <>
              <label
                htmlFor="org-banner-upload"
                className={`absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity duration-200 ${bannerHover ? 'opacity-100' : 'opacity-0'}`}
                style={{ pointerEvents: bannerHover ? 'auto' : 'none' }}
              >
                <Pencil className="w-8 h-8 text-white" />
                <Input id="org-banner-upload" type="file" accept="image/*" onChange={handleOrgBannerChange} disabled={bannerUploading} className="hidden" />
              </label>
              {bannerUploading && <span className="absolute bottom-2 left-2 text-xs text-blue-400 bg-black/70 px-2 py-1 rounded">Uploading...</span>}
            </>
          )}
        </div>
        {/* Logo and Title */}
        <div className="flex items-center gap-4 mb-4">
          {organization?.slug ? (
            <Link href={`/company/${organization.slug}`}> 
              <img
                src={(organization as any)?.logo || job.thumbnail_url || "/placeholder-logo.png"}
                alt={(organization.name || job.company) + " logo"}
                className="w-16 h-16 rounded-lg object-contain bg-white border border-gray-200 shadow cursor-pointer hover:scale-105 transition"
              />
            </Link>
          ) : (
            <img
              src={(organization as any)?.logo || job.thumbnail_url || "/placeholder-logo.png"}
              alt={job.company + " logo"}
              className="w-16 h-16 rounded-lg object-contain bg-white border border-gray-200 shadow"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-1">{job.title}</h1>
            {organization?.slug ? (
              <Link href={`/company/${organization.slug}`} className="text-blue-400 font-medium text-lg hover:underline">
                {organization.name}
              </Link>
            ) : organization ? (
              <span className="text-blue-400 font-medium text-lg">{organization.name}</span>
            ) : (
              <span className="text-blue-400 font-medium text-lg">{job.company}</span>
            )}
            {user && organization && organization.owner_id === user.id && (
              <div className="mt-2">
                <label className="text-xs text-gray-300 cursor-pointer">
                  Edit Logo
                  <Input type="file" accept="image/*" onChange={handleLogoChange} disabled={logoUploading} className="hidden" />
                </label>
                {logoUploading && <span className="text-blue-400 text-xs ml-2">Uploading...</span>}
              </div>
            )}
          </div>
        </div>
        {/* Meta */}
        <div className="flex flex-wrap gap-4 mb-6 text-gray-400">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location || 'Remote'}</span>
          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary_currency} {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{job.views_count}</span>
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{job.applications_count}</span>
          <Badge variant="outline">{job.job_type.replace('-', ' ')}</Badge>
          {job.remote && <Badge variant="secondary">Remote</Badge>}
        </div>
        {/* Description */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Job Description</h2>
          <p className="text-gray-200 whitespace-pre-line">{job.description}</p>
        </div>
        {/* Requirements */}
        {job.requirements && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Requirements</h2>
            <p className="text-gray-200 whitespace-pre-line">{job.requirements}</p>
          </div>
        )}
        {/* Benefits */}
        {job.benefits && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Benefits</h2>
            <p className="text-gray-200 whitespace-pre-line">{job.benefits}</p>
          </div>
        )}
        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        )}
        {/* Apply Button */}
        <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 mt-8" onClick={() => router.push(`/jobs/${job.id}/apply`)}>
          Apply for this Job
        </Button>
      </div>
    </div>
  )
} 
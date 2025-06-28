"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Trash2, Save, Image as ImageIcon, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"

const jobTypes = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" }
]

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" }
]

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "closed", label: "Closed" }
]

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string
  const [form, setForm] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerHover, setBannerHover] = useState(false)

  useEffect(() => {
    async function fetchJob() {
      setFetching(true)
      setError(null)
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()
      if (error) {
        setError(error.message)
        setForm(null)
      } else {
        setForm(data)
        if (data.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('id, name, logo, banner, owner_id')
            .eq('id', data.organization_id)
            .single()
          setOrganization(orgData)
        } else {
          setOrganization(null)
        }
      }
      setFetching(false)
    }
    if (jobId) fetchJob()
  }, [jobId])

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (error || !form) {
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

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const updateData = { ...form }
    delete updateData.id
    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push(`/jobs/${jobId}`)
    }
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this job? This cannot be undone.")) {
      setLoading(true)
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
      setLoading(false)
      if (!error) {
        router.push('/jobs')
      } else {
        setError(error.message)
      }
    }
  }

  // Handler for organization banner upload
  const handleOrgBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !form) return;
    setBannerUploading(true);
    const file = e.target.files[0];
    const filePath = `job_banners/${form.id}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('partnerfiles').upload(filePath, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('partnerfiles').getPublicUrl(filePath);
      setForm((prev: any) => ({ ...prev, job_image_url: data.publicUrl }));
      await supabase.from('jobs').update({ job_image_url: data.publicUrl }).eq('id', form.id);
    }
    setBannerUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push(`/jobs/${form.id}`)} className="text-gray-400 hover:text-white mr-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>
          <h1 className="text-2xl font-bold ml-4">Edit Job</h1>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Organization Banner */}
          {organization && (
            <div className="mb-4">
              <Label>Job Banner</Label>
              <div
                className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center group"
                onMouseEnter={() => setBannerHover(true)}
                onMouseLeave={() => setBannerHover(false)}
              >
                <img
                  src={form.job_image_url || organization.banner || "/placeholder.jpg"}
                  alt="Job Banner"
                  className="w-full h-full object-cover"
                />
                {form.employer_id === organization.owner_id && (
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
            </div>
          )}
          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={value => handleChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* If filled, just show a message for now */}
          {form.status === "filled" && (
            <div className="space-y-2">
              <Label>This job is marked as filled. (User tagging not implemented)</Label>
            </div>
          )}
          <div>
            <Label htmlFor="title">Job Title *</Label>
            <Input id="title" value={form.title ?? ''} onChange={e => handleChange('title', e.target.value)} required />
          </div>
          {form.organization_id ? (
            <div>
              <Label>Organization</Label>
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded px-4 py-2">
                {organization?.logo && (
                  <img src={organization.logo} alt="Org Logo" className="w-8 h-8 rounded object-contain bg-white border" />
                )}
                <span className="font-semibold text-white">{organization?.name || form.company}</span>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <Input id="company" value={form.company ?? ''} onChange={e => handleChange('company', e.target.value)} required />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location ?? ''} onChange={e => handleChange('location', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="job_type">Job Type *</Label>
              <Select value={form.job_type ?? ''} onValueChange={value => handleChange('job_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="remote" checked={form.remote} onCheckedChange={checked => handleChange('remote', checked)} />
            <Label htmlFor="remote">Remote position</Label>
          </div>
          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea id="description" value={form.description ?? ''} onChange={e => handleChange('description', e.target.value)} rows={5} required />
          </div>
          <div>
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" value={form.requirements ?? ''} onChange={e => handleChange('requirements', e.target.value)} rows={3} />
          </div>
          <div>
            <Label htmlFor="benefits">Benefits</Label>
            <Textarea id="benefits" value={form.benefits || ''} onChange={e => handleChange('benefits', e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary_min">Min Salary</Label>
              <Input id="salary_min" type="number" value={form.salary_min || ''} onChange={e => handleChange('salary_min', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="salary_max">Max Salary</Label>
              <Input id="salary_max" type="number" value={form.salary_max || ''} onChange={e => handleChange('salary_max', e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="salary_currency">Currency</Label>
            <Input id="salary_currency" value={form.salary_currency} onChange={e => handleChange('salary_currency', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="experience_level">Experience Level</Label>
            <Select value={form.experience_level || ''} onValueChange={value => handleChange('experience_level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="education_level">Education Level</Label>
            <Input id="education_level" value={form.education_level || ''} onChange={e => handleChange('education_level', e.target.value)} />
          </div>
          <div className="flex gap-4 mt-8">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Job
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
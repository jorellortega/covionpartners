"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, UploadCloud } from "lucide-react"
import { Job } from "@/app/types"
import { supabase } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"

export default function JobApplyPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "" })
  const [resume, setResume] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user: authUser } = useAuth()

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
      }
      setLoading(false)
    }
    if (jobId) fetchJob()
  }, [jobId])

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

  const handleChange = (e: any) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setResume(file)
      setUploading(true)
      setSubmitError(null)
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const filePath = `resumes/${jobId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file)
      if (uploadError) {
        setSubmitError('Resume upload failed: ' + uploadError.message)
        setUploading(false)
        return
      }
      // Get public URL
      const { data: urlData } = supabase.storage.from('partnerfiles').getPublicUrl(filePath)
      setResumeUrl(urlData.publicUrl)
      setUploading(false)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    if (!resumeUrl) {
      setSubmitError('Please upload your resume.')
      setSubmitting(false)
      return
    }
    // Insert application into job_applications table
    const { error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        user_id: authUser ? authUser.id : null,
        name: form.name,
        email: form.email,
        resume_url: resumeUrl,
        status: 'pending',
        applied_at: new Date().toISOString()
      })
    setSubmitting(false)
    if (error) {
      setSubmitError(error.message)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" onClick={() => router.push(`/jobs/${job.id}`)} className="mb-4 text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job Details
        </Button>
        <h1 className="text-2xl font-bold mb-2">Apply for {job.title}</h1>
        <div className="text-blue-400 font-medium mb-6">{job.company}</div>
        {submitted ? (
          <div className="bg-green-900/40 border border-green-700 rounded p-6 text-center">
            <h2 className="text-xl font-bold text-green-400 mb-2">Application Submitted!</h2>
            <p className="text-gray-300">Thank you for applying. We will review your application and contact you if selected.</p>
            {resumeUrl && (
              <div className="mt-4">
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View Uploaded Resume</a>
              </div>
            )}
            <Button className="mt-6" onClick={() => router.push('/jobs')}>Back to Jobs</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={submitting || uploading} />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={submitting || uploading} />
            </div>
            <div>
              <Label className="block text-gray-300 mb-2 font-bold text-lg flex items-center gap-2" htmlFor="resume">
                <UploadCloud className="w-6 h-6 text-blue-400" />
                Resume / Cover Letter <span className="text-blue-400">(PDF, DOC, DOCX)</span>
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition hover:border-blue-500 ${resume ? 'border-blue-500 bg-blue-950/20' : 'border-gray-700 bg-gray-900/40'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {resume ? (
                  <span className="text-blue-300 font-medium">{resume.name}</span>
                ) : (
                  <span className="text-gray-400">Click to upload your resume or cover letter</span>
                )}
                <input
                  ref={fileInputRef}
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                  required
                  disabled={submitting || uploading}
                />
              </div>
              {uploading && <div className="text-blue-400 text-sm mt-2">Uploading...</div>}
              {resumeUrl && !uploading && <div className="text-green-400 text-sm mt-2">Resume uploaded!</div>}
            </div>
            {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" disabled={submitting || uploading}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
} 
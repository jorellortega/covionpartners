"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Search, MapPin, Briefcase, DollarSign, Users, Eye, Send } from "lucide-react"
import { Job } from "@/app/types"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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

const popularSkills = [
  "React", "Node.js", "Python", "JavaScript", "TypeScript", "AWS", "Docker", "Kubernetes",
  "Machine Learning", "Data Science", "UI/UX", "Product Management", "Sales", "Marketing"
]

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [jobType, setJobType] = useState("all")
  const [experienceLevel, setExperienceLevel] = useState("all")
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const router = useRouter()
  const { user, loading: userLoading } = useAuth();
  const [publicJobCount, setPublicJobCount] = useState<number>(0);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchJobsAndOrgs() {
      setLoading(true)
      setError(null)
      // Fetch jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug, logo, banner')
      if (jobsError) {
        setError(jobsError.message)
        setJobs([])
        setLoading(false)
        return
      }
      if (orgsError) {
        setError(orgsError.message)
        setJobs([])
        setLoading(false)
        return
      }
      // Merge organization name and logo into each job
      const jobsWithOrg = (jobsData as Job[]).map(job => {
        const org = orgsData?.find(org => org.id === job.organization_id);
        return {
          ...job,
          organization: org
            ? { ...(org as any), logo: (org as any).logo, banner: (org as any).banner }
            : undefined
        };
      })
      setJobs(jobsWithOrg)
      setLoading(false)
    }
    fetchJobsAndOrgs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, search, location, jobType, experienceLevel, remoteOnly, selectedSkills])

  useEffect(() => {
    if (!user || user.role !== 'public') return;
    async function fetchPublicJobCount() {
      if (!user) return;
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data, error } = await supabase
        .from('jobs')
        .select('id, created_at')
        .eq('employer_id', user.id)
        .gte('created_at', firstOfMonth.toISOString())
      if (!error && data) {
        setPublicJobCount(data.length);
      }
    }
    fetchPublicJobCount();
  }, [user]);

  const filterJobs = () => {
    let filtered = jobs

    if (search) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase()) ||
        job.skills?.some(skill => skill.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (location) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(location.toLowerCase())
      )
    }

    if (jobType !== "all") {
      filtered = filtered.filter(job => job.job_type === jobType)
    }

    if (experienceLevel !== "all") {
      filtered = filtered.filter(job => job.experience_level === experienceLevel)
    }

    if (remoteOnly) {
      filtered = filtered.filter(job => job.remote)
    }

    if (selectedSkills.length > 0) {
      filtered = filtered.filter(job =>
        job.skills?.some(skill => selectedSkills.includes(skill))
      )
    }

    setFilteredJobs(filtered)
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    if (min) return `${currency} ${min.toLocaleString()}+`
    if (max) return `Up to ${currency} ${max.toLocaleString()}`
    return 'Salary not specified'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const reachedPublicLimit = user?.role === 'public' && publicJobCount >= 2;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-500">Error loading jobs</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Find Your Next Opportunity
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            Discover amazing job opportunities from innovative companies
          </p>
          <span className="flex gap-4 justify-center">
            <Button
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
              onClick={() => router.push('/open-roles')}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              View Project Roles
            </Button>
            <Button
              onClick={() => router.push('/jobs/post')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={reachedPublicLimit}
            >
              <Plus className="w-4 h-4 mr-2" />
              Post a Job
            </Button>
            {reachedPublicLimit && (
              <>
                <button
                  type="button"
                  className="text-xs text-red-400 ml-2 align-middle font-semibold hover:underline focus:underline focus:outline-none"
                  onClick={() => setIsLimitDialogOpen(true)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Limit reached
                </button>
                <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Job Posting Limit</DialogTitle>
                      <DialogDescription>
                        You have reached the maximum of 2 job posts for public users this month.<br />
                        The limit resets at the start of each new month.<br />
                        To post more jobs, please upgrade your account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 mt-6">
                      <Button
                        variant="outline"
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                        onClick={() => setIsLimitDialogOpen(false)}
                      >
                        Close
                      </Button>
                      <Button
                        className="gradient-button hover:bg-purple-700"
                        onClick={() => {
                          setIsLimitDialogOpen(false);
                          router.push('/account-types');
                        }}
                      >
                        Upgrade Account
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </span>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs, companies, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {experienceLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="remote"
                checked={remoteOnly}
                onCheckedChange={setRemoteOnly}
              />
              <Label htmlFor="remote">Remote Only</Label>
            </div>
          </div>

          {/* Skills Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Skills</Label>
            <div className="flex flex-wrap gap-2">
              {popularSkills.map(skill => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-blue-500/20"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-400">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>
          {selectedSkills.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSkills([])}
              className="text-gray-400 hover:text-white"
            >
              Clear Skills
            </Button>
          )}
        </div>

        {/* Job Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <Card key={job.id} className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-gray-800 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              {/* Job/Organization Banner Image */}
              <div className="w-full h-40 bg-gray-200 rounded-t-lg overflow-hidden flex items-center justify-center">
                <img
                  src={job.job_image_url || (job.organization as any)?.banner || "/placeholder.jpg"}
                  alt={job.title + " banner"}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Company Logo Thumbnail (link) */}
              <div className="w-full flex justify-center pt-4 -mt-8 z-10 relative">
                {job.organization?.slug ? (
                  <Link href={`/company/${job.organization.slug}`}>
                    <img
                      src={(job.organization as any)?.logo || job.thumbnail_url || "/placeholder-logo.png"}
                      alt={job.organization.name + " logo"}
                      className="w-16 h-16 rounded-lg object-contain bg-white border border-gray-200 shadow hover:scale-105 transition"
                      style={{ cursor: 'pointer' }}
                    />
                  </Link>
                ) : (
                  <img
                    src={(job.organization as any)?.logo || job.thumbnail_url || "/placeholder-logo.png"}
                    alt={job.company + " logo"}
                    className="w-16 h-16 rounded-lg object-contain bg-white border border-gray-200 shadow hover:scale-105 transition"
                    style={{ cursor: 'pointer' }}
                  />
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">
                    {job.job_type.replace('-', ' ')}
                  </Badge>
                  {job.remote && (
                    <Badge variant="secondary" className="text-xs">
                      Remote
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2 hover:text-blue-400 cursor-pointer">
                  {job.title}
                </CardTitle>
                <CardDescription className="text-blue-400 font-medium">
                  {job.organization?.slug ? (
                    <Link href={`/company/${job.organization.slug}`} className="hover:underline">{job.organization.name}</Link>
                  ) : job.organization ? (
                    <span>{job.organization.name}</span>
                  ) : (
                    <span>{job.company}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location || 'Remote'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
                </div>

                <p className="text-gray-300 text-sm line-clamp-3">
                  {job.description}
                </p>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{job.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {job.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {job.applications_count}
                    </span>
                  </div>
                  <span>{formatDate(job.created_at)}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    onClick={() => router.push(`/jobs/${job.id}/apply`)}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
              <p>Try adjusting your search criteria or check back later for new opportunities.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
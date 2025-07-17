"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, ArrowLeft } from "lucide-react"
import supabase from "@/utils/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

const jobTypes = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "work-for-hire", label: "Work for Hire" }
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
  "Machine Learning", "Data Science", "UI/UX", "Product Management", "Sales", "Marketing",
  "SQL", "MongoDB", "PostgreSQL", "GraphQL", "REST API", "Git", "CI/CD", "Agile", "Scrum"
]

export default function PostJobPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    remote: false,
    job_type: "",
    salary_min: "",
    salary_max: "",
    salary_currency: "USD",
    description: "",
    requirements: "",
    benefits: "",
    experience_level: "",
    education_level: "",
    application_deadline: "",
    skills: [] as string[],
    customSkill: "",
    timeline_days: "",
    deliverables: "",
    project_requirements: ""
  })
  const router = useRouter()
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [showOrgDialog, setShowOrgDialog] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (!authUser) return
    const fetchOrgs = async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("owner_id", authUser.id)
        .order("created_at", { ascending: false })
      setOrganizations(data || [])
      if (!data || data.length === 0) {
        setShowOrgDialog(true)
      } else {
        setShowOrgDialog(false)
      }
    }
    fetchOrgs()
  }, [authUser])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill],
        customSkill: ""
      }))
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to post a job.",
          variant: "destructive"
        })
        return
      }

      if (!selectedOrgId || selectedOrgId === "none") {
        toast({
          title: "Organization required",
          description: "Please select an organization to post a job.",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const jobData: any = {
        employer_id: user.id,
        title: formData.title,
        company: selectedOrgId && selectedOrgId !== "none"
          ? organizations.find(org => org.id === selectedOrgId)?.name || ""
          : formData.company,
        location: formData.location || null,
        remote: formData.remote,
        job_type: formData.job_type,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        salary_currency: formData.salary_currency,
        description: formData.description,
        requirements: formData.requirements || null,
        benefits: formData.benefits || null,
        skills: formData.skills.length > 0 ? formData.skills : null,
        experience_level: formData.experience_level || null,
        education_level: formData.education_level || null,
        application_deadline: formData.application_deadline || null,
        is_active: true
      }
      if (selectedOrgId && selectedOrgId !== "none") {
        jobData.organization_id = selectedOrgId
      } else {
        jobData.organization_id = null
      }

      if (formData.job_type === "work-for-hire") {
        jobData.timeline_days = formData.timeline_days ? parseInt(formData.timeline_days, 10) : null;
        jobData.deliverables = formData.deliverables || null;
        jobData.project_requirements = formData.project_requirements || null;
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Job posted successfully!",
        description: "Your job listing is now live and visible to potential candidates.",
      })

      router.push(`/jobs/${data.id}`)
    } catch (error: any) {
      console.error('Error posting job:', error)
      toast({
        title: "Error posting job",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <Dialog open={showOrgDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Organizations Found</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-300">
            You need to create an organization before posting a job.
          </div>
          <DialogFooter>
            <Button onClick={() => window.location.href = '/buildbusiness'} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              Create Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Post a New Job
          </h1>
          <p className="text-gray-400">
            Create a compelling job listing to attract the best talent
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="organization">Organization *</Label>
                    <Select
                      value={selectedOrgId}
                      onValueChange={val => setSelectedOrgId(val)}
                      required
                      disabled={organizations.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map(org => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., San Francisco, CA"
                      />
                    </div>
                    <div>
                      <Label htmlFor="job_type">Job Type *</Label>
                      <Select value={formData.job_type} onValueChange={(value) => handleInputChange('job_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remote"
                      checked={formData.remote}
                      onCheckedChange={(checked) => handleInputChange('remote', checked)}
                    />
                    <Label htmlFor="remote">Remote position</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl">Job Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                      rows={6}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Requirements & Qualifications</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="List the key requirements, qualifications, and experience needed..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="benefits">Benefits & Perks</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="Describe the benefits, perks, and what makes your company great to work for..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Job Type Specific Fields */}
              {formData.job_type === "work-for-hire" && (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-400">Work for Hire Details</CardTitle>
                    <CardDescription>Additional information for project-based work</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="timeline_days">Project Timeline (days)</Label>
                      <Input
                        id="timeline_days"
                        type="number"
                        placeholder="30"
                        value={formData.timeline_days || ""}
                        onChange={(e) => handleInputChange('timeline_days', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deliverables">Deliverables</Label>
                      <Textarea
                        id="deliverables"
                        placeholder="Describe what needs to be delivered..."
                        value={formData.deliverables || ""}
                        onChange={(e) => handleInputChange('deliverables', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="project_requirements">Project Requirements</Label>
                      <Textarea
                        id="project_requirements"
                        placeholder="Specific requirements for this project..."
                        value={formData.project_requirements || ""}
                        onChange={(e) => handleInputChange('project_requirements', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl">Required Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Popular Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {popularSkills.map(skill => (
                        <Badge
                          key={skill}
                          variant={formData.skills.includes(skill) ? "default" : "secondary"}
                          className="cursor-pointer hover:bg-blue-500/20"
                          onClick={() => addSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customSkill">Add Custom Skill</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="customSkill"
                        value={formData.customSkill}
                        onChange={(e) => handleInputChange('customSkill', e.target.value)}
                        placeholder="Enter a skill"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSkill(formData.customSkill)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addSkill(formData.customSkill)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {formData.skills.length > 0 && (
                    <div>
                      <Label>Selected Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.skills.map(skill => (
                          <Badge
                            key={skill}
                            variant="default"
                            className="cursor-pointer"
                            onClick={() => removeSkill(skill)}
                          >
                            {skill}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Salary Information */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl">Salary & Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary_min">Min Salary</Label>
                      <Input
                        id="salary_min"
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => handleInputChange('salary_min', e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary_max">Max Salary</Label>
                      <Input
                        id="salary_max"
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => handleInputChange('salary_max', e.target.value)}
                        placeholder="80000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="salary_currency">Currency</Label>
                    <Select value={formData.salary_currency} onValueChange={(value) => handleInputChange('salary_currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select value={formData.experience_level} onValueChange={(value) => handleInputChange('experience_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="education_level">Education Level</Label>
                    <Input
                      id="education_level"
                      value={formData.education_level}
                      onChange={(e) => handleInputChange('education_level', e.target.value)}
                      placeholder="e.g., Bachelor's degree"
                    />
                  </div>

                  <div>
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    disabled={loading}
                  >
                    {loading ? "Posting Job..." : "Post Job"}
                  </Button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Your job will be reviewed and published within 24 hours
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 
"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, Send, Calendar, Users, Briefcase, FileText, Lightbulb, Trash2 } from "lucide-react"

export default function ProjectRequestPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    type: "collaboration",
    budget: [50000, 500000],
    timeline: "",
    teamSize: "",
    skills: [] as string[],
    contactEmail: "",
    contactPhone: "",
    shareContact: true,
    additionalNotes: "",
  })

  // Available skills for the project
  const availableSkills = [
    "AI Development",
    "Web Development",
    "Mobile Development",
    "UI/UX Design",
    "Blockchain",
    "Data Science",
    "Cloud Infrastructure",
    "IoT",
    "AR/VR",
    "Marketing",
    "Business Development",
    "Financial Analysis",
  ]

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle skill selection
  const toggleSkill = (skill: string) => {
    setProjectData((prev) => {
      if (prev.skills.includes(skill)) {
        return { ...prev, skills: prev.skills.filter((s) => s !== skill) }
      } else {
        return { ...prev, skills: [...prev.skills, skill] }
      }
    })
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate form
      if (!projectData.title || !projectData.description || !projectData.type) {
        throw new Error("Please fill in all required fields")
      }

      // In a real app, you would send the form data and files to your API
      // For demo purposes, we'll simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message
      setSuccess(
        "Your project request has been submitted successfully! Our team will review it and get back to you soon.",
      )

      // Reset form after successful submission
      setProjectData({
        title: "",
        description: "",
        type: "collaboration",
        budget: [50000, 500000],
        timeline: "",
        teamSize: "",
        skills: [],
        contactEmail: "",
        contactPhone: "",
        shareContact: true,
        additionalNotes: "",
      })
      setUploadedFiles([])
      setActiveTab("details")

      // In a real app, you might redirect to a success page
      // router.push("/projectrequest/success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit project request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Project Request</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {success ? (
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Request Submitted!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-300">{success}</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button className="gradient-button" onClick={() => router.push("/dashboard")}>
                Return to Dashboard
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="leonardo-card border-gray-800 mb-6">
              <CardHeader>
                <CardTitle>Submit a Custom Project Request</CardTitle>
                <CardDescription className="text-gray-400">
                  Share your project idea, collaboration proposal, or investment opportunity with our team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="leonardo-tabs">
                    <TabsTrigger value="details" className="leonardo-tab">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Project Details
                    </TabsTrigger>
                    <TabsTrigger value="team" className="leonardo-tab">
                      <Users className="w-4 h-4 mr-2" />
                      Team & Skills
                    </TabsTrigger>
                    <TabsTrigger value="files" className="leonardo-tab">
                      <FileText className="w-4 h-4 mr-2" />
                      Files & Documents
                    </TabsTrigger>
                  </TabsList>

                  {/* Project Details Tab */}
                  <TabsContent value="details" className="space-y-6">
                    {error && (
                      <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4">{error}</div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white/90">
                        Project Title <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Enter a descriptive title for your project"
                        value={projectData.title}
                        onChange={handleInputChange}
                        className="leonardo-input"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white/90">
                        Project Description <span className="text-red-400">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your project idea, goals, and vision in detail"
                        value={projectData.description}
                        onChange={handleInputChange}
                        className="leonardo-input min-h-[150px]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-white/90">
                        Project Type <span className="text-red-400">*</span>
                      </Label>
                      <Select value={projectData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                        <SelectTrigger className="leonardo-input">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="collaboration">Collaboration</SelectItem>
                          <SelectItem value="investment">Investment Opportunity</SelectItem>
                          <SelectItem value="development">Custom Development</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/90">Budget Range (USD)</Label>
                      <div className="pt-6 px-2">
                        <Slider
                          defaultValue={[50000, 500000]}
                          max={2000000}
                          step={10000}
                          value={projectData.budget}
                          onValueChange={(value) => setProjectData((prev) => ({ ...prev, budget: value }))}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>${projectData.budget[0].toLocaleString()}</span>
                        <span>${projectData.budget[1].toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeline" className="text-white/90">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          Expected Timeline
                        </div>
                      </Label>
                      <Input
                        id="timeline"
                        name="timeline"
                        type="date"
                        placeholder="Expected completion date"
                        value={projectData.timeline}
                        onChange={handleInputChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" className="gradient-button" onClick={() => setActiveTab("team")}>
                        Next: Team & Skills
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Team & Skills Tab */}
                  <TabsContent value="team" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="teamSize" className="text-white/90">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          Team Size
                        </div>
                      </Label>
                      <Input
                        id="teamSize"
                        name="teamSize"
                        type="number"
                        placeholder="Number of team members"
                        value={projectData.teamSize}
                        onChange={handleInputChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/90">
                        <div className="flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2 text-gray-400" />
                          Required Skills & Expertise
                        </div>
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {availableSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant={projectData.skills.includes(skill) ? "default" : "outline"}
                            className={`cursor-pointer ${
                              projectData.skills.includes(skill)
                                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                            }`}
                            onClick={() => toggleSkill(skill)}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="text-white/90">
                        Contact Email
                      </Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        placeholder="Your email address"
                        value={projectData.contactEmail}
                        onChange={handleInputChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-white/90">
                        Contact Phone
                      </Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        placeholder="Your phone number"
                        value={projectData.contactPhone}
                        onChange={handleInputChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="shareContact"
                        checked={projectData.shareContact}
                        onCheckedChange={(checked) => setProjectData((prev) => ({ ...prev, shareContact: checked }))}
                      />
                      <Label htmlFor="shareContact" className="text-white/90">
                        Share my contact information with potential collaborators
                      </Label>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-700 bg-gray-800/30 text-white"
                        onClick={() => setActiveTab("details")}
                      >
                        Back
                      </Button>
                      <Button type="button" className="gradient-button" onClick={() => setActiveTab("files")}>
                        Next: Files & Documents
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Files & Documents Tab */}
                  <TabsContent value="files" className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-white/90">Upload Presentations, Documents, or Mockups</Label>
                      <div className="border-2 border-dashed border-gray-700 rounded-md p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-400 mb-2">Drag and drop files here, or click to select files</p>
                        <Input
                          ref={fileInputRef}
                          id="fileUpload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-700 bg-gray-800/30 text-white"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select Files
                        </Button>
                        <p className="text-xs text-gray-400 mt-2">
                          Supported formats: PDF, PPTX, DOCX, JPG, PNG (Max 10MB per file)
                        </p>
                      </div>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-white/90">Uploaded Files</Label>
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-800/30 p-3 rounded-md border border-gray-700"
                            >
                              <div className="flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-gray-400 ml-2">({(file.size / 1024).toFixed(0)} KB)</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                onClick={() => removeFile(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="additionalNotes" className="text-white/90">
                        Additional Notes
                      </Label>
                      <Textarea
                        id="additionalNotes"
                        name="additionalNotes"
                        placeholder="Any additional information you'd like to share"
                        value={projectData.additionalNotes}
                        onChange={handleInputChange}
                        className="leonardo-input min-h-[100px]"
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-700 bg-gray-800/30 text-white"
                        onClick={() => setActiveTab("team")}
                      >
                        Back
                      </Button>
                      <Button type="submit" className="gradient-button" disabled={isSubmitting}>
                        {isSubmitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Project Request
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  )
}

// Check component for success message
function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}


"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Home, CalendarIcon, Upload, Globe, DollarSign, Percent, Users, Check, X } from "lucide-react"

export default function CreateOpportunityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [date, setDate] = useState<Date | undefined>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default to 90 days from now
  )

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    investmentLevel: "",
    minInvestment: 0,
    targetROI: 0,
    maxPartners: 0,
    location: "",
    highlights: ["", "", ""],
    risks: ["", "", ""],
    teamMembers: [{ name: "", role: "", bio: "" }],
    financialProjections: [{ year: new Date().getFullYear(), revenue: 0, profit: 0, growth: 0 }],
  })

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: Number.parseFloat(value) || 0,
    })
  }

  // Handle array field changes (highlights, risks)
  const handleArrayChange = (arrayName: string, index: number, value: string) => {
    setFormData({
      ...formData,
      [arrayName]: formData[arrayName as keyof typeof formData].map((item: any, i: number) =>
        i === index ? value : item,
      ),
    })
  }

  // Handle team member changes
  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    const updatedTeamMembers = [...formData.teamMembers]
    updatedTeamMembers[index] = {
      ...updatedTeamMembers[index],
      [field]: value,
    }

    setFormData({
      ...formData,
      teamMembers: updatedTeamMembers,
    })
  }

  // Add team member
  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, { name: "", role: "", bio: "" }],
    })
  }

  // Remove team member
  const removeTeamMember = (index: number) => {
    const updatedTeamMembers = formData.teamMembers.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      teamMembers: updatedTeamMembers,
    })
  }

  // Handle financial projection changes
  const handleFinancialChange = (index: number, field: string, value: string | number) => {
    const updatedProjections = [...formData.financialProjections]
    updatedProjections[index] = {
      ...updatedProjections[index],
      [field]: field === "year" ? Number.parseInt(value as string) : Number.parseFloat(value as string) || 0,
    }

    setFormData({
      ...formData,
      financialProjections: updatedProjections,
    })
  }

  // Add financial year
  const addFinancialYear = () => {
    const lastYear = formData.financialProjections[formData.financialProjections.length - 1].year

    setFormData({
      ...formData,
      financialProjections: [
        ...formData.financialProjections,
        { year: lastYear + 1, revenue: 0, profit: 0, growth: 0 },
      ],
    })
  }

  // Remove financial year
  const removeFinancialYear = (index: number) => {
    const updatedProjections = formData.financialProjections.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      financialProjections: updatedProjections,
    })
  }

  // Form validation
  const validateForm = () => {
    // Basic validation
    if (!formData.name || !formData.description || !formData.industry || !formData.investmentLevel) {
      return false
    }

    if (formData.minInvestment <= 0 || formData.targetROI <= 0 || formData.maxPartners <= 0) {
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      alert("Please fill in all required fields correctly.")
      return
    }

    setIsSubmitting(true)

    try {
      // In a real application, you would send this data to your API
      console.log("Submitting opportunity:", {
        ...formData,
        deadline: date?.toISOString(),
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to opportunities list
      router.push("/admin/opportunities")
    } catch (error) {
      console.error("Error creating opportunity:", error)
      alert("An error occurred while creating the opportunity. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Navigation between tabs
  const goToNextTab = () => {
    if (activeTab === "basic") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("team")
    else if (activeTab === "team") setActiveTab("financials")
  }

  const goToPrevTab = () => {
    if (activeTab === "financials") setActiveTab("team")
    else if (activeTab === "team") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("basic")
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/admin/opportunities"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Back to Opportunities
            </Link>
            <h1 className="text-3xl font-bold">Create New Investment Opportunity</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>New Investment Opportunity</CardTitle>
            <CardDescription>
              Create a new investment opportunity to be listed on the marketplace. Fill in all the required information
              across all tabs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-8">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Opportunity Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter opportunity name"
                          className="leonardo-input mt-1"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="industry">Industry *</Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) => handleSelectChange("industry", value)}
                        >
                          <SelectTrigger className="leonardo-input mt-1">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Energy">Energy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="investmentLevel">Investment Level *</Label>
                        <Select
                          value={formData.investmentLevel}
                          onValueChange={(value) => handleSelectChange("investmentLevel", value)}
                        >
                          <SelectTrigger className="leonardo-input mt-1">
                            <SelectValue placeholder="Select investment level" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="Seed">Seed</SelectItem>
                            <SelectItem value="Series A">Series A</SelectItem>
                            <SelectItem value="Series B">Series B</SelectItem>
                            <SelectItem value="Series C">Series C</SelectItem>
                            <SelectItem value="Growth">Growth</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <div className="flex mt-1">
                          <Globe className="w-5 h-5 mr-2 text-gray-400 self-center" />
                          <Input
                            id="location"
                            name="location"
                            placeholder="Country or region"
                            className="leonardo-input"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="minInvestment">Minimum Investment (USD) *</Label>
                        <div className="flex mt-1">
                          <DollarSign className="w-5 h-5 mr-2 text-gray-400 self-center" />
                          <Input
                            id="minInvestment"
                            name="minInvestment"
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="Minimum investment amount"
                            className="leonardo-input"
                            value={formData.minInvestment || ""}
                            onChange={handleNumberChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="targetROI">Target ROI (%) *</Label>
                        <div className="flex mt-1">
                          <Percent className="w-5 h-5 mr-2 text-gray-400 self-center" />
                          <Input
                            id="targetROI"
                            name="targetROI"
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Expected return on investment"
                            className="leonardo-input"
                            value={formData.targetROI || ""}
                            onChange={handleNumberChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="maxPartners">Maximum Partners *</Label>
                        <div className="flex mt-1">
                          <Users className="w-5 h-5 mr-2 text-gray-400 self-center" />
                          <Input
                            id="maxPartners"
                            name="maxPartners"
                            type="number"
                            min="1"
                            placeholder="Maximum number of partners"
                            className="leonardo-input"
                            value={formData.maxPartners || ""}
                            onChange={handleNumberChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Funding Deadline *</Label>
                        <div className="flex mt-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="leonardo-input w-full justify-start text-left font-normal flex"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                className="bg-gray-900"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Provide a detailed description of the investment opportunity"
                      className="leonardo-input mt-1 h-32"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Key Highlights</h3>
                    <div className="space-y-4">
                      {formData.highlights.map((highlight, index) => (
                        <div key={`highlight-${index}`} className="flex items-start">
                          <Check className="w-5 h-5 mr-2 text-green-500 mt-2" />
                          <Input
                            placeholder={`Highlight ${index + 1}`}
                            className="leonardo-input"
                            value={highlight}
                            onChange={(e) => handleArrayChange("highlights", index, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Risk Factors</h3>
                    <div className="space-y-4">
                      {formData.risks.map((risk, index) => (
                        <div key={`risk-${index}`} className="flex items-start">
                          <X className="w-5 h-5 mr-2 text-red-500 mt-2" />
                          <Input
                            placeholder={`Risk ${index + 1}`}
                            className="leonardo-input"
                            value={risk}
                            onChange={(e) => handleArrayChange("risks", index, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Documents & Media</h3>
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-400">Drag and drop files here, or click to select files</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: PDF, DOCX, XLSX, JPG, PNG (Max 10MB each)
                      </p>
                      <Button type="button" variant="outline" className="mt-4 border-gray-700">
                        Select Files
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Team Tab */}
                <TabsContent value="team" className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Team Members</h3>
                      <Button type="button" variant="outline" className="border-gray-700" onClick={addTeamMember}>
                        Add Team Member
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {formData.teamMembers.map((member, index) => (
                        <div key={`team-${index}`} className="p-4 border border-gray-800 rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Team Member {index + 1}</h4>
                            {formData.teamMembers.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                onClick={() => removeTeamMember(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`team-name-${index}`}>Name</Label>
                              <Input
                                id={`team-name-${index}`}
                                placeholder="Full name"
                                className="leonardo-input mt-1"
                                value={member.name}
                                onChange={(e) => handleTeamMemberChange(index, "name", e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor={`team-role-${index}`}>Role</Label>
                              <Input
                                id={`team-role-${index}`}
                                placeholder="Position/Role"
                                className="leonardo-input mt-1"
                                value={member.role}
                                onChange={(e) => handleTeamMemberChange(index, "role", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <Label htmlFor={`team-bio-${index}`}>Bio</Label>
                            <Textarea
                              id={`team-bio-${index}`}
                              placeholder="Brief biography and experience"
                              className="leonardo-input mt-1 h-24"
                              value={member.bio}
                              onChange={(e) => handleTeamMemberChange(index, "bio", e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Financials Tab */}
                <TabsContent value="financials" className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Financial Projections</h3>
                      <Button type="button" variant="outline" className="border-gray-700" onClick={addFinancialYear}>
                        Add Year
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left py-2 px-4">Year</th>
                            <th className="text-left py-2 px-4">Revenue (USD)</th>
                            <th className="text-left py-2 px-4">Profit (USD)</th>
                            <th className="text-left py-2 px-4">Growth (%)</th>
                            <th className="text-right py-2 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.financialProjections.map((projection, index) => (
                            <tr key={`financial-${index}`} className="border-b border-gray-800">
                              <td className="py-2 px-4">
                                <Input
                                  type="number"
                                  className="leonardo-input w-24"
                                  value={projection.year}
                                  onChange={(e) => handleFinancialChange(index, "year", e.target.value)}
                                />
                              </td>
                              <td className="py-2 px-4">
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                                  <Input
                                    type="number"
                                    className="leonardo-input"
                                    value={projection.revenue || ""}
                                    onChange={(e) => handleFinancialChange(index, "revenue", e.target.value)}
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-4">
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                                  <Input
                                    type="number"
                                    className="leonardo-input"
                                    value={projection.profit || ""}
                                    onChange={(e) => handleFinancialChange(index, "profit", e.target.value)}
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-4">
                                <div className="flex items-center">
                                  <Percent className="w-4 h-4 mr-1 text-gray-400" />
                                  <Input
                                    type="number"
                                    className="leonardo-input"
                                    value={projection.growth || ""}
                                    onChange={(e) => handleFinancialChange(index, "growth", e.target.value)}
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-4 text-right">
                                {formData.financialProjections.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    onClick={() => removeFinancialYear(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700"
                  onClick={goToPrevTab}
                  disabled={activeTab === "basic"}
                >
                  Previous
                </Button>

                {activeTab !== "financials" ? (
                  <Button type="button" className="gradient-button" onClick={goToNextTab}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" className="gradient-button" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Opportunity"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


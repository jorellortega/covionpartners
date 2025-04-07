"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, parseISO } from "date-fns"
import { Home, CalendarIcon, Upload, Globe, DollarSign, Percent, Users, Check, X, AlertCircle } from "lucide-react"

// Mock opportunities data
const mockOpportunities = [
  {
    id: "opp-001",
    name: "AI-Powered Healthcare Platform",
    description:
      "Revolutionary healthcare platform using artificial intelligence to improve patient outcomes and reduce costs.",
    industry: "Healthcare",
    investmentLevel: "Series A",
    minInvestment: 5000000,
    targetROI: 22,
    currentPartners: 3,
    maxPartners: 5,
    deadline: "2025-06-30",
    fundingProgress: 65,
    location: "United States",
    highlights: [
      "Proprietary AI algorithms with 95% diagnostic accuracy",
      "Partnerships with 3 major hospital networks",
      "FDA approval expected within 6 months",
    ],
    risks: [
      "Regulatory approval timeline may extend",
      "Competitive market with established players",
      "Integration challenges with legacy systems",
    ],
    teamMembers: [
      {
        name: "Dr. Sarah Johnson",
        role: "CEO & Medical Director",
        bio: "Former Chief of Medicine at Mayo Clinic with 15+ years experience in healthcare technology.",
      },
      {
        name: "Michael Chen",
        role: "CTO",
        bio: "AI researcher with PhD from MIT and previous experience at Google Health.",
      },
    ],
    financialProjections: [
      { year: 2025, revenue: 2500000, profit: 500000, growth: 0 },
      { year: 2026, revenue: 7500000, profit: 2000000, growth: 200 },
      { year: 2027, revenue: 15000000, profit: 5000000, growth: 100 },
    ],
  },
  {
    id: "opp-002",
    name: "Sustainable Energy Storage",
    description:
      "Next-generation energy storage solutions for renewable energy sources with improved efficiency and reduced environmental impact.",
    industry: "Energy",
    investmentLevel: "Series B",
    minInvestment: 10000000,
    targetROI: 18,
    currentPartners: 4,
    maxPartners: 6,
    deadline: "2025-07-15",
    fundingProgress: 72,
    location: "Germany",
    highlights: [
      "Patented technology with 40% higher efficiency than competitors",
      "Pilot projects with major European utilities",
      "Carbon-neutral manufacturing process",
    ],
    risks: [
      "Supply chain dependencies for rare materials",
      "Evolving regulatory landscape",
      "Technology scaling challenges",
    ],
    teamMembers: [
      { name: "Hans Mueller", role: "CEO", bio: "Former Tesla executive with expertise in energy storage systems." },
      {
        name: "Dr. Emma Schmidt",
        role: "Chief Scientist",
        bio: "PhD in Material Science with 20+ patents in energy storage technology.",
      },
    ],
    financialProjections: [
      { year: 2025, revenue: 8000000, profit: 1000000, growth: 0 },
      { year: 2026, revenue: 20000000, profit: 5000000, growth: 150 },
      { year: 2027, revenue: 45000000, profit: 15000000, growth: 125 },
    ],
  },
  {
    id: "opp-003",
    name: "EdTech Learning Platform",
    description:
      "Personalized learning platform for K-12 students using adaptive technology to customize educational content.",
    industry: "Education",
    investmentLevel: "Seed",
    minInvestment: 2500000,
    targetROI: 25,
    currentPartners: 2,
    maxPartners: 8,
    deadline: "2025-08-01",
    fundingProgress: 30,
    location: "Canada",
    highlights: [
      "Adaptive learning algorithms proven to improve test scores by 35%",
      "Partnerships with 50+ school districts",
      "Scalable SaaS model with recurring revenue",
    ],
    risks: [
      "Long sales cycles with educational institutions",
      "Seasonal revenue fluctuations",
      "Data privacy concerns with student information",
    ],
    teamMembers: [
      {
        name: "Jessica Williams",
        role: "CEO",
        bio: "Former education policy advisor with experience at major EdTech companies.",
      },
      { name: "David Kim", role: "CTO", bio: "Software engineer with previous startup exits in the education space." },
    ],
    financialProjections: [
      { year: 2025, revenue: 1200000, profit: 100000, growth: 0 },
      { year: 2026, revenue: 4000000, profit: 800000, growth: 233 },
      { year: 2027, revenue: 10000000, profit: 3000000, growth: 150 },
    ],
  },
  {
    id: "opp-004",
    name: "Blockchain Payment Solution",
    description:
      "Secure and efficient cross-border payment system using blockchain technology for financial institutions.",
    industry: "Finance",
    investmentLevel: "Series A",
    minInvestment: 7500000,
    targetROI: 20,
    currentPartners: 2,
    maxPartners: 4,
    deadline: "2025-06-15",
    fundingProgress: 45,
    location: "Singapore",
    highlights: [
      "90% reduction in transaction fees compared to traditional methods",
      "Partnerships with 5 international banks",
      "Regulatory approval in 12 countries",
    ],
    risks: [
      "Evolving cryptocurrency regulations",
      "Competition from established financial institutions",
      "Security challenges in blockchain implementation",
    ],
    teamMembers: [
      { name: "Robert Tan", role: "CEO", bio: "Former banking executive with 20+ years in international finance." },
      {
        name: "Lisa Chen",
        role: "CTO",
        bio: "Blockchain developer with experience at major cryptocurrency exchanges.",
      },
    ],
    financialProjections: [
      { year: 2025, revenue: 5000000, profit: 1000000, growth: 0 },
      { year: 2026, revenue: 12000000, profit: 4000000, growth: 140 },
      { year: 2027, revenue: 25000000, profit: 10000000, growth: 108 },
    ],
  },
  {
    id: "opp-005",
    name: "Smart Retail Analytics",
    description:
      "AI-powered retail analytics platform that helps brick-and-mortar stores optimize operations and enhance customer experience.",
    industry: "Retail",
    investmentLevel: "Growth",
    minInvestment: 15000000,
    targetROI: 16,
    currentPartners: 5,
    maxPartners: 7,
    deadline: "2025-07-30",
    fundingProgress: 85,
    location: "United Kingdom",
    highlights: [
      "Proven 25% increase in store revenue for clients",
      "Integration with major POS and inventory systems",
      "Machine learning models trained on data from 500+ retail locations",
    ],
    risks: [
      "Privacy concerns with customer tracking",
      "Dependency on in-store hardware installation",
      "Retail industry volatility",
    ],
    teamMembers: [
      { name: "James Wilson", role: "CEO", bio: "Former retail executive with experience at major global chains." },
      { name: "Sophia Martinez", role: "CTO", bio: "Computer vision specialist with background in retail technology." },
      { name: "Oliver Thompson", role: "COO", bio: "Operations expert with experience scaling SaaS businesses." },
    ],
    financialProjections: [
      { year: 2025, revenue: 18000000, profit: 5000000, growth: 0 },
      { year: 2026, revenue: 30000000, profit: 10000000, growth: 67 },
      { year: 2027, revenue: 45000000, profit: 18000000, growth: 50 },
    ],
  },
]

export default function EditOpportunityPage() {
  const router = useRouter()
  const params = useParams()
  const opportunityId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const [date, setDate] = useState<Date | undefined>(undefined)

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

  // Fetch opportunity data
  useEffect(() => {
    const fetchOpportunity = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // In a real app, this would be an API call
        // For demo, we'll use the mock data
        await new Promise((resolve) => setTimeout(resolve, 800)) // Simulate network delay

        const opportunity = mockOpportunities.find((opp) => opp.id === opportunityId)

        if (opportunity) {
          setFormData({
            name: opportunity.name,
            description: opportunity.description,
            industry: opportunity.industry,
            investmentLevel: opportunity.investmentLevel,
            minInvestment: opportunity.minInvestment,
            targetROI: opportunity.targetROI,
            maxPartners: opportunity.maxPartners,
            location: opportunity.location,
            highlights: opportunity.highlights,
            risks: opportunity.risks,
            teamMembers: opportunity.teamMembers,
            financialProjections: opportunity.financialProjections,
          })

          // Set the deadline date
          setDate(parseISO(opportunity.deadline))
        } else {
          setError("Opportunity not found")
        }
      } catch (err) {
        setError("Failed to load opportunity data")
        console.error("Error fetching opportunity:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOpportunity()
  }, [opportunityId])

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
      console.log("Updating opportunity:", {
        id: opportunityId,
        ...formData,
        deadline: date?.toISOString(),
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to opportunities list
      router.push("/admin/opportunities")
    } catch (error) {
      console.error("Error updating opportunity:", error)
      alert("An error occurred while updating the opportunity. Please try again.")
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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <header className="leonardo-header">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold">Edit Investment Opportunity</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <header className="leonardo-header">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold">Edit Investment Opportunity</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Error
              </CardTitle>
              <CardDescription className="text-gray-400">{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="gradient-button" onClick={() => router.push("/admin/opportunities")}>
                Return to Opportunities
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    )
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
            <h1 className="text-3xl font-bold">Edit Investment Opportunity</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Edit Investment Opportunity</CardTitle>
            <CardDescription>
              Update the information for this investment opportunity. Make changes across all tabs as needed.
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
                    {isSubmitting ? "Saving Changes..." : "Save Changes"}
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


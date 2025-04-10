"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  BookmarkPlus,
  Calendar,
  DollarSign,
  Globe,
  Users,
  Building,
  Clock,
  FileText,
  BarChart2,
} from "lucide-react"

// Industry badge component
function IndustryBadge({ industry }: { industry: string }) {
  const getIndustryStyles = () => {
    switch (industry.toLowerCase()) {
      case "technology":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "healthcare":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "finance":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "education":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "retail":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "manufacturing":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "energy":
        return "bg-teal-500/20 text-teal-400 border-teal-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getIndustryStyles()} border`} variant="outline">
      {industry}
    </Badge>
  )
}

// Investment level component
function InvestmentLevel({ level }: { level: string }) {
  const getLevelStyles = () => {
    switch (level.toLowerCase()) {
      case "seed":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "series a":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "series b":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "series c":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50"
      case "growth":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getLevelStyles()} border`} variant="outline">
      {level}
    </Badge>
  )
}

export default function OpportunityDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const opportunityId = params.id as string
  const [opportunity, setOpportunity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)

  // Mock opportunities data - in a real app, this would come from an API
  const mockOpportunities = [
    {
      id: "opp-001",
      name: "AI-Powered Healthcare Platform",
      description:
        "Revolutionary healthcare platform using artificial intelligence to improve patient outcomes and reduce costs.",
      longDescription: `
        This cutting-edge healthcare platform leverages artificial intelligence to transform patient care and hospital operations. 
        
        The system uses machine learning algorithms to analyze patient data, predict potential health issues before they become critical, and recommend personalized treatment plans. By integrating with existing hospital systems, it streamlines workflows and reduces administrative burden on healthcare providers.
        
        The platform has already been deployed in 5 major hospitals with remarkable results: 23% reduction in readmission rates, 18% decrease in average length of stay, and 15% improvement in patient satisfaction scores.
      `,
      industry: "Healthcare",
      investmentLevel: "Series A",
      minInvestment: 5000000,
      targetROI: 22,
      currentPartners: 3,
      maxPartners: 5,
      deadline: "2025-06-30",
      fundingProgress: 65,
      tags: ["AI", "Healthcare", "SaaS"],
      location: "United States",
      companySize: "Medium",
      foundedYear: 2022,
      team: [
        { name: "Dr. Sarah Johnson", role: "CEO & Founder", background: "Former Chief of Medicine at Mayo Clinic" },
        { name: "Michael Chen", role: "CTO", background: "Ex-Google AI Research Lead" },
        {
          name: "Dr. Robert Williams",
          role: "Chief Medical Officer",
          background: "20+ years in healthcare administration",
        },
      ],
      financials: {
        revenueLastYear: 2500000,
        projectedRevenue: 7500000,
        burnRate: 350000,
        runway: "18 months",
      },
      documents: [
        { name: "Pitch Deck", type: "PDF", size: "4.2 MB" },
        { name: "Financial Projections", type: "XLSX", size: "1.8 MB" },
        { name: "Market Analysis", type: "PDF", size: "3.5 MB" },
      ],
      milestones: [
        { name: "Seed Funding", date: "2022-06", status: "Completed" },
        { name: "Beta Launch", date: "2023-02", status: "Completed" },
        { name: "Series A", date: "2023-11", status: "In Progress" },
        { name: "Expansion to EU Market", date: "2024-06", status: "Planned" },
        { name: "Series B", date: "2025-01", status: "Planned" },
      ],
    },
    {
      id: "opp-002",
      name: "Sustainable Energy Storage",
      description:
        "Next-generation energy storage solutions for renewable energy sources with improved efficiency and reduced environmental impact.",
      longDescription: `
        Our revolutionary energy storage technology addresses one of the biggest challenges in renewable energy: efficient and sustainable storage solutions.
        
        Using advanced materials science and innovative engineering, we've developed a battery technology that offers 40% higher energy density than current lithium-ion batteries, with a 60% longer lifecycle and minimal environmental impact. The batteries are made from abundant, non-toxic materials and are 95% recyclable.
        
        This technology enables renewable energy systems to deliver consistent power regardless of weather conditions, making clean energy more reliable and accelerating the transition away from fossil fuels.
      `,
      industry: "Energy",
      investmentLevel: "Series B",
      minInvestment: 10000000,
      targetROI: 18,
      currentPartners: 4,
      maxPartners: 6,
      deadline: "2025-07-15",
      fundingProgress: 72,
      tags: ["CleanTech", "Renewable", "Hardware"],
      location: "Germany",
      companySize: "Large",
      foundedYear: 2019,
      team: [
        {
          name: "Dr. Klaus Schmidt",
          role: "CEO & Co-Founder",
          background: "Former Research Director at Siemens Energy",
        },
        { name: "Dr. Emma Wilson", role: "CTO & Co-Founder", background: "PhD in Materials Science from MIT" },
        { name: "Thomas Weber", role: "COO", background: "20+ years in manufacturing and operations" },
      ],
      financials: {
        revenueLastYear: 8500000,
        projectedRevenue: 22000000,
        burnRate: 750000,
        runway: "24 months",
      },
      documents: [
        { name: "Technical Whitepaper", type: "PDF", size: "5.7 MB" },
        { name: "Business Plan", type: "PDF", size: "3.2 MB" },
        { name: "Patent Portfolio", type: "PDF", size: "2.1 MB" },
      ],
      milestones: [
        { name: "Seed Funding", date: "2019-04", status: "Completed" },
        { name: "Prototype Development", date: "2020-08", status: "Completed" },
        { name: "Series A", date: "2021-05", status: "Completed" },
        { name: "Pilot Production", date: "2022-11", status: "Completed" },
        { name: "Series B", date: "2023-10", status: "In Progress" },
        { name: "Commercial Scale Production", date: "2024-09", status: "Planned" },
      ],
    },
    {
      id: "opp-003",
      name: "EdTech Learning Platform",
      description:
        "Personalized learning platform for K-12 students using adaptive technology to customize educational content.",
      longDescription: `
        Our adaptive learning platform is revolutionizing K-12 education by providing truly personalized learning experiences for every student.
        
        Using advanced AI algorithms, the platform continuously assesses each student's strengths, weaknesses, and learning style, then dynamically adjusts content difficulty, pacing, and teaching methods to optimize comprehension and retention.
        
        The platform covers all core subjects and aligns with national and state curriculum standards. It provides real-time feedback to students, detailed progress reports for teachers, and comprehensive analytics for school administrators.
        
        Early pilot programs have shown remarkable results: 32% improvement in test scores, 45% increase in student engagement, and 28% reduction in achievement gaps between different student demographics.
      `,
      industry: "Education",
      investmentLevel: "Seed",
      minInvestment: 2500000,
      targetROI: 25,
      currentPartners: 2,
      maxPartners: 8,
      deadline: "2025-08-01",
      fundingProgress: 30,
      tags: ["EdTech", "AI", "Mobile"],
      location: "Canada",
      companySize: "Small",
      foundedYear: 2023,
      team: [
        { name: "Jennifer Lee", role: "CEO & Founder", background: "Former Education Policy Advisor" },
        { name: "David Rodriguez", role: "CTO", background: "Ex-Senior Engineer at Khan Academy" },
        { name: "Dr. Michelle Taylor", role: "Chief Learning Officer", background: "PhD in Educational Psychology" },
      ],
      financials: {
        revenueLastYear: 350000,
        projectedRevenue: 2800000,
        burnRate: 180000,
        runway: "14 months",
      },
      documents: [
        { name: "Product Demo", type: "MP4", size: "28.5 MB" },
        { name: "Market Research", type: "PDF", size: "2.3 MB" },
        { name: "Pilot Program Results", type: "PDF", size: "1.9 MB" },
      ],
      milestones: [
        { name: "Pre-Seed Funding", date: "2023-01", status: "Completed" },
        { name: "MVP Development", date: "2023-06", status: "Completed" },
        { name: "Pilot Program", date: "2023-09", status: "Completed" },
        { name: "Seed Round", date: "2024-02", status: "In Progress" },
        { name: "Full Product Launch", date: "2024-08", status: "Planned" },
      ],
    },
    {
      id: "opp-004",
      name: "Blockchain Payment Solution",
      description:
        "Secure and efficient cross-border payment system using blockchain technology for financial institutions.",
      longDescription: `
        Our blockchain-based payment solution is transforming cross-border transactions for financial institutions worldwide.
        
        Traditional international payments are slow, expensive, and opaque, often taking 3-5 days to settle and charging fees of 3-7%. Our platform leverages blockchain technology to enable near-instant settlement (under 10 seconds), with fees below 0.5% and complete transparency throughout the process.
        
        The solution is fully compliant with international financial regulations, including KYC/AML requirements, and integrates seamlessly with existing banking systems. It supports transactions in over 40 currencies and has already processed over $500 million in transaction volume during our pilot phase.
      `,
      industry: "Finance",
      investmentLevel: "Series A",
      minInvestment: 7500000,
      targetROI: 20,
      currentPartners: 2,
      maxPartners: 4,
      deadline: "2025-06-15",
      fundingProgress: 45,
      tags: ["Blockchain", "Fintech", "Enterprise"],
      location: "Singapore",
      companySize: "Medium",
      foundedYear: 2021,
      team: [
        { name: "James Wong", role: "CEO & Co-Founder", background: "Former VP at JP Morgan Chase" },
        {
          name: "Sophia Nakamoto",
          role: "CTO & Co-Founder",
          background: "Blockchain Developer at Ethereum Foundation",
        },
        { name: "Alexander Kim", role: "Chief Compliance Officer", background: "15+ years in financial regulation" },
      ],
      financials: {
        revenueLastYear: 3200000,
        projectedRevenue: 12000000,
        burnRate: 450000,
        runway: "20 months",
      },
      documents: [
        { name: "Technical Architecture", type: "PDF", size: "4.8 MB" },
        { name: "Security Audit Report", type: "PDF", size: "3.1 MB" },
        { name: "Regulatory Compliance Framework", type: "PDF", size: "2.7 MB" },
      ],
      milestones: [
        { name: "Seed Funding", date: "2021-03", status: "Completed" },
        { name: "Alpha Version", date: "2021-11", status: "Completed" },
        { name: "Beta Launch with Select Partners", date: "2022-07", status: "Completed" },
        { name: "Regulatory Approval in Key Markets", date: "2023-04", status: "Completed" },
        { name: "Series A", date: "2023-12", status: "In Progress" },
        { name: "Global Expansion", date: "2024-09", status: "Planned" },
      ],
    },
    {
      id: "opp-005",
      name: "Smart Retail Analytics",
      description:
        "AI-powered retail analytics platform that helps brick-and-mortar stores optimize operations and enhance customer experience.",
      longDescription: `
        Our retail analytics platform is helping traditional brick-and-mortar retailers compete in the digital age by bringing e-commerce level insights to physical stores.
        
        Using a combination of computer vision, IoT sensors, and advanced analytics, our platform provides retailers with comprehensive data on customer behavior, store operations, and inventory management. The system can track foot traffic patterns, analyze customer demographics, measure product engagement, optimize staff allocation, and predict inventory needs.
        
        Retailers using our platform have seen an average 18% increase in sales, 22% improvement in conversion rates, and 15% reduction in operational costs. The platform integrates with existing POS and inventory management systems, requiring minimal changes to store infrastructure.
      `,
      industry: "Retail",
      investmentLevel: "Growth",
      minInvestment: 15000000,
      targetROI: 16,
      currentPartners: 5,
      maxPartners: 7,
      deadline: "2025-07-30",
      fundingProgress: 85,
      tags: ["Analytics", "AI", "Retail"],
      location: "United Kingdom",
      companySize: "Large",
      foundedYear: 2018,
      team: [
        { name: "Oliver Bennett", role: "CEO", background: "Former Retail Strategy Director at McKinsey" },
        { name: "Dr. Priya Sharma", role: "CTO", background: "PhD in Computer Vision from Cambridge" },
        { name: "Marcus Johnson", role: "COO", background: "Former Operations Executive at Tesco" },
      ],
      financials: {
        revenueLastYear: 18500000,
        projectedRevenue: 42000000,
        burnRate: 1200000,
        runway: "30 months",
      },
      documents: [
        { name: "Case Studies", type: "PDF", size: "5.3 MB" },
        { name: "Product Roadmap", type: "PDF", size: "2.8 MB" },
        { name: "Growth Strategy", type: "PDF", size: "3.4 MB" },
      ],
      milestones: [
        { name: "Seed Funding", date: "2018-05", status: "Completed" },
        { name: "MVP Development", date: "2019-01", status: "Completed" },
        { name: "Series A", date: "2019-09", status: "Completed" },
        { name: "Series B", date: "2021-03", status: "Completed" },
        { name: "International Expansion", date: "2022-08", status: "Completed" },
        { name: "Growth Round", date: "2023-11", status: "In Progress" },
        { name: "IPO Preparation", date: "2025-06", status: "Planned" },
      ],
    },
    {
      id: "opp-006",
      name: "Advanced Manufacturing Robotics",
      description:
        "Robotic systems for manufacturing automation with advanced computer vision and machine learning capabilities.",
      longDescription: `
        Our advanced robotics platform is revolutionizing manufacturing by bringing flexible automation to small and medium-sized enterprises.
        
        Traditional industrial robots are expensive, difficult to program, and limited to performing repetitive tasks in controlled environments. Our robots use computer vision and machine learning to adapt to changing conditions, learn new tasks through demonstration, and work safely alongside human workers.
        
        The system includes both hardware (modular robotic arms and mobile platforms) and software (intuitive programming interface and cloud-based fleet management). This combination makes advanced automation accessible to manufacturers who previously couldn't justify the cost and complexity of traditional robotics.
        
        Our robots are currently deployed across various industries including automotive, electronics, and consumer goods manufacturing, with customers reporting average productivity increases of 35% and ROI within 12 months.
      `,
      industry: "Manufacturing",
      investmentLevel: "Series B",
      minInvestment: 12000000,
      targetROI: 19,
      currentPartners: 3,
      maxPartners: 5,
      deadline: "2025-08-15",
      fundingProgress: 60,
      tags: ["Robotics", "AI", "Manufacturing"],
      location: "Japan",
      companySize: "Medium",
      foundedYear: 2020,
      team: [
        { name: "Hiroshi Tanaka", role: "CEO & Co-Founder", background: "Former Robotics Division Head at Toyota" },
        { name: "Dr. Emily Chen", role: "CTO & Co-Founder", background: "PhD in Robotics from Carnegie Mellon" },
        { name: "Kevin Park", role: "Chief Product Officer", background: "Former Lead Engineer at Boston Dynamics" },
      ],
      financials: {
        revenueLastYear: 9800000,
        projectedRevenue: 28000000,
        burnRate: 850000,
        runway: "22 months",
      },
      documents: [
        { name: "Technical Specifications", type: "PDF", size: "6.2 MB" },
        { name: "Customer Case Studies", type: "PDF", size: "4.5 MB" },
        { name: "Manufacturing Industry Analysis", type: "PDF", size: "3.8 MB" },
      ],
      milestones: [
        { name: "Seed Funding", date: "2020-02", status: "Completed" },
        { name: "Prototype Development", date: "2020-09", status: "Completed" },
        { name: "Series A", date: "2021-06", status: "Completed" },
        { name: "First Commercial Deployment", date: "2022-03", status: "Completed" },
        { name: "Series B", date: "2023-08", status: "In Progress" },
        { name: "Global Expansion", date: "2024-07", status: "Planned" },
      ],
    },
  ]

  useEffect(() => {
    // Simulate fetching opportunity data
    setLoading(true)
    const fetchOpportunity = async () => {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      const found = mockOpportunities.find((opp) => opp.id === opportunityId)

      if (found) {
        setOpportunity(found)
      } else {
        // Redirect if opportunity not found
        router.push("/marketplace")
      }
      setLoading(false)
    }

    // Check if opportunity is saved
    const checkIfSaved = () => {
      if (typeof window !== "undefined") {
        try {
          const savedOpps = JSON.parse(localStorage.getItem("savedOpportunities") || "[]")
          setIsSaved(savedOpps.includes(opportunityId))
        } catch (error) {
          console.error("Error checking saved status:", error)
        }
      }
    }

    fetchOpportunity()
    checkIfSaved()
  }, [opportunityId, router])

  // Handle save opportunity
  const handleSaveOpportunity = () => {
    if (!opportunity) return

    try {
      // Get existing saved opportunities
      const savedOpps = JSON.parse(localStorage.getItem("savedOpportunities") || "[]")

      // If already saved, do nothing
      if (savedOpps.includes(opportunityId)) {
        return
      }

      // Add to saved IDs
      const newSavedList = [...savedOpps, opportunityId]
      localStorage.setItem("savedOpportunities", JSON.stringify(newSavedList))

      // Also save the full opportunity data with timestamp
      const savedOppsData = JSON.parse(localStorage.getItem("savedOpportunitiesData") || "[]")
      const updatedSavedOpps = [
        ...savedOppsData,
        {
          ...opportunity,
          dateSaved: new Date().toISOString(),
        },
      ]
      localStorage.setItem("savedOpportunitiesData", JSON.stringify(updatedSavedOpps))

      // Update state
      setIsSaved(true)

      // Show feedback (in a real app, you'd use a toast notification)
      alert(`Opportunity saved! View in Saved Opportunities.`)
    } catch (error) {
      console.error("Error saving opportunity:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading opportunity details...</p>
        </div>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Opportunity Not Found</h2>
          <p className="mb-4">The investment opportunity you're looking for doesn't exist or has been removed.</p>
          <Button asChild className="gradient-button">
            <Link href="/marketplace">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/marketplace"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Opportunities
            </Link>
            <h1 className="text-3xl font-bold">Opportunity Details</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="gradient-button" onClick={handleSaveOpportunity} disabled={isSaved}>
              <BookmarkPlus className="w-5 h-5 mr-2" />
              {isSaved ? "Saved" : "Save Opportunity"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Opportunity Overview */}
        <Card className="leonardo-card border-gray-800 mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <CardTitle className="text-2xl">{opportunity.name}</CardTitle>
                <CardDescription className="text-gray-400 mt-1">{opportunity.description}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <IndustryBadge industry={opportunity.industry} />
                <InvestmentLevel level={opportunity.investmentLevel} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Minimum Investment</div>
                <div className="font-medium text-xl">${opportunity.minInvestment.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Target ROI</div>
                <div className="font-medium text-xl">{opportunity.targetROI}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Application Deadline</div>
                <div className="font-medium text-xl">
                  {new Date(opportunity.deadline).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Funding Progress</span>
                <span className="text-white">{opportunity.fundingProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${opportunity.fundingProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-gray-400 mr-2">Location:</span>
                <span className="text-white">{opportunity.location}</span>
              </div>
              <div className="flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-gray-400 mr-2">Company Size:</span>
                <span className="text-white">{opportunity.companySize}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-gray-400 mr-2">Founded:</span>
                <span className="text-white">{opportunity.foundedYear}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-400" />
                <span className="text-gray-400 mr-2">Partners:</span>
                <span className="text-white">
                  {opportunity.currentPartners}/{opportunity.maxPartners}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-gray-800 pt-6">
            <Link href={`/marketplace/apply/${opportunity.id}`}>
              <Button className="gradient-button">Apply for Investment</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="leonardo-tabs">
            <TabsTrigger value="overview" className="leonardo-tab">
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="leonardo-tab">
              Team
            </TabsTrigger>
            <TabsTrigger value="financials" className="leonardo-tab">
              Financials
            </TabsTrigger>
            <TabsTrigger value="documents" className="leonardo-tab">
              Documents
            </TabsTrigger>
            <TabsTrigger value="milestones" className="leonardo-tab">
              Milestones
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {opportunity.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="whitespace-pre-line text-gray-300">{opportunity.longDescription}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Leadership Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {opportunity.team.map((member: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700"
                    >
                      <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
                        <span className="text-xl font-bold">{member.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{member.name}</h3>
                        <p className="text-blue-400">{member.role}</p>
                        <p className="text-gray-400 mt-2">{member.background}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-2">
                      <BarChart2 className="w-5 h-5 mr-2 text-blue-400" />
                      <h3 className="text-lg font-medium">Revenue</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Year:</span>
                        <span className="font-medium">${opportunity.financials.revenueLastYear.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Projected:</span>
                        <span className="font-medium">${opportunity.financials.projectedRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-2">
                      <Clock className="w-5 h-5 mr-2 text-purple-400" />
                      <h3 className="text-lg font-medium">Runway</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Burn Rate:</span>
                        <span className="font-medium">${opportunity.financials.burnRate.toLocaleString()}/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Runway:</span>
                        <span className="font-medium">{opportunity.financials.runway}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                  <div className="flex items-center mb-4">
                    <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                    <h3 className="text-lg font-medium">Investment Opportunity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 mb-1">Minimum Investment</p>
                      <p className="text-xl font-medium">${opportunity.minInvestment.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Target ROI</p>
                      <p className="text-xl font-medium">{opportunity.targetROI}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Investment Level</p>
                      <p className="text-xl font-medium">{opportunity.investmentLevel}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Available Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunity.documents.map((doc: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-3 text-blue-400" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-400">
                            {doc.type} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800/30 text-white">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
                  <div className="space-y-6">
                    {opportunity.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="relative pl-10">
                        <div
                          className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 ${
                            milestone.status === "Completed"
                              ? "bg-green-500/20 border-green-500"
                              : milestone.status === "In Progress"
                                ? "bg-blue-500/20 border-blue-500"
                                : "bg-gray-800 border-gray-600"
                          }`}
                        ></div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{milestone.name}</h3>
                            <p className="text-sm text-gray-400">
                              {new Date(milestone.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                              })}
                            </p>
                          </div>
                          <Badge
                            className={`mt-2 md:mt-0 ${
                              milestone.status === "Completed"
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : milestone.status === "In Progress"
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                            } border`}
                            variant="outline"
                          >
                            {milestone.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


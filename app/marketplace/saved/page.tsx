"use client"

import { CardFooter } from "@/components/ui/card"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, TrendingUp, Calendar, Users, DollarSign, Trash2, BookmarkPlus, ArrowLeft } from "lucide-react"

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

// Saved opportunity card component
function SavedOpportunityCard({
  opportunity,
  onRemove,
}: {
  opportunity: any
  onRemove: (id: string) => void
}) {
  return (
    <Card className="leonardo-card border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{opportunity.name}</CardTitle>
          <InvestmentLevel level={opportunity.investmentLevel} />
        </div>
        <CardDescription className="text-gray-400 line-clamp-2">{opportunity.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <IndustryBadge industry={opportunity.industry} />
            {opportunity.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="bg-gray-800 border-gray-700">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Min Investment:</span>
              <span className="ml-1 text-white">${opportunity.minInvestment.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Target ROI:</span>
              <span className="ml-1 text-white">{opportunity.targetROI}%</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Partners:</span>
              <span className="ml-1 text-white">
                {opportunity.currentPartners}/{opportunity.maxPartners}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Deadline:</span>
              <span className="ml-1 text-white">
                {new Date(opportunity.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-1">
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
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t border-gray-800 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={() => onRemove(opportunity.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove
        </Button>
        <Link href={`/marketplace/apply/${opportunity.id}`}>
          <Button className="gradient-button" size="sm">
            Apply
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function SavedOpportunitiesPage() {
  // Mock saved opportunities data
  const [savedOpportunities, setSavedOpportunities] = useState<any[]>(() => {
    // Only run in the browser
    if (typeof window !== "undefined") {
      try {
        // Get saved opportunities data from localStorage
        const savedOppsData = JSON.parse(localStorage.getItem("savedOpportunitiesData") || "[]")
        return savedOppsData
      } catch (error) {
        console.error("Error loading saved opportunities:", error)
      }
    }
    return []
  })

  // State for filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [selectedInvestmentLevel, setSelectedInvestmentLevel] = useState("all")
  const [sortBy, setSortBy] = useState("dateSaved")

  // Handle removing a saved opportunity
  const handleRemove = (id: string) => {
    setSavedOpportunities((prev) => prev.filter((opp) => opp.id !== id))

    // Also update localStorage for both IDs and full data
    if (typeof window !== "undefined") {
      try {
        // Update IDs list
        const savedIds = JSON.parse(localStorage.getItem("savedOpportunities") || "[]")
        const updatedIds = savedIds.filter((savedId: string) => savedId !== id)
        localStorage.setItem("savedOpportunities", JSON.stringify(updatedIds))

        // Update full data
        const savedOppsData = JSON.parse(localStorage.getItem("savedOpportunitiesData") || "[]")
        const updatedOppsData = savedOppsData.filter((opp: any) => opp.id !== id)
        localStorage.setItem("savedOpportunitiesData", JSON.stringify(updatedOppsData))
      } catch (error) {
        console.error("Error updating localStorage:", error)
      }
    }
  }

  // Filter and sort opportunities
  const filteredOpportunities = savedOpportunities
    .filter((opp) => {
      // Filter by search query
      if (
        searchQuery &&
        !opp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !opp.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Filter by industry
      if (selectedIndustry !== "all" && opp.industry.toLowerCase() !== selectedIndustry.toLowerCase()) {
        return false
      }

      // Filter by investment level
      if (
        selectedInvestmentLevel !== "all" &&
        opp.investmentLevel.toLowerCase() !== selectedInvestmentLevel.toLowerCase()
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case "dateSaved":
          return new Date(b.dateSaved).getTime() - new Date(a.dateSaved).getTime()
        case "minInvestment":
          return a.minInvestment - b.minInvestment
        case "targetROI":
          return b.targetROI - a.targetROI
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        default:
          return 0
      }
    })

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
              Back to Marketplace
            </Link>
            <h1 className="text-3xl font-bold">Saved Opportunities</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/marketplace">
              <Button className="gradient-button">
                <BookmarkPlus className="w-5 h-5 mr-2" />
                Discover More
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search saved opportunities..."
                className="leonardo-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="leonardo-input w-[180px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedInvestmentLevel} onValueChange={setSelectedInvestmentLevel}>
                <SelectTrigger className="leonardo-input w-[180px]">
                  <SelectValue placeholder="Investment Level" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series a">Series A</SelectItem>
                  <SelectItem value="series b">Series B</SelectItem>
                  <SelectItem value="series c">Series C</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="leonardo-input w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="dateSaved">Recently Saved</SelectItem>
                  <SelectItem value="minInvestment">Min Investment</SelectItem>
                  <SelectItem value="targetROI">Target ROI</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Saved Opportunities */}
        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <SavedOpportunityCard key={opportunity.id} opportunity={opportunity} onRemove={handleRemove} />
            ))}
          </div>
        ) : (
          <div className="leonardo-card p-8 text-center">
            <h3 className="text-xl font-bold mb-2">No saved opportunities</h3>
            <p className="text-gray-400 mb-6">
              You haven't saved any investment opportunities yet, or none match your current filters.
            </p>
            <Link href="/marketplace">
              <Button className="gradient-button">
                <BookmarkPlus className="w-5 h-5 mr-2" />
                Discover Opportunities
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}


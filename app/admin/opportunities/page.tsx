"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Home, Search, PlusCircle, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react"

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

export default function AdminOpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [opportunityToDelete, setOpportunityToDelete] = useState<string | null>(null)

  // Mock opportunities data
  const [opportunities, setOpportunities] = useState([
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
    },
  ])

  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle opportunity deletion
  const handleDeleteOpportunity = () => {
    if (opportunityToDelete) {
      setOpportunities(opportunities.filter((opp) => opp.id !== opportunityToDelete))
      setOpportunityToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Filter and sort opportunities
  const filteredOpportunities = opportunities
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
      if (industryFilter !== "all" && opp.industry.toLowerCase() !== industryFilter.toLowerCase()) {
        return false
      }

      // Filter by investment level
      if (levelFilter !== "all" && opp.investmentLevel.toLowerCase() !== levelFilter.toLowerCase()) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Sort by selected field
      const fieldA = a[sortField as keyof typeof a]
      const fieldB = b[sortField as keyof typeof b]

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      }

      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA
      }

      return 0
    })

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/admin"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Investment Opportunities</h1>
          </div>
          <Link href="/admin/opportunities/new">
            <Button className="gradient-button">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Opportunity
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search opportunities..."
              className="leonardo-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
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

            <Select value={levelFilter} onValueChange={setLevelFilter}>
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
          </div>
        </div>

        {/* Opportunities Table */}
        <div className="rounded-md border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-900">
              <TableRow className="hover:bg-gray-900/50 border-gray-800">
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  <div className="flex items-center">
                    Opportunity Name
                    {sortField === "name" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("minInvestment")}>
                  <div className="flex items-center">
                    Min Investment
                    {sortField === "minInvestment" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hidden md:table-cell"
                  onClick={() => toggleSort("fundingProgress")}
                >
                  <div className="flex items-center">
                    Progress
                    {sortField === "fundingProgress" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    No opportunities found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <TableRow key={opportunity.id} className="hover:bg-gray-800/50 border-gray-800">
                    <TableCell className="font-medium">
                      <div>
                        <div>{opportunity.name}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{opportunity.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <IndustryBadge industry={opportunity.industry} />
                    </TableCell>
                    <TableCell>
                      <InvestmentLevel level={opportunity.investmentLevel} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${opportunity.minInvestment.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${opportunity.fundingProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-right mt-1">{opportunity.fundingProgress}%</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/opportunities/${opportunity.id}`}>
                          <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800/30 text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/opportunities/edit/${opportunity.id}`}>
                          <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800/30 text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-800/30 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => {
                            setOpportunityToDelete(opportunity.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete this investment opportunity? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteOpportunity}>
                Delete Opportunity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


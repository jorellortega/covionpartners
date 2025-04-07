"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Home,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Globe,
  DollarSign,
  Users,
  Star,
  Calendar,
  BookmarkPlus,
  ExternalLink,
  Send,
  Briefcase,
  MapPin,
  ArrowRight,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { MarketplaceOpportunity } from "@/app/types/marketplace"
import { createBrowserClient } from '@supabase/ssr'

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
        return "bg-pink-500/20 text-pink-400 border-pink-500/50"
      case "manufacturing":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      case "energy":
        return "bg-teal-500/20 text-teal-400 border-teal-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`leonardo-badge ${getIndustryStyles()} border`} variant="outline">
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
        return "bg-pink-500/20 text-pink-400 border-pink-500/50"
      case "growth":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`leonardo-badge ${getLevelStyles()} border`} variant="outline">
      {level}
    </Badge>
  )
}

// Opportunity card component
function OpportunityCard({
  opportunity,
  onApply,
  isSaved,
  onSave,
}: {
  opportunity: any
  onApply: (id: string) => void
  isSaved: boolean
  onSave: (id: string) => void
}) {
  return (
    <Card className="leonardo-card border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{opportunity.title}</CardTitle>
          <InvestmentLevel level={opportunity.investmentLevel || "Seed"} />
        </div>
        <CardDescription className="text-gray-400 line-clamp-2">{opportunity.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <IndustryBadge industry={opportunity.category} />
            {opportunity.required_skills.slice(0, 3).map((skill: string, index: number) => (
              <Badge key={index} variant="outline" className="leonardo-badge bg-gray-800 border-gray-700">
                {skill}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Min Investment:</span>
              <span className="ml-1 text-white">
                {opportunity.budget.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD'
                })}
              </span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Target ROI:</span>
              <span className="ml-1 text-white">20%</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Partners:</span>
              <span className="ml-1 text-white">0/5</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
              <span className="text-gray-400">Deadline:</span>
              <span className="ml-1 text-white">
                {new Date(opportunity.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Funding Progress</span>
              <span className="text-white">0%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t border-gray-800 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          onClick={() => onSave(opportunity.id)}
          disabled={isSaved}
        >
          <BookmarkPlus className="w-4 h-4 mr-2" />
          {isSaved ? "Saved" : "Save"}
        </Button>
        <Button className="gradient-button" size="sm" onClick={() => onApply(opportunity.id)}>
          Apply
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [opportunities, setOpportunities] = useState<MarketplaceOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [selectedInvestmentLevel, setSelectedInvestmentLevel] = useState("all")
  const [minInvestmentRange, setMinInvestmentRange] = useState([0, 20000000])
  const [selectedTab, setSelectedTab] = useState("all")
  const [savedOpportunities, setSavedOpportunities] = useState<string[]>([])

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      let query = supabase
        .from('marketplace_opportunities')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setOpportunities(data || [])
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOpportunities = opportunities.filter(opportunity =>
    opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const industries = Array.from(new Set(opportunities.map(opp => opp.category)))

  const handleSaveOpportunity = (opportunityId: string) => {
    if (!savedOpportunities.includes(opportunityId)) {
      setSavedOpportunities([...savedOpportunities, opportunityId])
    }
  }

  const handleApply = (opportunityId: string) => {
    router.push(`/marketplace/apply/${opportunityId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Marketplace</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/marketplace/saved">
              <Button className="gradient-button">
                <Star className="w-5 h-5 mr-2" />
                Saved Opportunities
              </Button>
            </Link>
            <Button className="gradient-button" onClick={() => router.push("/projectrequest")}>
              <Briefcase className="w-5 h-5 mr-2" />
              Post Opportunity
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Marketplace Intro */}
        <div className="leonardo-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold gradient-text mb-2">Investment Opportunities</h2>
              <p className="text-gray-400 max-w-2xl">
                Discover curated investment opportunities across various industries. Apply to partner with innovative
                companies and projects with high growth potential.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <Globe className="w-6 h-6 text-blue-400 mr-2" />
              <span className="text-white">{opportunities.length} Opportunities Available</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
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
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="leonardo-input w-[180px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
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

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle>Advanced Filters</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Refine your search with additional filters.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Investment Range</label>
                      <div className="pt-6 px-2">
                        <Slider
                          defaultValue={[0, 20000000]}
                          max={20000000}
                          step={10000}
                          value={minInvestmentRange}
                          onValueChange={setMinInvestmentRange}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>${minInvestmentRange[0].toLocaleString()}</span>
                        <span>${minInvestmentRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Select>
                        <SelectTrigger className="leonardo-input">
                          <SelectValue placeholder="Any Location" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="any">Any Location</SelectItem>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="europe">Europe</SelectItem>
                          <SelectItem value="asia">Asia</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Size</label>
                      <Select>
                        <SelectTrigger className="leonardo-input">
                          <SelectValue placeholder="Any Size" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="any">Any Size</SelectItem>
                          <SelectItem value="startup">Startup (1-10)</SelectItem>
                          <SelectItem value="small">Small (11-50)</SelectItem>
                          <SelectItem value="medium">Medium (51-200)</SelectItem>
                          <SelectItem value="large">Large (201+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                      Reset Filters
                    </Button>
                    <Button className="gradient-button">Apply Filters</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="leonardo-tabs">
              <TabsTrigger value="all" className="leonardo-tab">
                All
              </TabsTrigger>
              <TabsTrigger value="trending" className="leonardo-tab">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="new" className="leonardo-tab">
                <Star className="w-4 h-4 mr-2" />
                New
              </TabsTrigger>
              <TabsTrigger value="closing-soon" className="leonardo-tab">
                <Clock className="w-4 h-4 mr-2" />
                Closing Soon
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Opportunities Grid */}
        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onApply={handleApply}
                isSaved={savedOpportunities.includes(opportunity.id)}
                onSave={handleSaveOpportunity}
              />
            ))}
          </div>
        ) : (
          <div className="leonardo-card p-8 text-center">
            <h3 className="text-xl font-bold mb-2">No opportunities found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or search criteria to find more opportunities.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}


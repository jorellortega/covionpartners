"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DevelopmentBanner } from "@/components/ui/development-banner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  ArrowLeft,
  Search,
  Filter,
  SortAsc,
  DollarSign,
  Briefcase,
  Clock,
  Users,
  BarChart,
  Target,
  TrendingUp,
  Tag
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Mock data for sale listings
const mockListings = [
  {
    id: "1",
    name: "Tech Innovation Hub",
    description: "A thriving technology innovation center with established partnerships and growing revenue stream.",
    askingPrice: 2500000,
    monthlyRevenue: 75000,
    roi: 28,
    industry: "Technology",
    teamSize: 15,
    established: "2021",
    location: "San Francisco, CA",
    thumbnail: null,
    highlights: [
      "Profitable for 18 consecutive months",
      "Strategic partnerships with Fortune 500 companies",
      "Proprietary technology portfolio",
      "Diverse revenue streams"
    ],
    metrics: {
      growthRate: 45,
      marketSize: "8.5B",
      customerBase: 250
    }
  },
  {
    id: "2",
    name: "Green Energy Solutions",
    description: "Renewable energy consulting firm with strong market presence and recurring client base.",
    askingPrice: 1800000,
    monthlyRevenue: 45000,
    roi: 22,
    industry: "Clean Energy",
    teamSize: 8,
    established: "2020",
    location: "Austin, TX",
    thumbnail: null,
    highlights: [
      "Government contracts secured",
      "Patent-pending technology",
      "Established client relationships",
      "High profit margins"
    ],
    metrics: {
      growthRate: 35,
      marketSize: "12B",
      customerBase: 120
    }
  },
  {
    id: "3",
    name: "HealthTech Platform",
    description: "Digital health platform connecting patients with healthcare providers, featuring AI-driven diagnostics.",
    askingPrice: 3500000,
    monthlyRevenue: 120000,
    roi: 32,
    industry: "Healthcare",
    teamSize: 20,
    established: "2019",
    location: "Boston, MA",
    thumbnail: null,
    highlights: [
      "HIPAA compliant infrastructure",
      "Machine learning capabilities",
      "Growing subscriber base",
      "Multiple revenue streams"
    ],
    metrics: {
      growthRate: 60,
      marketSize: "15B",
      customerBase: 500
    }
  }
]

export default function ForSalePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")

  // Filter listings based on search query
  const filteredListings = mockListings.filter(listing =>
    listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <DevelopmentBanner />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-purple-400"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Projects For Sale</h1>
              <p className="text-gray-400">Browse acquisition opportunities and investment listings</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
              <SortAsc className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredListings.map((listing) => (
            <Card
              key={listing.id}
              className="border-gray-800 hover:border-purple-500/50 transition-colors"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{listing.name}</CardTitle>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                      {listing.industry}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      ${listing.askingPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Asking Price</div>
                  </div>
                </div>
                <CardDescription className="mt-4 text-gray-400">
                  {listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>Monthly Revenue</span>
                      </div>
                      <div className="text-white font-medium">
                        ${listing.monthlyRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>ROI</span>
                      </div>
                      <div className="text-white font-medium">
                        {listing.roi}%
                      </div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-1">
                        <Users className="w-4 h-4 mr-1" />
                        <span>Team Size</span>
                      </div>
                      <div className="text-white font-medium">
                        {listing.teamSize} people
                      </div>
                    </div>
                  </div>

                  {/* Business Highlights */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400">Business Highlights</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {listing.highlights.map((highlight, index) => (
                        <div
                          key={index}
                          className="flex items-center p-2 bg-gray-800/30 rounded-lg text-sm text-gray-300"
                        >
                          <Target className="w-4 h-4 mr-2 text-purple-400" />
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-400">
                        <BarChart className="w-4 h-4 mr-2" />
                        <span>Growth Rate:</span>
                        <span className="ml-2 text-green-400">{listing.metrics.growthRate}%</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Target className="w-4 h-4 mr-2" />
                        <span>Market Size:</span>
                        <span className="ml-2 text-white">${listing.metrics.marketSize}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Established:</span>
                        <span className="ml-2 text-white">{listing.established}</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Briefcase className="w-4 h-4 mr-2" />
                        <span>Location:</span>
                        <span className="ml-2 text-white">{listing.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => router.push(`/buy?listing=${listing.id}`)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                      onClick={() => router.push(`/listing/${listing.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center mb-4">
              <Tag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No listings found
            </h3>
            <p className="text-gray-400">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Check back later for new opportunities"}
            </p>
          </div>
        )}
      </main>
    </div>
  )
} 
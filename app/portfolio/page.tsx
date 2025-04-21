"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Calendar,
  Clock
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Mock data
const mockInvestments = [
  {
    id: "1",
    project_id: "proj1",
    amount: 50000,
    date: "2024-01-15",
    status: "active",
    project: {
      name: "Tech Innovation Fund",
      type: "technology",
      status: "Active"
    }
  },
  {
    id: "2",
    project_id: "proj2",
    amount: 75000,
    date: "2024-02-01",
    status: "active",
    project: {
      name: "Green Energy Initiative",
      type: "energy",
      status: "Active"
    }
  },
  {
    id: "3",
    project_id: "proj3",
    amount: 100000,
    date: "2024-02-15",
    status: "pending",
    project: {
      name: "Real Estate Development",
      type: "real-estate",
      status: "In Progress"
    }
  }
]

export default function PortfolioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Using mock data
  const totalInvested = 225000 // Sum of all investments
  const portfolioValue = 258750 // Mock 15% increase
  const returns = portfolioValue - totalInvested
  const investments = mockInvestments

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Briefcase className="w-6 h-6 mr-2 text-blue-400" />
              Investment Portfolio
            </h1>
            <p className="text-gray-400">Manage and track your investments</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            onClick={() => router.push('/invest')}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            New Investment
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Invested</p>
                  <h3 className="text-2xl font-bold">${totalInvested.toLocaleString()}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Portfolio Value</p>
                  <h3 className="text-2xl font-bold">${portfolioValue.toLocaleString()}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Returns</p>
                  <div className="flex items-center">
                    <h3 className="text-2xl font-bold">${returns.toLocaleString()}</h3>
                    {returns > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400 ml-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400 ml-1" />
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Investments</p>
                  <h3 className="text-2xl font-bold">{investments.length}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Investment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.map((investment) => (
                <div 
                  key={investment.id}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${investment.project_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{investment.project.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(investment.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${investment.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {investment.project.status}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
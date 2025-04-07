"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, BarChart2, TrendingUp, DollarSign, Users, Calendar } from "lucide-react"

export default function AnalyticsPage() {
  // Mock data for analytics
  const [analyticsData] = useState({
    totalEarnings: 15750000,
    activeProjects: 8,
    completedProjects: 12,
    conversionRate: 68,
    monthlyGrowth: 12.4,
    newPartners: 5,
  })

  // Mock data for monthly earnings chart
  const [monthlyEarnings] = useState([
    { month: "Jan", amount: 1200000 },
    { month: "Feb", amount: 1350000 },
    { month: "Mar", amount: 1100000 },
    { month: "Apr", amount: 1500000 },
    { month: "May", amount: 1800000 },
    { month: "Jun", amount: 2100000 },
  ])

  // Calculate max value for chart scaling
  const maxEarning = Math.max(...monthlyEarnings.map((item) => item.amount))

  return (
    <div className="min-h-screen">
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
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="leonardo-badge-primary">Last 30 Days</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="leonardo-card p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Total Earnings</p>
                <h3 className="text-3xl font-bold mt-1">${analyticsData.totalEarnings.toLocaleString()}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-green-400 text-sm">+{analyticsData.monthlyGrowth}%</span>
              <span className="text-gray-400 text-sm ml-1">from last month</span>
            </div>
          </div>

          <div className="leonardo-card p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Active Projects</p>
                <h3 className="text-3xl font-bold mt-1">{analyticsData.activeProjects}</h3>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <BarChart2 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-gray-400 text-sm">{analyticsData.completedProjects} completed this year</span>
            </div>
          </div>

          <div className="leonardo-card p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">New Partners</p>
                <h3 className="text-3xl font-bold mt-1">{analyticsData.newPartners}</h3>
              </div>
              <div className="p-3 rounded-full bg-pink-500/20">
                <Users className="w-6 h-6 text-pink-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-gray-400 text-sm">Conversion rate: {analyticsData.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="leonardo-card p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Monthly Earnings</h2>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-400">Last 6 months</span>
            </div>
          </div>

          <div className="h-64">
            <div className="flex h-full items-end space-x-2">
              {monthlyEarnings.map((item) => (
                <div key={item.month} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-md"
                    style={{
                      height: `${(item.amount / maxEarning) * 80}%`,
                      minHeight: "20px",
                    }}
                  ></div>
                  <div className="mt-2 text-xs text-gray-400">{item.month}</div>
                  <div className="mt-1 text-sm font-medium">${item.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Analytics Section */}
        <div className="leonardo-card p-6">
          <h2 className="text-xl font-bold mb-4">Performance Insights</h2>
          <p className="text-gray-300 mb-4">
            Your portfolio is performing well with a steady growth rate. The conversion rate has increased by 5%
            compared to the previous quarter.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/30 p-4 rounded-md border border-gray-700">
              <h3 className="text-lg font-medium mb-2">Top Performing Projects</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>AI Integration</span>
                  <span className="text-green-400">$3,200</span>
                </li>
                <li className="flex justify-between">
                  <span>Web Development</span>
                  <span className="text-green-400">$2,800</span>
                </li>
                <li className="flex justify-between">
                  <span>Mobile App</span>
                  <span className="text-green-400">$2,400</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/30 p-4 rounded-md border border-gray-700">
              <h3 className="text-lg font-medium mb-2">Growth Opportunities</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                  <span>Expand into enterprise solutions</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  <span>Increase marketing partnerships</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mr-2"></div>
                  <span>Develop recurring revenue streams</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


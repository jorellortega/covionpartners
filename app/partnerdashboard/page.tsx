"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import {
  Building2,
  DollarSign,
  Users,
  BarChart3,
  Plus,
  FileText,
  Calculator,
  Lightbulb,
  Globe,
  Wallet,
  ExternalLink,
  Briefcase,
  TrendingUp,
  BarChart2
} from "lucide-react"
import Link from "next/link"
import { StatusBadge } from "@/components/status-badge"

export default function PartnerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [availableBalance, setAvailableBalance] = useState(500000)

  if (!user) {
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
            <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          </div>
          <div className="flex space-x-4">
            <Button className="gradient-button" onClick={() => router.push("/projects/new")}>
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
            <Button className="gradient-button" onClick={() => router.push("/team")}>
              <Users className="w-5 h-5 mr-2" />
              Manage Team
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Withdraw Card */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-400" />
                Withdraw
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs sm:text-sm text-gray-400">Available Balance</p>
                </div>
                <Link href="/payments">
                  <Button variant="ghost" className="w-full sm:w-auto text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="leonardo-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Active Projects</p>
                  <h3 className="text-3xl font-bold mt-1">12</h3>
                </div>
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+2 this month</span>
              </div>
            </div>

            <div className="leonardo-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <h3 className="text-3xl font-bold mt-1">$45,231</h3>
                </div>
                <div className="p-3 rounded-full bg-green-500/20">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+12% from last month</span>
              </div>
            </div>

            <div className="leonardo-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Team Members</p>
                  <h3 className="text-3xl font-bold mt-1">8</h3>
                </div>
                <div className="p-3 rounded-full bg-purple-500/20">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+1 this month</span>
              </div>
            </div>

            <div className="leonardo-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">Growth Rate</p>
                  <h3 className="text-3xl font-bold mt-1">+23%</h3>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <BarChart3 className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+5% from last month</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Activity */}
            <Card className="leonardo-card border-gray-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">New Project Created</p>
                        <p className="text-sm text-gray-400">AI Integration Platform</p>
                      </div>
                      <p className="text-sm text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Project Milestone Completed</p>
                        <p className="text-sm text-gray-400">Mobile App Development - Design Phase</p>
                      </div>
                      <p className="text-sm text-gray-400">5 hours ago</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">New Team Member Added</p>
                        <p className="text-sm text-gray-400">Sarah Johnson - UI/UX Designer</p>
                      </div>
                      <p className="text-sm text-gray-400">Yesterday</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Project Status Updated</p>
                        <p className="text-sm text-gray-400">E-commerce Platform - Now Active</p>
                      </div>
                      <p className="text-sm text-gray-400">2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/projects')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Projects
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/projects/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/team')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Team
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/revenue')}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Revenue
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/analytics')}
                  >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/marketplace')}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Browse Opportunities
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/documents')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Documents
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/payments')}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Manage Payments
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/projectrequest')}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Submit Project Request
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/payments')}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Projects */}
          <div className="mt-6 sm:mt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Active Projects</h2>
              <Button variant="outline" className="w-full sm:w-auto border-gray-700 bg-gray-800/30 text-white">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="leonardo-card border-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base sm:text-lg">Project {i}</CardTitle>
                      <StatusBadge status="Active" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">65%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 sm:h-2 rounded-full"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Deadline</span>
                        <span className="text-white">Jun 15, 2025</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 
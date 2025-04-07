"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Users, DollarSign, Settings, Briefcase, Globe, BarChart2, Cog } from "lucide-react"

export default function AdminDashboardPage() {
  const [adminName] = useState("Admin User")

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4">
              <Home className="w-6 h-6 mr-2" />
              Home
            </Link>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <Link href="/">
            <Button variant="outline" className="gradient-button">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="leonardo-card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Welcome, {adminName}</h2>
          <p className="text-gray-300">
            This is the admin dashboard where you can manage users, review withdrawal requests, and monitor platform
            activity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Manage user accounts, permissions, and activity.</p>
              <Link href="/admin/users">
                <Button className="w-full gradient-button">Manage Users</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                Withdrawal Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Review and approve pending withdrawal requests.</p>
              <Link href="/admin/withdrawals">
                <Button className="w-full gradient-button">View Withdrawals</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-purple-400" />
                Project Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Create, edit, and manage investment projects.</p>
              <Link href="/admin/projects">
                <Button className="w-full gradient-button">Manage Projects</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-400" />
                Investment Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Manage marketplace investment opportunities.</p>
              <Link href="/admin/opportunities">
                <Button className="w-full gradient-button">Manage Opportunities</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-yellow-400" />
                Financial Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Access platform analytics and financial reports.</p>
              <Link href="/admin/reports">
                <Button className="w-full gradient-button">View Reports</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Cog className="w-5 h-5 mr-2 text-gray-400" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">Configure platform settings and preferences.</p>
              <Link href="/admin/settings">
                <Button className="w-full gradient-button">System Settings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Withdrawal Request Submitted</p>
                    <p className="text-sm text-gray-400">User: john.doe@example.com</p>
                  </div>
                  <p className="text-sm text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">New User Registration</p>
                    <p className="text-sm text-gray-400">User: sarah.smith@example.com</p>
                  </div>
                  <p className="text-sm text-gray-400">5 hours ago</p>
                </div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Project Investment Completed</p>
                    <p className="text-sm text-gray-400">Project: AI Integration Platform</p>
                  </div>
                  <p className="text-sm text-gray-400">Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


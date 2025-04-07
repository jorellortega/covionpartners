"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Code,
  GitBranch,
  Clock,
  MessageSquare,
  Settings,
  BarChart3,
  CheckCircle,
} from "lucide-react"

export default function DeveloperDashboard() {
  const { user } = useAuth()
  const router = useRouter()

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
            <h1 className="text-3xl font-bold">Developer Dashboard</h1>
          </div>
          <div className="flex space-x-4">
            <Button className="gradient-button" onClick={() => router.push("/developer/tasks")}>
              <Code className="w-5 h-5 mr-2" />
              My Tasks
            </Button>
            <Button className="gradient-button" onClick={() => router.push("/developer/repos")}>
              <GitBranch className="w-5 h-5 mr-2" />
              Repositories
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-blue-400" />
                Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">8</p>
              <p className="text-sm text-gray-400">In Progress</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">24</p>
              <p className="text-sm text-gray-400">This Week</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-400" />
                Hours Logged
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">32</p>
              <p className="text-sm text-gray-400">This Week</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">3</p>
              <p className="text-sm text-gray-400">Unread</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 
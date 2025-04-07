"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  DollarSign,
  FileText,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react"

export default function ClientDashboard() {
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
            <h1 className="text-3xl font-bold">Client Dashboard</h1>
          </div>
          <div className="flex space-x-4">
            <Button className="gradient-button" onClick={() => router.push("/client/projects")}>
              <Building2 className="w-5 h-5 mr-2" />
              My Projects
            </Button>
            <Button className="gradient-button" onClick={() => router.push("/client/messages")}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Messages
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-400" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">3</p>
              <p className="text-sm text-gray-400">In Progress</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                Total Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$1.2M</p>
              <p className="text-sm text-gray-400">Across Projects</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-yellow-400" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-gray-400">Shared Files</p>
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
              <p className="text-3xl font-bold">5</p>
              <p className="text-sm text-gray-400">Unread</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 
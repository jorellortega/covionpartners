"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  UserPlus,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

export default function TeamPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Mock team data
  const teamMembers = [
    {
      id: 1,
      name: "John Doe",
      role: "Lead Developer",
      email: "john@example.com",
      phone: "+1 (555) 123-4567",
      department: "Engineering",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "UI/UX Designer",
      email: "jane@example.com",
      phone: "+1 (555) 234-5678",
      department: "Design",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    },
    {
      id: 3,
      name: "Mike Johnson",
      role: "Project Manager",
      email: "mike@example.com",
      phone: "+1 (555) 345-6789",
      department: "Management",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">Team Management</h1>
          </div>
          <Button className="gradient-button" onClick={() => router.push("/team/new")}>
            <UserPlus className="w-5 h-5 mr-2" />
            Add Team Member
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Search and Filter */}
          <Card className="leonardo-card border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search team members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-gray-700"
                    />
                  </div>
                </div>
                <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                  <Building2 className="w-4 h-4 mr-2" />
                  Filter by Department
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id} className="leonardo-card border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <p className="text-sm text-gray-400">{member.role}</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-gray-400 hover:text-white">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-300">{member.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-300">{member.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-300">{member.department}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
} 
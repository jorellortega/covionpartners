"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  Building2,
  Settings,
  Plus,
  X,
  Check,
  AlertTriangle,
  Clock,
  Star,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  FileText,
  DollarSign,
  MessageSquare,
  Calendar,
  BarChart2
} from "lucide-react"

// Access level definitions
const accessLevels = {
  "5": {
    description: "Complete administrative access with full control over all project aspects",
    permissions: [
      "View all project data",
      "Edit project settings",
      "Manage team members",
      "Access financial data",
      "Create and edit tasks",
      "Manage documents",
      "View analytics",
      "Send messages",
      "Delete project data",
      "Manage access levels"
    ]
  },
  "4": {
    description: "Advanced access with ability to manage most project features",
    permissions: [
      "View all project data",
      "Edit project settings",
      "Create and edit tasks",
      "Manage documents",
      "View analytics",
      "Send messages",
      "Manage team members",
      "Access financial data"
    ]
  },
  "3": {
    description: "Standard access with core project management capabilities",
    permissions: [
      "View project data",
      "Create and edit tasks",
      "Access documents",
      "View analytics",
      "Send messages",
      "Manage assigned tasks"
    ]
  },
  "2": {
    description: "Basic access with limited project interaction",
    permissions: [
      "View project data",
      "View tasks",
      "View documents",
      "Send messages",
      "Update assigned tasks"
    ]
  },
  "1": {
    description: "Minimal access with view-only permissions",
    permissions: [
      "View project data",
      "View tasks",
      "View documents",
      "Send messages"
    ]
  }
}

// Mock data for projects
const mockProjects = [
  {
    id: 1,
    name: "Green Energy Solutions",
    description: "Sustainable energy infrastructure project",
    members: [
      { id: 1, name: "Alex Lee", role: "Project Owner", position: "Project Manager", access: "5", avatar: "AL" },
      { id: 2, name: "Sarah Johnson", role: "Developer", position: "Senior Developer", access: "4", avatar: "SJ" },
      { id: 3, name: "Mike Ross", role: "Designer", position: "UI/UX Designer", access: "3", avatar: "MR" },
    ]
  },
  {
    id: 2,
    name: "AI Analytics Platform",
    description: "Next-gen data analysis tool",
    members: [
      { id: 1, name: "Alex Lee", role: "Project Owner", position: "Project Manager", access: "5", avatar: "AL" },
      { id: 4, name: "Rachel Kim", role: "Developer", position: "Backend Developer", access: "4", avatar: "RK" },
      { id: 5, name: "David Chen", role: "Analyst", position: "Data Analyst", access: "2", avatar: "DC" },
    ]
  },
  {
    id: 3,
    name: "Smart City Initiative",
    description: "Urban infrastructure modernization",
    members: [
      { id: 1, name: "Alex Lee", role: "Project Owner", position: "Project Manager", access: "5", avatar: "AL" },
      { id: 6, name: "Emma Wilson", role: "Architect", position: "Solutions Architect", access: "4", avatar: "EW" },
      { id: 7, name: "James Brown", role: "Engineer", position: "Systems Engineer", access: "3", avatar: "JB" },
    ]
  }
]

// Mock list of possible positions for demo
const possiblePositions = [
  "Project Manager",
  "Senior Developer",
  "Backend Developer",
  "UI/UX Designer",
  "Data Analyst",
  "Solutions Architect",
  "Systems Engineer"
]

export default function AccessLevelsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState(mockProjects[0])
  const [expandedMember, setExpandedMember] = useState<number | null>(null)
  const [members, setMembers] = useState(selectedProject.members)
  const [customPositions, setCustomPositions] = useState<{ [memberId: number]: string }>({})

  // Update members when project changes
  React.useEffect(() => {
    setMembers(selectedProject.members)
    setCustomPositions({})
  }, [selectedProject])

  const handleAccessChange = (memberId: number, newAccess: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, access: newAccess } : m
      )
    )
    // In a real implementation, this would update the database
    console.log(`Changing access for member ${memberId} to ${newAccess}`)
  }

  const handlePositionChange = (memberId: number, newPosition: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, position: newPosition } : m
      )
    )
    // If "Custom..." is selected, show input
    if (newPosition === "__custom__") {
      setCustomPositions((prev) => ({ ...prev, [memberId]: "" }))
    } else {
      setCustomPositions((prev) => {
        const updated = { ...prev }
        delete updated[memberId]
        return updated
      })
    }
    // In a real implementation, this would update the database
    console.log(`Changing position for member ${memberId} to ${newPosition}`)
  }

  const handleCustomPositionChange = (memberId: number, value: string) => {
    setCustomPositions((prev) => ({ ...prev, [memberId]: value }))
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, position: value } : m
      )
    )
    // In a real implementation, this would update the database
    console.log(`Custom position for member ${memberId}: ${value}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Access Levels</h1>
            <p className="text-gray-400">Manage team member access to projects and features</p>
          </div>
          <Button className="gradient-button">
            <Plus className="w-4 h-4 mr-2" />
            Add New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Project Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedProject.id === project.id
                          ? "bg-purple-500/20 border border-purple-500/50"
                          : "hover:bg-gray-800/50"
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-purple-400" />
                        <div>
                          <h3 className="font-medium text-white">{project.name}</h3>
                          <p className="text-sm text-gray-400">{project.members.length} members</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">{selectedProject.name}</CardTitle>
                    <p className="text-gray-400">{selectedProject.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 bg-gray-900 border-gray-700"
                    />
                    <Button variant="outline" className="border-gray-700">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="leonardo-card border border-gray-800 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-white">{member.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {member.role}
                              </Badge>
                              <Select
                                value={possiblePositions.includes(member.position) ? member.position : "__custom__"}
                                onValueChange={(value) => handlePositionChange(member.id, value)}
                              >
                                <SelectTrigger className="w-36 bg-gray-900 border-gray-700 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {possiblePositions.map((pos) => (
                                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                  ))}
                                  <SelectItem value="__custom__">Custom...</SelectItem>
                                </SelectContent>
                              </Select>
                              {customPositions[member.id] !== undefined && (
                                <Input
                                  className="w-36 bg-gray-900 border-gray-700 text-xs"
                                  placeholder="Enter custom position"
                                  value={customPositions[member.id]}
                                  onChange={e => handleCustomPositionChange(member.id, e.target.value)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Select
                            value={member.access}
                            onValueChange={(value) => handleAccessChange(member.id, value)}
                          >
                            <SelectTrigger className="w-32 bg-gray-900 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">Level 5 - Admin</SelectItem>
                              <SelectItem value="4">Level 4 - Advanced</SelectItem>
                              <SelectItem value="3">Level 3 - Standard</SelectItem>
                              <SelectItem value="2">Level 2 - Basic</SelectItem>
                              <SelectItem value="1">Level 1 - View Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                          >
                            {expandedMember === member.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {expandedMember === member.id && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">
                            {accessLevels[member.access as keyof typeof accessLevels].description}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {accessLevels[member.access as keyof typeof accessLevels].permissions.map((permission, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                                <Check className="w-4 h-4 text-green-400" />
                                {permission}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 
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
  BarChart2,
  CheckCircle,
  UserPlus
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

export default function AccessLevelsPromo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-950 to-indigo-900 flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Access Levels: Secure, Flexible Project Collaboration</h1>
        <p className="text-lg text-gray-300 mb-6">
          Empower your team with a robust, customizable access level system. Control who can view, edit, or manage every aspect of your projects—effortlessly and securely.
        </p>
          </div>
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <Card className="bg-gray-900/80 border-purple-700">
              <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <Shield className="w-6 h-6" /> Why Access Levels?
            </CardTitle>
              </CardHeader>
              <CardContent>
            <ul className="text-gray-300 space-y-3 text-left">
              <li className="flex items-center gap-2"><CheckCircle className="text-green-400 w-5 h-5" /> Protect sensitive data and actions</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-400 w-5 h-5" /> Give the right people the right permissions</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-400 w-5 h-5" /> Streamline collaboration and reduce risk</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-green-400 w-5 h-5" /> Adapt to any team structure or workflow</li>
            </ul>
              </CardContent>
            </Card>
        <Card className="bg-gray-900/80 border-indigo-700">
              <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-400">
              <Users className="w-6 h-6" /> How It Works
            </CardTitle>
              </CardHeader>
              <CardContent>
            <ol className="text-gray-300 space-y-3 text-left list-decimal list-inside">
              <li>Assign each team member an <span className="text-purple-300 font-semibold">Access Level</span> (1–5)</li>
              <li>Set access levels on files, actions, and project sections</li>
              <li>Users see and do only what their level allows</li>
              <li>Change access levels anytime for instant control</li>
            </ol>
          </CardContent>
        </Card>
                            </div>
      <div className="w-full max-w-4xl bg-gradient-to-r from-purple-800/60 to-indigo-800/60 rounded-2xl p-8 mb-16 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Access Level Examples</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          <div className="flex flex-col items-center">
            <Lock className="w-10 h-10 text-purple-400 mb-2" />
            <span className="text-lg font-bold text-purple-300">Level 1</span>
            <span className="text-gray-300 text-sm mt-1">Strictly confidential<br />Top-level management only</span>
                          </div>
          <div className="flex flex-col items-center">
            <Shield className="w-10 h-10 text-blue-400 mb-2" />
            <span className="text-lg font-bold text-blue-300">Level 2</span>
            <span className="text-gray-300 text-sm mt-1">Sensitive project data<br />Core team access</span>
                        </div>
          <div className="flex flex-col items-center">
            <Star className="w-10 h-10 text-green-400 mb-2" />
            <span className="text-lg font-bold text-green-300">Level 3</span>
            <span className="text-gray-300 text-sm mt-1">General team files<br />Collaborators & advisors</span>
                        </div>
          <div className="flex flex-col items-center">
            <Eye className="w-10 h-10 text-yellow-400 mb-2" />
            <span className="text-lg font-bold text-yellow-300">Level 4</span>
            <span className="text-gray-300 text-sm mt-1">View-only or external partners</span>
                      </div>
          <div className="flex flex-col items-center">
            <UserPlus className="w-10 h-10 text-pink-400 mb-2" />
            <span className="text-lg font-bold text-pink-300">Level 5</span>
            <span className="text-gray-300 text-sm mt-1">Guests, new members, or public info</span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-3xl bg-gray-900/80 rounded-2xl p-8 shadow-lg text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to unlock secure, flexible collaboration?</h2>
        <p className="text-lg text-gray-300 mb-6">Try our access level system today and see how easy it is to manage permissions, protect your data, and empower your team!</p>
        <a href="/account-types" className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg shadow-lg hover:from-purple-600 hover:to-indigo-600 transition">Get Started</a>
      </div>
    </div>
  )
} 
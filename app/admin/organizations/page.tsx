"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Organization {
  id: string
  name: string
  description: string | null
  owner_id: string
  subscription_plan: string
  created_at: string
  updated_at: string
}

export default function AdminOrganizations() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalMembers: 0,
  })

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== "admin") {
      router.push("/")
      toast.error("You don't have access to this page")
      return
    }

    const fetchData = async () => {
      try {
        // Fetch organizations
        const { data: orgs, error: orgsError } = await supabase
          .from("organizations")
          .select("*")
          .order("created_at", { ascending: false })

        if (orgsError) throw orgsError

        // Fetch projects count
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("organization_id")

        if (projectsError) throw projectsError

        // Fetch team members count
        const { data: members, error: membersError } = await supabase
          .from("team_members")
          .select("organization_id")

        if (membersError) throw membersError

        // Calculate stats
        const projectCounts = projects.reduce((acc: { [key: string]: number }, project) => {
          if (project.organization_id) {
            acc[project.organization_id] = (acc[project.organization_id] || 0) + 1
          }
          return acc
        }, {})

        const memberCounts = members.reduce((acc: { [key: string]: number }, member) => {
          if (member.organization_id) {
            acc[member.organization_id] = (acc[member.organization_id] || 0) + 1
          }
          return acc
        }, {})

        setOrganizations(orgs || [])
        setStats({
          totalProjects: projects.length,
          totalMembers: members.length,
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load organizations")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="w-8 h-8 text-purple-400" />
              Organization Management
            </h1>
            <p className="text-gray-400 mt-2">
              Create and manage enterprise organizations
            </p>
          </div>
          <Link href="/admin/organizations/create">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Organizations</p>
                  <h3 className="text-2xl font-bold mt-1">{organizations.length}</h3>
                </div>
                <Building2 className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Projects</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalProjects}</h3>
                </div>
                <Briefcase className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Members</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalMembers}</h3>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Organizations</p>
                  <h3 className="text-2xl font-bold mt-1">{organizations.length}</h3>
                </div>
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              Manage all enterprise organizations and their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.subscription_plan}</TableCell>
                    <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
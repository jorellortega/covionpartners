"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  Settings,
  BarChart2,
  Calendar,
  Shield,
  Globe,
} from "lucide-react"

// Mock data for organizations
const mockOrganizations = [
  {
    id: "org1",
    name: "Tech Innovators Corp",
    type: "Enterprise",
    projects: 12,
    members: 45,
    status: "Active",
    created: "2024-01-15",
    subscription: "Enterprise",
  },
  {
    id: "org2",
    name: "Global Solutions Ltd",
    type: "Enterprise",
    projects: 8,
    members: 30,
    status: "Active",
    created: "2024-02-01",
    subscription: "Enterprise",
  },
  {
    id: "org3",
    name: "Future Ventures Inc",
    type: "Enterprise",
    projects: 15,
    members: 60,
    status: "Active",
    created: "2024-01-20",
    subscription: "Enterprise",
  },
]

export default function AdminOrganizations() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState(mockOrganizations)
  const [newOrg, setNewOrg] = useState({
    name: "",
    type: "Enterprise",
    subscription: "Enterprise",
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== "admin") {
      router.push("/")
      toast.error("You don't have access to this page")
      return
    }
    setLoading(false)
  }, [user, router])

  const handleCreateOrganization = async () => {
    try {
      // Mock API call
      const newOrgData = {
        id: `org${organizations.length + 1}`,
        ...newOrg,
        projects: 0,
        members: 1,
        status: "Active",
        created: new Date().toISOString().split("T")[0],
      }

      setOrganizations([...organizations, newOrgData])
      setIsCreateDialogOpen(false)
      setNewOrg({ name: "", type: "Enterprise", subscription: "Enterprise" })
      toast.success("Organization created successfully")
    } catch (error) {
      toast.error("Failed to create organization")
    }
  }

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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Create a new enterprise organization with full access to the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={newOrg.name}
                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                    placeholder="Enter organization name"
                    className="mt-1"
                  />
                </div>
                <div className="pt-4">
                  <Button
                    onClick={handleCreateOrganization}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!newOrg.name}
                  >
                    Create Organization
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                  <h3 className="text-2xl font-bold mt-1">
                    {organizations.reduce((acc, org) => acc + org.projects, 0)}
                  </h3>
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
                  <h3 className="text-2xl font-bold mt-1">
                    {organizations.reduce((acc, org) => acc + org.members, 0)}
                  </h3>
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
                  <h3 className="text-2xl font-bold mt-1">
                    {organizations.filter((org) => org.status === "Active").length}
                  </h3>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-gray-400">
                            {org.subscription}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{org.type}</TableCell>
                    <TableCell>{org.projects}</TableCell>
                    <TableCell>{org.members}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                        {org.status}
                      </span>
                    </TableCell>
                    <TableCell>{org.created}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/organizations/${org.id}`)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/organizations/${org.id}/projects`)}
                        >
                          <Briefcase className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/organizations/${org.id}/members`)}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
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
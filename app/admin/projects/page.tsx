"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Home, Search, PlusCircle, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react"

// Project status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "on hold":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
  )
}

export default function AdminProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  // Mock projects data
  const [projects, setProjects] = useState([
    {
      id: "proj-001",
      name: "AI Integration Platform",
      description: "Enterprise AI integration solution for financial services",
      status: "active",
      progress: 65,
      deadline: "2025-06-15",
      budget: 7500000,
      client: "FinTech Solutions Inc.",
    },
    {
      id: "proj-002",
      name: "Mobile App Development",
      description: "Cross-platform mobile application for healthcare providers",
      status: "active",
      progress: 40,
      deadline: "2025-05-30",
      budget: 4500000,
      client: "MediCare Systems",
    },
    {
      id: "proj-003",
      name: "E-commerce Platform Redesign",
      description: "Complete UX/UI overhaul and performance optimization",
      status: "pending",
      progress: 10,
      deadline: "2025-08-01",
      budget: 3500000,
      client: "Global Retail Group",
    },
    {
      id: "proj-004",
      name: "Data Analytics Dashboard",
      description: "Real-time analytics dashboard with predictive capabilities",
      status: "completed",
      progress: 100,
      deadline: "2025-02-28",
      budget: 2800000,
      client: "DataViz Corp",
    },
    {
      id: "proj-005",
      name: "Blockchain Integration",
      description: "Implementing blockchain solutions for supply chain tracking",
      status: "on hold",
      progress: 25,
      deadline: "2025-09-15",
      budget: 6000000,
      client: "LogiChain Industries",
    },
  ])

  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle project deletion
  const handleDeleteProject = () => {
    if (projectToDelete) {
      setProjects(projects.filter((project) => project.id !== projectToDelete))
      setProjectToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      // Filter by search query
      if (
        searchQuery &&
        !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Filter by status
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      // Sort by selected field
      const fieldA = a[sortField as keyof typeof a]
      const fieldB = b[sortField as keyof typeof b]

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortDirection === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA)
      }

      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA
      }

      return 0
    })

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/admin"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Project Management</h1>
          </div>
          <Link href="/admin/projects/new">
            <Button className="gradient-button">
              <PlusCircle className="w-5 h-5 mr-2" />
              Create New Project
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="leonardo-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="leonardo-input w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Table */}
        <div className="rounded-md border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-900">
              <TableRow className="hover:bg-gray-900/50 border-gray-800">
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  <div className="flex items-center">
                    Project Name
                    {sortField === "name" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("deadline")}>
                  <div className="flex items-center">
                    Deadline
                    {sortField === "deadline" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("budget")}>
                  <div className="flex items-center">
                    Budget
                    {sortField === "budget" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    No projects found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-gray-800/50 border-gray-800">
                    <TableCell className="font-medium">
                      <div>
                        <div>{project.name}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">{project.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(project.deadline).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">${project.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/projects/${project.id}`}>
                          <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800/30 text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/projects/edit/${project.id}`}>
                          <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800/30 text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-800/30 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => {
                            setProjectToDelete(project.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete this project? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteProject}>
                Delete Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


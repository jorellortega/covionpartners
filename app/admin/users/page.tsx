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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Search, UserPlus, MoreHorizontal, ArrowUpDown, Shield, Ban, TagIcon as Label } from "lucide-react"

// User role badge component
function RoleBadge({ role }: { role: string }) {
  const getRoleStyles = () => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "partner":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "investor":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "viewer":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getRoleStyles()} border`} variant="outline">
      {role}
    </Badge>
  )
}

// User status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "inactive":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
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

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [userToBan, setUserToBan] = useState<string | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [userToChangeRole, setUserToChangeRole] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")

  // Mock users data
  const [users, setUsers] = useState([
    {
      id: "user-001",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Partner",
      status: "Active",
      joinDate: "2024-01-15",
      lastLogin: "2025-03-28",
    },
    {
      id: "user-002",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "Investor",
      status: "Active",
      joinDate: "2024-02-10",
      lastLogin: "2025-03-27",
    },
    {
      id: "user-003",
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      role: "Admin",
      status: "Active",
      joinDate: "2023-11-05",
      lastLogin: "2025-03-29",
    },
    {
      id: "user-004",
      name: "Emily Davis",
      email: "emily.davis@example.com",
      role: "Partner",
      status: "Inactive",
      joinDate: "2024-01-20",
      lastLogin: "2025-02-15",
    },
    {
      id: "user-005",
      name: "Michael Brown",
      email: "michael.brown@example.com",
      role: "Viewer",
      status: "Pending",
      joinDate: "2024-03-01",
      lastLogin: "2025-03-25",
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

  // Handle user ban/suspension
  const handleBanUser = () => {
    if (userToBan) {
      setUsers(
        users.map((user) =>
          user.id === userToBan ? { ...user, status: user.status === "Active" ? "Inactive" : "Active" } : user,
        ),
      )
      setUserToBan(null)
      setIsBanDialogOpen(false)
    }
  }

  const handleRoleChange = () => {
    if (userToChangeRole && selectedRole) {
      setUsers(
        users.map((user) =>
          user.id === userToChangeRole ? { ...user, role: selectedRole, status: selectedStatus } : user,
        ),
      )
      setUserToChangeRole(null)
      setIsRoleDialogOpen(false)
    }
  }

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      // Filter by search query
      if (
        searchQuery &&
        !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Filter by role
      if (roleFilter !== "all" && user.role.toLowerCase() !== roleFilter.toLowerCase()) {
        return false
      }

      // Filter by status
      if (statusFilter !== "all" && user.status.toLowerCase() !== statusFilter.toLowerCase()) {
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
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <Link href="/admin/users/new">
            <Button className="gradient-button">
              <UserPlus className="w-5 h-5 mr-2" />
              Add New User
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
              placeholder="Search users..."
              className="leonardo-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="leonardo-input w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="leonardo-input w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-900">
              <TableRow className="hover:bg-gray-900/50 border-gray-800">
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  <div className="flex items-center">
                    Name
                    {sortField === "name" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("email")}>
                  <div className="flex items-center">
                    Email
                    {sortField === "email" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("lastLogin")}>
                  <div className="flex items-center">
                    Last Login
                    {sortField === "lastLogin" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    No users found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-800/50 border-gray-800">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-gray-700" />
                          <DropdownMenuItem
                            className="text-white hover:bg-gray-800 cursor-pointer"
                            onClick={() => (window.location.href = `/admin/users/${user.id}`)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-white hover:bg-gray-800 cursor-pointer"
                            onClick={() => (window.location.href = `/admin/users/edit/${user.id}`)}
                          >
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-white hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                              setUserToChangeRole(user.id)
                              setSelectedRole(user.role)
                              setSelectedStatus(user.status)
                              setIsRoleDialogOpen(true)
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role/Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-700" />
                          <DropdownMenuItem
                            className={`${
                              user.status === "Active" ? "text-red-400" : "text-green-400"
                            } hover:bg-gray-800`}
                            onClick={() => {
                              setUserToBan(user.id)
                              setIsBanDialogOpen(true)
                            }}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            {user.status === "Active" ? "Suspend User" : "Activate User"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Ban/Suspend User Dialog */}
        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>
                {users.find((u) => u.id === userToBan)?.status === "Active"
                  ? "Suspend User Account"
                  : "Activate User Account"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {users.find((u) => u.id === userToBan)?.status === "Active"
                  ? "Are you sure you want to suspend this user? They will no longer be able to access the platform."
                  : "Are you sure you want to reactivate this user? They will regain access to the platform."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => setIsBanDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={users.find((u) => u.id === userToBan)?.status === "Active" ? "destructive" : "default"}
                onClick={handleBanUser}
              >
                {users.find((u) => u.id === userToBan)?.status === "Active" ? "Suspend User" : "Activate User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Role Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>Change User Role & Status</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update role and status for {users.find((u) => u.id === userToChangeRole)?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Partner">Partner</SelectItem>
                      <SelectItem value="Investor">Investor</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Account Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-400">
                    Active: Full access. Inactive: No access. Pending: Awaiting approval.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => setIsRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRoleChange} className="gradient-button">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


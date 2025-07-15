"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface ProjectOpenRole {
  id: string
  project_id: string
  role_name: string
  description: string
  positions_needed: number
  status: string
  created_at: string
  updated_at: string
}

interface ProjectRoleApplication {
  id: string
  user_id: string
  role_id: string
  role_name: string
  cover_letter: string
  experience: string
  social_links?: string
  portfolio_url?: string
  status: string
  created_at: string
  users?: {
    id: string
    name?: string
    email?: string
    avatar_url?: string
  }
}

export default function ProjectRolesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string
  const [roles, setRoles] = useState<ProjectOpenRole[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<ProjectOpenRole | null>(null)
  const [form, setForm] = useState({
    role_name: "",
    description: "",
    positions_needed: 1,
    status: "open",
    price: "",
    price_type: "hourly"
  })
  const [tab, setTab] = useState("roles")
  const [applications, setApplications] = useState<ProjectRoleApplication[]>([])

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true)
      const { data, error } = await supabase
        .from("project_open_roles")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
      if (error) {
        toast.error("Failed to load roles")
      } else {
        setRoles(data || [])
      }
      setLoading(false)
    }
    async function checkOwner() {
      const { data, error } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single()
      if (data && user && data.owner_id === user.id) setIsOwner(true)
    }
    if (projectId) {
      fetchRoles()
      checkOwner()
    }
  }, [projectId, user])

  useEffect(() => {
    async function fetchApplications() {
      if (!isOwner) return
      
      // First get the applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("project_role_applications")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
      
      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError)
        return
      }
      
      if (!applicationsData || applicationsData.length === 0) {
        setApplications([])
        return
      }
      
      // Get unique user IDs
      const userIds = [...new Set(applicationsData.map(app => app.user_id))]
      
      // Fetch user data from the users table
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, avatar_url")
        .in("id", userIds)
      
      if (usersError) {
        console.error("Error fetching users:", usersError)
        // Still set applications without user data
        setApplications(applicationsData)
        return
      }
      
      // Create a map of user data for easy lookup
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || [])
      
      // Combine applications with user data
      const applicationsWithUsers = applicationsData.map(app => ({
        ...app,
        users: usersMap.get(app.user_id) || null
      }))
      
      setApplications(applicationsWithUsers)
    }
    if (projectId && isOwner) {
      fetchApplications()
    }
  }, [projectId, isOwner])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === "positions_needed" ? Number(value) : value }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.role_name) {
      toast.error("Role name is required")
      return
    }
    if (editingRole) {
      // Update
      const { error } = await supabase
        .from("project_open_roles")
        .update({
          role_name: form.role_name,
          description: form.description,
          positions_needed: form.positions_needed,
          status: form.status,
          price: form.price,
          price_type: form.price_type,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingRole.id)
      if (error) {
        toast.error("Failed to update role")
      } else {
        toast.success("Role updated")
        setEditingRole(null)
        setShowForm(false)
        setForm({ role_name: "", description: "", positions_needed: 1, status: "open", price: "", price_type: "hourly" })
        refreshRoles()
      }
    } else {
      // Create
      const { error } = await supabase
        .from("project_open_roles")
        .insert({
          project_id: projectId,
          role_name: form.role_name,
          description: form.description,
          positions_needed: form.positions_needed,
          status: form.status,
          price: form.price,
          price_type: form.price_type
        })
      if (error) {
        toast.error("Failed to create role")
      } else {
        toast.success("Role created")
        setShowForm(false)
        setForm({ role_name: "", description: "", positions_needed: 1, status: "open", price: "", price_type: "hourly" })
        refreshRoles()
      }
    }
  }

  const refreshRoles = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("project_open_roles")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
    if (!error) setRoles(data || [])
    setLoading(false)
  }

  const handleEdit = (role: ProjectOpenRole) => {
    setEditingRole(role)
    setForm({
      role_name: role.role_name,
      description: role.description,
      positions_needed: role.positions_needed,
      status: role.status,
      price: (role as any).price || "",
      price_type: (role as any).price_type || "hourly"
    })
    setShowForm(true)
  }

  const handleDelete = async (role: ProjectOpenRole) => {
    if (!window.confirm("Delete this role?")) return
    const { error } = await supabase
      .from("project_open_roles")
      .delete()
      .eq("id", role.id)
    if (error) {
      toast.error("Failed to delete role")
    } else {
      toast.success("Role deleted")
      refreshRoles()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
          {isOwner && (
            <Button className="ml-auto" onClick={() => { setShowForm(true); setEditingRole(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Role
            </Button>
          )}
        </div>
        <Tabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="roles">Open Roles</TabsTrigger>
            {isOwner && <TabsTrigger value="applications">Applications</TabsTrigger>}
          </TabsList>
          <TabsContent value="roles">
            <Card className="leonardo-card border-gray-800 mb-6">
              <CardHeader>
                <CardTitle>Open Roles</CardTitle>
                <CardDescription>Manage open positions for this project</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No open roles yet</div>
                ) : (
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <Card key={role.id} className="bg-gray-800/30 border-gray-700">
                        <CardContent className="pt-4 pb-2">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{role.role_name}</span>
                                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                  {role.status}
                                </Badge>
                              </div>
                              <div className="text-gray-400 text-sm mt-1">{role.description}</div>
                              <div className="text-xs text-gray-500 mt-1">Positions needed: {role.positions_needed}</div>
                                                             {(role as any).price && (
                                 <div className="text-xs text-green-400 mt-1">
                                   Compensation: ${(role as any).price} {(role as any).price_type === 'hourly' ? '/hr' : (role as any).price_type === 'daily' ? '/day' : (role as any).price_type === 'weekly' ? '/week' : (role as any).price_type === 'monthly' ? '/month' : (role as any).price_type === 'yearly' ? '/year' : ''}
                                   {(role as any).price_type === 'fixed' && <span className="text-gray-500 ml-2">(fixed)</span>}
                                 </div>
                               )}
                            </div>
                            {isOwner && (
                              <div className="flex gap-2">
                                <Button size="icon" variant="outline" onClick={() => handleEdit(role)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDelete(role)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {showForm && isOwner && (
              <Card className="leonardo-card border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle>{editingRole ? "Edit Role" : "New Role"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Role Name</Label>
                      <Input name="role_name" value={form.role_name} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea name="description" value={form.description} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Positions Needed</Label>
                      <Input name="positions_needed" type="number" min={1} value={form.positions_needed} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <select name="status" value={form.status} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                                         <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label>Compensation Amount</Label>
                         <Input name="price" type="number" min={0} step="0.01" value={form.price} onChange={handleInputChange} placeholder="0.00" />
                       </div>
                       <div>
                         <Label>Payment Type</Label>
                         <select name="price_type" value={form.price_type} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
                           <option value="hourly">Per Hour</option>
                           <option value="daily">Per Day</option>
                           <option value="weekly">Per Week</option>
                           <option value="monthly">Per Month</option>
                           <option value="yearly">Per Year</option>
                           <option value="fixed">Fixed Payment</option>
                         </select>
                       </div>
                     </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRole(null); }}>Cancel</Button>
                      <Button type="submit">{editingRole ? "Update" : "Create"} Role</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          {isOwner && (
            <TabsContent value="applications">
              <Card className="leonardo-card border-gray-800 mb-6">
                <CardHeader>
                  <CardTitle>Applications</CardTitle>
                  <CardDescription>View all applications for open roles in this project</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No applications yet</div>
                  ) : (
                    <div className="space-y-8">
                      {roles.map((role) => {
                        const roleApps = applications.filter(app => app.role_id === role.id)
                        if (roleApps.length === 0) return null
                        return (
                          <div key={role.id}>
                            <div className="font-semibold text-lg text-white mb-2">{role.role_name}</div>
                            <div className="space-y-4">
                              {roleApps.map(app => (
                                <Card key={app.id} className="bg-gray-800/30 border-gray-700">
                                  <CardContent className="pt-4 pb-2">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-white">{app.users?.name || app.user_id}</span>
                                          <span className="text-xs text-gray-400">{app.users?.email}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">Applied: {new Date(app.created_at).toLocaleString()}</div>
                                        <div className="text-gray-400 text-sm mt-2"><span className="font-semibold">Cover Letter:</span> {app.cover_letter}</div>
                                        <div className="text-gray-400 text-sm mt-2"><span className="font-semibold">Experience:</span> {app.experience}</div>
                                        {app.social_links && <div className="text-gray-400 text-sm mt-2"><span className="font-semibold">Social Links:</span> {app.social_links}</div>}
                                        {app.portfolio_url && <div className="text-gray-400 text-sm mt-2"><span className="font-semibold">Portfolio:</span> <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{app.portfolio_url}</a></div>}
                                      </div>
                                      <div className="flex flex-col gap-2 min-w-[120px]">
                                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                          {app.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
} 
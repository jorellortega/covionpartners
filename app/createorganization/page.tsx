"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { Building2, CalendarDays, Pencil, Trash2, X, Save, User, Briefcase, Check } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Organization {
  id: string
  name: string
  description: string
  created_at: string
  subscription_plan: string
  owner_id: string
  owner_name: string
}

interface Project {
  id: string
  name: string
  description: string
  organization_id: string | null
}

export default function CreateOrganization() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Organization | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [organizationToDelete, setOrganizationToDelete] = useState<string | null>(null)

  // Fetch organizations owned by the current user
  const fetchOrganizations = async () => {
    try {
      if (!user) return

      // Get organizations owned by the current user
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (orgsError) throw orgsError

      // Add owner name (which will be the current user)
      const orgsWithOwners = (orgs || []).map((org) => ({
        ...org,
        owner_name: user.name || user.email || "You"
      }))

      setOrganizations(orgsWithOwners)
    } catch (error) {
      console.error("Error fetching organizations:", error)
      toast.error("Failed to load organizations")
    }
  }

  const fetchProjects = async () => {
    try {
      if (!user) return

      // First get projects where user is the owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", user.id)
        .order("name")
      
      if (ownedError) throw ownedError

      // Then get projects where user is a team member
      const { data: teamMemberships, error: teamError } = await supabase
        .from("team_members")
        .select("project_id")
        .eq("user_id", user.id)
      
      if (teamError) throw teamError
      
      let memberProjects: any[] = []
      
      if (teamMemberships && teamMemberships.length > 0) {
        const projectIds = teamMemberships.map(tm => tm.project_id)
        
        const { data: joinedProjects, error: joinedError } = await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds)
          .order("name")
        
        if (joinedError) throw joinedError
        memberProjects = joinedProjects || []
      }
      
      // Combine owned and member projects, removing duplicates
      const allProjects = [...(ownedProjects || []), ...memberProjects]
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      )
      
      setProjects(uniqueProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setLoadingProjects(false)
    }
  }

  // Check if user is authenticated and load organizations
  useEffect(() => {
    if (!user) {
      setLoading(true)
      return
    }

    // Allow any authenticated user to create organizations
    fetchOrganizations()
    fetchProjects()
    setLoading(false)
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!user) {
        toast.error("Please log in to continue")
        return
      }

      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: formData.name,
          description: formData.description,
          owner_id: user.id,
          subscription_plan: "enterprise"
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Organization created successfully!")
      setFormData({ name: "", description: "" })
      fetchOrganizations()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to create organization")
    }
  }

  const handleEdit = (org: Organization) => {
    setEditingId(org.id)
    setEditFormData(org)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData(null)
  }

  const handleSaveEdit = async (orgId: string) => {
    try {
      if (!editFormData) return

      const { error } = await supabase
        .from("organizations")
        .update({
          name: editFormData.name,
          description: editFormData.description,
        })
        .eq("id", orgId)

      if (error) throw error

      toast.success("Organization updated successfully!")
      setEditingId(null)
      setEditFormData(null)
      fetchOrganizations()
    } catch (error) {
      console.error("Error updating organization:", error)
      toast.error("Failed to update organization")
    }
  }

  const handleDelete = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId)

      if (error) throw error

      toast.success("Organization deleted successfully!")
      setDeleteConfirmOpen(false)
      setOrganizationToDelete(null)
      fetchOrganizations()
    } catch (error) {
      console.error("Error deleting organization:", error)
      toast.error("Failed to delete organization")
    }
  }

  const handleAssociateProject = async (projectId: string, organizationId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ organization_id: organizationId })
        .eq("id", projectId)

      if (error) throw error

      toast.success("Project associated successfully!")
      fetchProjects()
    } catch (error) {
      console.error("Error associating project:", error)
      toast.error("Failed to associate project")
    }
  }

  const handleRemoveAssociation = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ organization_id: null })
        .eq("id", projectId)

      if (error) throw error

      toast.success("Project association removed successfully!")
      fetchProjects()
    } catch (error) {
      console.error("Error removing project association:", error)
      toast.error("Failed to remove project association")
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Create Organization Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>
              Create a new enterprise organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Organization Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter organization name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter organization description"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create Organization
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Organizations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>
              List of all organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No organizations created yet
                </p>
              ) : (
                organizations.map((org) => (
                  <div
                    key={org.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                  >
                    {editingId === org.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <Input
                          value={editFormData?.name || ""}
                          onChange={(e) => setEditFormData(prev => ({ ...prev!, name: e.target.value }))}
                          placeholder="Organization name"
                        />
                        <Textarea
                          value={editFormData?.description || ""}
                          onChange={(e) => setEditFormData(prev => ({ ...prev!, description: e.target.value }))}
                          placeholder="Organization description"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleSaveEdit(org.id)}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{org.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {org.description || "No description"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full">
                              {org.subscription_plan}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(org)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
              <Button 
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => {
                                setOrganizationToDelete(org.id)
                                setDeleteConfirmOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Owner: {org.owner_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              Created {new Date(org.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Associations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Project Associations
            </CardTitle>
            <CardDescription>
              Associate existing projects with your organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loadingProjects ? (
                <div className="text-center py-4">
                  <LoadingSpinner />
                </div>
              ) : projects.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No projects available
                </p>
              ) : (
                <>
                  {/* Select All Section */}
                  <div className="border rounded-lg p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">Bulk Associate Projects</h3>
                        <p className="text-sm text-muted-foreground">
                          Associate multiple unassociated projects with an organization
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value=""
                          onValueChange={(value) => {
                            if (value) {
                              const unassociatedProjects = projects.filter(p => !p.organization_id)
                              if (unassociatedProjects.length > 0) {
                                // Associate all unassociated projects
                                unassociatedProjects.forEach(project => {
                                  handleAssociateProject(project.id, value)
                                })
                                toast.success(`Associated ${unassociatedProjects.length} projects with ${organizations.find(org => org.id === value)?.name}`)
                              } else {
                                toast.info("No unassociated projects to associate")
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.length === 0 ? (
                              <SelectItem value="" disabled>
                                No organizations available
                              </SelectItem>
                            ) : (
                              organizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const associatedProjects = projects.filter(p => p.organization_id)
                            if (associatedProjects.length > 0) {
                              // Remove all associations
                              associatedProjects.forEach(project => {
                                handleRemoveAssociation(project.id)
                              })
                              toast.success(`Removed associations from ${associatedProjects.length} projects`)
                            } else {
                              toast.info("No associated projects to remove")
                            }
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove All
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {projects.filter(p => !p.organization_id).length} unassociated projects • {projects.filter(p => p.organization_id).length} associated projects
                    </div>
                  </div>

                  {/* Individual Projects */}
                  <div className="space-y-4">
                    {projects.map((project) => (
                    <div
                      key={project.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.description || "No description"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.organization_id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                                Associated
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-600 border-red-500/20"
                                onClick={() => handleRemoveAssociation(project.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium bg-gray-500/10 text-gray-500 px-2 py-1 rounded-full">
                                Unassociated
                              </span>
                              <Select
                                value=""
                                onValueChange={(value) => {
                                  if (value) {
                                    handleAssociateProject(project.id, value)
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizations.length === 0 ? (
                                    <SelectItem value="" disabled>
                                      No organizations available
                                    </SelectItem>
                                  ) : (
                                    organizations.map((org) => (
                                      <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Show current association if exists */}
                      {project.organization_id && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>
                            Associated with: {organizations.find(org => org.id === project.organization_id)?.name || 'Unknown Organization'}
                          </span>
                        </div>
                      )}
                    </div>
                                      ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              organization and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrganizationToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => organizationToDelete && handleDelete(organizationToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 
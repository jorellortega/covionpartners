"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Search, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const DEAL_TYPES = ["investment", "partnership", "collaboration", "acquisition", "custom"]
const CONFIDENTIALITY_LEVELS = ["public", "private", "confidential"]
const STATUS_OPTIONS = ["pending", "accepted", "rejected", "completed", "negotiation"]

export default function EditDealPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const dealId = Array.isArray(params.id) ? params.id[0] : params.id
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchingUser, setSearchingUser] = useState(false)
  const [foundUser, setFoundUser] = useState<any>(null)
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [existingParticipants, setExistingParticipants] = useState<any[]>([])

  useEffect(() => {
    async function fetchDeal() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase.from("deals").select("*", { count: "exact" }).eq("id", dealId).single()
        if (error) throw error
        setDeal(data)
        
        // Fetch existing participants
        const { data: participants, error: participantsError } = await supabase
          .from('deal_participants')
          .select(`
            id,
            status,
            role,
            user:users(
              id,
              name,
              email,
              avatar_url
            )
          `)
          .eq('deal_id', dealId)
        
        if (participantsError) {
          console.error('Error fetching participants:', participantsError)
        } else {
          setExistingParticipants(participants || [])
          setSelectedUsers(participants?.map((p: any) => p.user) || [])
        }
      } catch (err: any) {
        setError(err.message || "Failed to load deal.")
      } finally {
        setLoading(false)
      }
    }
    if (dealId) fetchDeal()
  }, [dealId])

  const handleChange = (field: string, value: any) => {
    setDeal((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      })
      return
    }

    setSearchingUser(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('email', userSearchQuery.trim())
        .single()

      if (error) throw error

      if (data) {
        setFoundUser(data)
        toast({
          title: "Success",
          description: `Found user: ${data.name}`,
        })
      }
    } catch (error: any) {
      console.error('Error searching user:', error)
      setFoundUser(null)
      toast({
        title: "Error",
        description: "User not found with this email address",
        variant: "destructive"
      })
    } finally {
      setSearchingUser(false)
    }
  }

  const handleAddUser = () => {
    if (!foundUser) {
      toast({
        title: "Error",
        description: "Please search for a user first",
        variant: "destructive"
      })
      return
    }

    // Check if user is already selected
    if (selectedUsers.some(user => user.id === foundUser.id)) {
      toast({
        title: "Error",
        description: "User is already added",
        variant: "destructive"
      })
      return
    }

    setSelectedUsers(prev => [...prev, foundUser])
    setFoundUser(null)
    setUserSearchQuery("")
    toast({
      title: "Success",
      description: `Added ${foundUser.name} to the deal`,
    })
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from("deals").update({
        title: deal.title,
        description: deal.description,
        deal_type: deal.deal_type,
        custom_type: deal.deal_type === "custom" ? deal.custom_type : null,
        confidentiality_level: deal.confidentiality_level,
        status: deal.status
      }).eq("id", dealId)
      if (error) throw error

      // Handle participants
      const existingUserIds = existingParticipants.map((p: any) => p.user.id)
      const selectedUserIds = selectedUsers.map(user => user.id)
      
      // Remove participants that are no longer selected
      const usersToRemove = existingUserIds.filter(id => !selectedUserIds.includes(id))
      if (usersToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('deal_participants')
          .delete()
          .eq('deal_id', dealId)
          .in('user_id', usersToRemove)
        
        if (removeError) {
          console.error('Error removing participants:', removeError)
        }
      }
      
      // Add new participants
      const newUserIds = selectedUserIds.filter(id => !existingUserIds.includes(id))
      if (newUserIds.length > 0) {
        const newParticipants = newUserIds.map(userId => ({
          deal_id: dealId,
          user_id: userId,
          status: 'pending',
          role: 'participant'
        }))

        const { error: addError } = await supabase
          .from('deal_participants')
          .insert(newParticipants)

        if (addError) {
          console.error('Error adding participants:', addError)
        }
      }

      setSuccess(true)
      setTimeout(() => router.push("/deals"), 1000)
    } catch (err: any) {
      setError(err.message || "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>
  if (!deal) return <div className="min-h-screen flex items-center justify-center text-white">Deal not found</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle>Edit Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block mb-1">Title</label>
                <Input value={deal.title || ""} onChange={e => handleChange("title", e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <Textarea value={deal.description || ""} onChange={e => handleChange("description", e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1">Deal Type</label>
                <Select value={deal.deal_type} onValueChange={v => handleChange("deal_type", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {deal.deal_type === "custom" && (
                <div>
                  <label className="block mb-1">Custom Type</label>
                  <Input value={deal.custom_type || ""} onChange={e => handleChange("custom_type", e.target.value)} required />
                </div>
              )}
              <div>
                <label className="block mb-1">Confidentiality Level</label>
                <Select value={deal.confidentiality_level} onValueChange={v => handleChange("confidentiality_level", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select confidentiality" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIDENTIALITY_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1">Status</label>
                <Select value={deal.status} onValueChange={v => handleChange("status", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Manage Users</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter user email to search"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleUserSearch}
                    disabled={searchingUser || !userSearchQuery.trim()}
                  >
                    {searchingUser ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    {searchingUser ? 'Searching...' : 'Find User'}
                  </Button>
                </div>
                
                {foundUser && (
                  <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        {foundUser.avatar_url ? (
                          <img src={foundUser.avatar_url} alt={foundUser.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium">{foundUser.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{foundUser.name}</h3>
                        <p className="text-sm text-gray-400">{foundUser.email}</p>
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddUser}
                        >
                          Add User
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFoundUser(null)
                            setUserSearchQuery("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-400 mb-2">Current Users ({selectedUsers.length})</Label>
                    <div className="space-y-2">
                      {selectedUsers.map((user) => (
                        <div key={user.id} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <span className="text-xs font-medium">{user.name?.charAt(0)?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{user.name}</h3>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full mt-4" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              {success && <div className="text-green-400 mt-2">Deal updated!</div>}
              {error && <div className="text-red-400 mt-2">{error}</div>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
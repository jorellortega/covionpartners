"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Globe,
  Lock,
  Shield,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Save
} from "lucide-react"

interface Deal {
  id: string
  title: string
  description: string
  deal_type: string
  custom_type?: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  confidentiality_level: 'public' | 'private' | 'confidential'
  created_at: string
  initiator_id: string
  participants: {
    id: string
    user_id: string
    status: 'pending' | 'accepted' | 'rejected'
    role: string
    user: {
      name: string
      avatar_url: string
    }
  }[]
}

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDeal, setEditedDeal] = useState<Partial<Deal>>({})

  useEffect(() => {
    if (!user) return
    fetchDeal()
  }, [user, resolvedParams.id])

  const fetchDeal = async () => {
    try {
      if (!user) return

      let query = supabase
        .from('deals')
        .select(`
          *,
          participants:deal_participants(
            id,
            user_id,
            status,
            role,
            user:users(
              name,
              avatar_url
            )
          )
        `)
        .eq('id', resolvedParams.id)

      // Add access control
      if (user.role !== 'admin' && user.role !== 'partner') {
        query = query.or(`initiator_id.eq.${user.id},id.in.(select deal_id from deal_participants where user_id='${user.id}')`)
      }

      const { data, error } = await query.single()

      if (error) throw error
      if (!data) {
        setDeal(null)
        return
      }
      setDeal(data)
      setEditedDeal(data)
    } catch (error) {
      console.error('Error fetching deal:', error)
      toast({
        title: "Error",
        description: "Failed to fetch deal details",
        variant: "destructive"
      })
      setDeal(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          title: editedDeal.title,
          description: editedDeal.description,
          deal_type: editedDeal.deal_type,
          custom_type: editedDeal.custom_type,
          status: editedDeal.status,
          confidentiality_level: editedDeal.confidentiality_level
        })
        .eq('id', resolvedParams.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Deal updated successfully"
      })
      
      setIsEditing(false)
      fetchDeal() // Refresh deal data
    } catch (error) {
      console.error('Error updating deal:', error)
      toast({
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
          <p className="text-lg text-gray-300 mb-6">You need to be signed in to view this page.</p>
          <Button onClick={() => router.push('/login')} className="gradient-button">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading deal details...</p>
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Deal Not Found</h2>
          <p className="text-lg text-gray-300 mb-6">The deal you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/deals')} className="gradient-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>
        </div>
      </div>
    )
  }

  const canEdit = user.role !== 'viewer' && (user.id === deal.initiator_id || user.role === 'admin')

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            className="border-gray-700"
            onClick={() => router.push('/deals')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>
          {canEdit && !isEditing && (
            <Button
              className="gradient-button"
              onClick={() => setIsEditing(true)}
            >
              Edit Deal
            </Button>
          )}
        </div>

        <Card className="leonardo-card border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editedDeal.title}
                    onChange={(e) => setEditedDeal({ ...editedDeal, title: e.target.value })}
                    className="max-w-md"
                  />
                </div>
              ) : (
                <CardTitle className="text-2xl">{deal.title}</CardTitle>
              )}
              <div className="flex gap-2">
                <Badge variant="secondary">{deal.deal_type}</Badge>
                <Badge variant="outline">{deal.status}</Badge>
                <Badge>{deal.confidentiality_level}</Badge>
              </div>
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-gray-700"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedDeal(deal)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="gradient-button"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={editedDeal.description}
                    onChange={(e) => setEditedDeal({ ...editedDeal, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-gray-400">{deal.description}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Deal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      Created on {new Date(deal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      {deal.participants.length} Participants
                    </span>
                  </div>
                </div>
              </div>

              {deal.participants.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Participants</h3>
                  <div className="space-y-2">
                    {deal.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{participant.user.name}</p>
                            <p className="text-sm text-gray-400">{participant.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {participant.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
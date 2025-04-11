"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Globe, 
  Shield, 
  Handshake,
  Calendar,
  DollarSign,
  Users
} from "lucide-react"

interface Deal {
  id: string
  title: string
  description: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  deal_type: string
  confidentiality_level: 'public' | 'private' | 'confidential'
  created_at: string
  deadline?: string
  budget?: number
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

export default function DealsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("private")

  useEffect(() => {
    if (!user) return

    const fetchDeals = async () => {
      try {
        const { data, error } = await supabase
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
          .order('created_at', { ascending: false })

        if (error) throw error
        setDeals(data || [])
      } catch (error) {
        console.error('Error fetching deals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [user])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getConfidentialityIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="w-4 h-4 text-blue-500" />
      case 'private':
        return <Lock className="w-4 h-4 text-gray-500" />
      case 'confidential':
        return <Shield className="w-4 h-4 text-purple-500" />
      default:
        return null
    }
  }

  const filteredDeals = deals.filter(deal => deal.confidentiality_level === activeTab)

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Deals</h1>
            {user?.role !== 'viewer' && (
              <Button 
                className="gradient-button"
                onClick={() => router.push('/makedeal')}
              >
                <Handshake className="w-4 h-4 mr-2" />
                Create New Deal
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="private" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Private Deals
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Public Deals
              </TabsTrigger>
              <TabsTrigger value="confidential" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Confidential Deals
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading deals...</p>
                </div>
              ) : filteredDeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No {activeTab} deals found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDeals.map((deal) => (
                    <Card 
                      key={deal.id} 
                      className="leonardo-card border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{deal.title}</CardTitle>
                            <CardDescription className="text-gray-400 line-clamp-2">
                              {deal.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deal.status)}
                            {getConfidentialityIcon(deal.confidentiality_level)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(deal.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {deal.deadline && (
                              <div className="flex items-center gap-2 text-gray-400">
                                <span>Deadline:</span>
                                <span>
                                  {new Date(deal.deadline).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {deal.budget && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <DollarSign className="w-4 h-4" />
                              <span>Budget: ${deal.budget.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{deal.participants.length} Participants</span>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {deal.deal_type}
                            </Badge>
                          </div>

                          <div className="flex -space-x-2">
                            {deal.participants.slice(0, 4).map((participant) => (
                              <Avatar key={participant.id} className="border-2 border-gray-800">
                                <AvatarImage src={participant.user.avatar_url} />
                                <AvatarFallback>
                                  {participant.user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {deal.participants.length > 4 && (
                              <Avatar className="border-2 border-gray-800">
                                <AvatarFallback className="bg-gray-700 text-gray-400">
                                  +{deal.participants.length - 4}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 
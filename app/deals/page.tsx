"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Handshake, 
  ArrowLeft, 
  Search, 
  Plus, 
  Globe,
  Lock,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  SortAsc,
  Pencil,
  Trash2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useDeals } from "@/hooks/useDeals"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

export default function DealsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { deals, loading, error } = useDeals()
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filter deals based on search query
  const filteredDeals = deals?.filter(deal =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Delete deal handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return
    setUpdatingId(id)
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Deleted", description: "Deal deleted successfully" })
      router.refresh()
    }
    setUpdatingId(null)
  }

  // Change visibility handler
  const handleChangeVisibility = async (id: string, newLevel: string) => {
    setUpdatingId(id)
    const { error } = await supabase.from('deals').update({ confidentiality_level: newLevel }).eq('id', id)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Updated", description: "Visibility updated" })
      router.refresh()
    }
    setUpdatingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-8">
      <div className="w-full max-w-full md:max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
            </Button>
          </div>
          <Button
            onClick={() => router.push('/makedeal')}
            className="gradient-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Make New Deal
          </Button>
        </div>

        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
            <CardTitle className="text-2xl">Deals</CardTitle>
                <CardDescription>Manage your business deals and partnerships</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400">Error loading deals: {error}</p>
              </div>
            ) : filteredDeals.length > 0 ? (
              <div className="space-y-4">
                {filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {deal.confidentiality_level === 'public' ? (
                          <Globe className="w-5 h-5 text-blue-400" />
                        ) : deal.confidentiality_level === 'private' ? (
                          <Lock className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Shield className="w-5 h-5 text-purple-400" />
                        )}
                        <div>
                          <h3 className="font-medium text-lg">{deal.title}</h3>
                          <p className="text-sm text-gray-400 line-clamp-1">
                            {deal.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {deal.deal_type}
                            </Badge>
                            <Badge 
                              variant={
                                deal.confidentiality_level === 'public' 
                                  ? 'outline' 
                                  : deal.confidentiality_level === 'private'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="capitalize"
                            >
                              {deal.confidentiality_level}
                            </Badge>
                            <select
                              className="ml-0 sm:ml-2 bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-xs mt-2 sm:mt-0"
                              value={deal.confidentiality_level}
                              disabled={updatingId === deal.id}
                              onChange={e => handleChangeVisibility(deal.id, e.target.value)}
                            >
                              <option value="public">Public</option>
                              <option value="private">Private</option>
                              <option value="confidential">Confidential</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-wrap">
                        {deal.status === 'pending' ? (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        ) : deal.status === 'accepted' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <Badge 
                          variant={
                            deal.status === 'pending'
                              ? 'outline'
                              : deal.status === 'accepted'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="capitalize"
                        >
                          {deal.status}
                        </Badge>
                        <Button size="icon" variant="outline" className="border-gray-700" onClick={() => router.push(`/deals/${deal.id}`)} title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(deal.id)} disabled={updatingId === deal.id} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center mb-4">
                  <Handshake className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No deals found
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Create your first deal to get started"}
              </p>
              <Button
                  onClick={() => router.push('/makedeal')}
                className="gradient-button"
              >
                  <Plus className="w-4 h-4 mr-2" />
                  Make New Deal
              </Button>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
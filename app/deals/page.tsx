"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Trash2,
  Users,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useDeals } from "@/hooks/useDeals"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Deal {
  id: string
  title: string
  description: string
  initiator_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'negotiation'
  deal_type: 'investment' | 'partnership' | 'collaboration' | 'acquisition' | 'custom'
  custom_type?: string
  confidentiality_level: 'public' | 'private' | 'confidential'
  budget?: number
  equity_share?: number
  deadline?: string
  created_at: string
  updated_at: string
  participants?: any[]
}

export default function DealsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { deals, loading, error } = useDeals()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [confidentialityFilter, setConfidentialityFilter] = useState<string>("all")
  const { toast } = useToast()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filter deals based on search query and filters
  const filteredDeals = deals?.filter(deal => {
    const matchesSearch = 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter
    const matchesType = typeFilter === "all" || deal.deal_type === typeFilter
    const matchesConfidentiality = confidentialityFilter === "all" || deal.confidentiality_level === confidentialityFilter

    return matchesSearch && matchesStatus && matchesType && matchesConfidentiality
  }) || []

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", icon: Clock },
      accepted: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: CheckCircle },
      rejected: { color: "bg-red-500/20 text-red-400 border-red-500/50", icon: XCircle },
      completed: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", icon: CheckCircle },
      negotiation: { color: "bg-purple-500/20 text-purple-400 border-purple-500/50", icon: Handshake }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getConfidentialityIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="w-4 h-4 text-green-400" />
      case 'private':
        return <Lock className="w-4 h-4 text-yellow-400" />
      case 'confidential':
        return <Shield className="w-4 h-4 text-red-400" />
      default:
        return <Lock className="w-4 h-4 text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const isInitiator = (deal: Deal) => {
    return deal.initiator_id === user?.id
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
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
            <div>
              <h1 className="text-3xl font-bold">Deals</h1>
              <p className="text-gray-400">Manage and track your business deals</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/makedeal')}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Deal
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Search</label>
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                    <SelectItem value="acquisition">Acquisition</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Confidentiality</label>
                <Select value={confidentialityFilter} onValueChange={setConfidentialityFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deals Table */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Deals ({filteredDeals.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDeals.length === 0 ? (
              <div className="text-center py-12">
                <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No deals found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all" || confidentialityFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Get started by creating your first deal"}
                </p>
                {!searchQuery && statusFilter === "all" && typeFilter === "all" && confidentialityFilter === "all" && (
                  <Button
                    onClick={() => router.push('/makedeal')}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Deal
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-300">Deal</TableHead>
                      <TableHead className="text-gray-300">Type</TableHead>
                      <TableHead className="text-gray-300">Participants</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Budget</TableHead>
                      <TableHead className="text-gray-300">Confidentiality</TableHead>
                      <TableHead className="text-gray-300">Created</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.map((deal: Deal) => (
                      <TableRow key={deal.id} className="border-gray-800 hover:bg-gray-800/30">
                        <TableCell>
                          <div>
                            <div className="font-medium text-white">{deal.title}</div>
                            <div className="text-sm text-gray-400 line-clamp-2">
                              {deal.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {deal.custom_type || deal.deal_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {deal.participants && deal.participants.length > 0 ? (
                              <>
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-300">
                                  {deal.participants.length}
                                </span>
                                                                  <div className="flex -space-x-2 ml-2">
                                    {deal.participants.slice(0, 3).map((participant: any, index: number) => (
                                      <div
                                        key={participant.id}
                                        className="w-6 h-6 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-500 transition-colors"
                                        title={`${participant.user?.name || 'Unknown'} (${participant.status})`}
                                        onClick={() => router.push(`/profile/${participant.user?.id}`)}
                                      >
                                        {participant.user?.avatar_url ? (
                                          <img 
                                            src={participant.user.avatar_url} 
                                            alt={participant.user.name} 
                                            className="w-6 h-6 rounded-full"
                                          />
                                        ) : (
                                          participant.user?.name?.charAt(0)?.toUpperCase() || '?'
                                        )}
                                      </div>
                                    ))}
                                  {deal.participants.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs font-medium">
                                      +{deal.participants.length - 3}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">No participants</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(deal.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                            {formatCurrency(deal.budget)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getConfidentialityIcon(deal.confidentiality_level)}
                            <span className="ml-2 capitalize">{deal.confidentiality_level}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            {formatDate(deal.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/deals/${deal.id}`)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/negotiate?deal=${deal.id}`)}
                              className="text-purple-400 hover:text-purple-300"
                            >
                              <Handshake className="w-4 h-4" />
                            </Button>
                            {isInitiator(deal) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/deals/${deal.id}/edit`)}
                                  className="text-yellow-400 hover:text-yellow-300"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(deal.id)}
                                  disabled={updatingId === deal.id}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
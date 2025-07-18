"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Handshake, 
  ArrowLeft, 
  Users, 
  Calendar, 
  DollarSign, 
  User, 
  Percent, 
  Globe, 
  Lock, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  ThumbsUp,
  ThumbsDown,
  FileText
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { useToast } from "@/components/ui/use-toast"

export default function DealDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const dealId = Array.isArray(params.id) ? params.id[0] : params.id
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false);
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const fetchDeal = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          participants:deal_participants(
            id,
            status,
            role,
            user:users(
              id,
              name,
              email,
              avatar_url
            )
          )
        `)
        .eq('id', dealId)
        .single()
      
      if (error) {
        setError(error.message)
      } else {
        // Fetch initiator information separately
        if (data.initiator_id) {
          const { data: initiatorData, error: initiatorError } = await supabase
            .from('users')
            .select('id, name, email, avatar_url')
            .eq('id', data.initiator_id)
            .single()
          
          if (!initiatorError && initiatorData) {
            data.initiator = initiatorData
          }
        }
        
        setDeal(data)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dealId) fetchDeal()
  }, [dealId])

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

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Deal not found</p>
      </div>
    )
  }

  const handleJoinDeal = async () => {
    if (!user) {
      router.push(`/login?redirect=/deals/${deal.id}`);
      return;
    }
    setIsJoining(true);
    try {
      // Check if already a participant
      const { data: existing, error: checkError } = await supabase
        .from('deal_participants')
        .select('id, status')
        .eq('deal_id', deal.id)
        .eq('user_id', user.id)
        .single();
      if (existing) {
        if (existing.status === 'pending') {
          toast.error('Your join request is still pending approval.');
        } else {
          toast.info('You are already a participant in this deal.');
        }
        setIsJoining(false);
        return;
      }
      // Add as pending participant
      const { error: joinError } = await supabase
        .from('deal_participants')
        .insert([{
          deal_id: deal.id,
          user_id: user.id,
          status: 'pending',
          role: 'participant',
        }]);
      if (joinError) throw joinError;
      toast.success('Join request sent!');
      // Refresh deal data to show updated participants
      fetchDeal();
    } catch (err) {
      toast.error('Failed to send join request.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleApproveDeal = async () => {
    if (!user || !deal) return;
    setIsApproving(true);
    try {
      // Update participant status to accepted
      const { error: participantError } = await supabase
        .from('deal_participants')
        .update({ status: 'accepted' })
        .eq('deal_id', deal.id)
        .eq('user_id', user.id);
      
      if (participantError) throw participantError;

      // Check if all participants have accepted
      const { data: participants, error: checkError } = await supabase
        .from('deal_participants')
        .select('status')
        .eq('deal_id', deal.id);
      
      if (checkError) throw checkError;

      const allAccepted = participants.every(p => p.status === 'accepted');
      
      // If all participants accepted, update deal status to accepted
      if (allAccepted) {
        const { error: dealError } = await supabase
          .from('deals')
          .update({ status: 'accepted' })
          .eq('id', deal.id);
        
        if (dealError) throw dealError;
        toast.success('Deal approved and moved to accepted status!');
      } else {
        toast.success('Deal approval recorded! Waiting for other participants.');
      }

      // Refresh deal data
      fetchDeal();
    } catch (err) {
      toast.error('Failed to approve deal.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectDeal = async () => {
    if (!user || !deal) return;
    setIsRejecting(true);
    try {
      // Update participant status to rejected
      const { error: participantError } = await supabase
        .from('deal_participants')
        .update({ status: 'rejected' })
        .eq('deal_id', deal.id)
        .eq('user_id', user.id);
      
      if (participantError) throw participantError;

      // Update deal status to rejected
      const { error: dealError } = await supabase
        .from('deals')
        .update({ status: 'rejected' })
        .eq('id', deal.id);
      
      if (dealError) throw dealError;

      toast.success('Deal rejected.');
      // Refresh deal data
      fetchDeal();
    } catch (err) {
      toast.error('Failed to reject deal.');
    } finally {
      setIsRejecting(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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
      case 'negotiation':
        return <Clock className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
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

  const isInitiator = () => deal?.initiator_id === user?.id
  const isParticipant = () => deal?.participants?.some((p: any) => p.user?.id === user?.id)
  const isPendingParticipant = () => deal?.participants?.some((p: any) => p.user?.id === user?.id && p.status === 'pending')
  const isAcceptedParticipant = () => deal?.participants?.some((p: any) => p.user?.id === user?.id && p.status === 'accepted')
  const canApprove = () => isParticipant() && !isInitiator() && deal?.status === 'pending'
  const allParticipantsAccepted = () => deal?.participants?.every((p: any) => p.status === 'accepted')

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-8 py-8">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>
          <div className="flex items-center gap-2">
            {isInitiator() && (
              <Button
                variant="outline"
                onClick={() => router.push(`/deals/${deal.id}/edit`)}
                className="border-gray-700"
              >
                Edit Deal
              </Button>
            )}
          </div>
        </div>

        {/* Main Deal Information */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{deal.title}</CardTitle>
                <CardDescription className="text-lg text-gray-300 mb-4">
                  {deal.description}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {deal.custom_type || deal.deal_type}
                  </Badge>
                  <Badge
                    variant={
                      deal.confidentiality_level === 'public'
                        ? 'outline'
                        : deal.confidentiality_level === 'private'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="capitalize flex items-center gap-1"
                  >
                    {getConfidentialityIcon(deal.confidentiality_level)}
                    {deal.confidentiality_level}
                  </Badge>
                  <Badge
                    variant={
                      deal.status === 'pending'
                        ? 'outline'
                        : deal.status === 'accepted'
                        ? 'secondary'
                        : deal.status === 'completed'
                        ? 'default'
                        : 'destructive'
                    }
                    className="capitalize flex items-center gap-1"
                  >
                    {getStatusIcon(deal.status)}
                    {deal.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deal Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Financial Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Budget:</span>
                    <span className="font-medium">{formatCurrency(deal.budget)}</span>
                  </div>
                  {deal.equity_share && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Equity Share:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        {deal.equity_share}%
                      </span>
                    </div>
                  )}
                  {deal.roi_expectation && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ROI Expectation:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        {deal.roi_expectation}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="font-medium">{formatDate(deal.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Updated:</span>
                    <span className="font-medium">{formatDate(deal.updated_at)}</span>
                  </div>
                  {deal.deadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deadline:</span>
                      <span className="font-medium">{formatDate(deal.deadline)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Initiator */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Deal Initiator
                </h3>
                <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    {deal.initiator?.avatar_url ? (
                      <img 
                        src={deal.initiator.avatar_url} 
                        alt={deal.initiator.name} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {deal.initiator?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{deal.initiator?.name || 'Unknown'}</h4>
                    <p className="text-sm text-gray-400">{deal.initiator?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                Participants ({deal.participants?.length || 0})
              </h3>
              {deal.participants && deal.participants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deal.participants.map((participant: any) => (
                    <div key={participant.id} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                          {participant.user?.avatar_url ? (
                            <img 
                              src={participant.user.avatar_url} 
                              alt={participant.user.name} 
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {participant.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{participant.user?.name || 'Unknown'}</h4>
                          <p className="text-sm text-gray-400">{participant.user?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={
                                participant.status === 'pending' ? 'outline' :
                                participant.status === 'accepted' ? 'secondary' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {participant.status}
                            </Badge>
                            {participant.role && (
                              <Badge variant="outline" className="text-xs">
                                {participant.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>No participants yet</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-800">
              {/* Show different buttons based on user role and deal status */}
              {deal?.status === 'pending' && (
                <>
                  {/* Negotiation button - available for all participants and initiators */}
                  {(isParticipant() || isInitiator()) && (
                    <Button
                      className="flex-1 gradient-button"
                      onClick={() => router.push(`/negotiate?deal=${deal.id}`)}
                    >
                      <Handshake className="w-4 h-4 mr-2" />
                      Open Negotiation
                    </Button>
                  )}
                  
                  {canApprove() && (
                    <>
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                        onClick={handleApproveDeal}
                        disabled={isApproving}
                      >
                        {isApproving ? 'Approving...' : 'Approve Deal'}
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        onClick={handleRejectDeal}
                        disabled={isRejecting}
                      >
                        {isRejecting ? 'Rejecting...' : 'Reject Deal'}
                      </Button>
                    </>
                  )}
                  
                  {isInitiator() && (
                    <div className="flex-1 text-center p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-sm text-gray-400">
                        Waiting for participants to approve the deal
                      </p>
                      {allParticipantsAccepted() && (
                        <p className="text-sm text-green-400 mt-1">
                          All participants have approved! Deal can be finalized.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {!isParticipant() && !isInitiator() && (
                    <Button
                      className="flex-1 gradient-button"
                      onClick={handleJoinDeal}
                      disabled={isJoining}
                    >
                      {isJoining ? 'Requesting...' : 'Join Deal'}
                    </Button>
                  )}
                </>
              )}

              {deal?.status === 'accepted' && (
                <div className="flex-1 text-center p-3 bg-green-600/20 border border-green-600/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-medium">Deal Accepted</p>
                  <p className="text-sm text-green-300">All participants have approved this deal</p>
                </div>
              )}

              {deal?.status === 'rejected' && (
                <div className="flex-1 text-center p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 font-medium">Deal Rejected</p>
                  <p className="text-sm text-red-300">This deal has been rejected by participants</p>
                </div>
              )}

              {/* Negotiate button - available for accepted deals or when in negotiation */}
              {(deal?.status === 'accepted' || deal?.status === 'negotiation') && (
                <Button
                  className="flex-1 gradient-button"
                  onClick={() => router.push(`/negotiate?deal=${deal.id}`)}
                >
                  <Handshake className="w-4 h-4 mr-2" />
                  Open Negotiation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
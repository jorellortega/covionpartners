"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Globe, Lock, Shield, Clock, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export default function DealDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dealId = Array.isArray(params.id) ? params.id[0] : params.id
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    async function fetchDeal() {
      try {
        const { data, error } = await supabase.from('deals').select('*').eq('id', dealId).single()
        if (error) {
          setError(error.message)
        } else {
          setDeal(data)
        }
      } catch (err) {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
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
    } catch (err) {
      toast.error('Failed to send join request.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-8">
      <div className="w-full max-w-full md:max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">{deal.title}</CardTitle>
            <CardDescription>{deal.description}</CardDescription>
          </CardHeader>
          <CardContent>
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
            </div>
            {/* Public Action Buttons */}
            <div className="mt-8 flex flex-col gap-3">
              <Button
                className="w-full gradient-button"
                onClick={() => router.push(`/negotiate?deal=${deal.id}`)}
              >
                Negotiate
              </Button>
              <Button
                className="w-full gradient-button"
                onClick={handleJoinDeal}
                disabled={isJoining}
              >
                {isJoining ? 'Requesting...' : 'Join Deal'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Globe, Lock, Shield, Clock, CheckCircle, XCircle } from "lucide-react"

export default function DealDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dealId = Array.isArray(params.id) ? params.id[0] : params.id
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
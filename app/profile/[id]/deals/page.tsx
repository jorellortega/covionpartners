"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Handshake, Eye } from "lucide-react"
import Link from "next/link"

interface Deal {
  id: string
  title: string
  description: string
  status: string
  deal_type: string
  custom_type?: string
  confidentiality_level: string
}

export default function ProfileDealsPage() {
  const params = useParams()
  const router = useRouter()
  const profileId = Array.isArray(params.id) ? params.id[0] : params.id
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDeals() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from("deals")
          .select("id, title, description, status, deal_type, custom_type, confidentiality_level")
          .eq("initiator_id", profileId)
          .in("status", ["pending", "negotiation"])
          .eq("confidentiality_level", "public")
          .order("created_at", { ascending: false })
        if (error) throw error
        setDeals(data || [])
      } catch (err: any) {
        setError(err.message || "Failed to load deals.")
      } finally {
        setLoading(false)
      }
    }
    if (profileId) fetchDeals()
  }, [profileId])

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Open Deals</h1>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : deals.length === 0 ? (
          <div>No open public deals found for this user.</div>
        ) : (
          <div className="space-y-6">
            {deals.map((deal) => (
              <Card key={deal.id} className="border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-purple-400" />
                    {deal.title}
                  </CardTitle>
                  <CardDescription>{deal.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 items-center mb-2">
                    <span className="bg-gray-800 px-2 py-1 rounded text-xs capitalize">
                      {deal.deal_type === "custom" && deal.custom_type ? deal.custom_type : deal.deal_type}
                    </span>
                    <span className="bg-green-900 px-2 py-1 rounded text-xs capitalize">
                      {deal.status}
                    </span>
                    <span className="bg-blue-900 px-2 py-1 rounded text-xs capitalize">
                      {deal.confidentiality_level}
                    </span>
                  </div>
                  <Link href={`/deals/${deal.id}`} passHref legacyBehavior>
                    <Button variant="secondary">
                      <Eye className="w-4 h-4 mr-2" /> View & Start Deal
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
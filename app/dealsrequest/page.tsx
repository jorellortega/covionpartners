"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function DealsRequestPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchDeals = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("deals")
        .select("*, project:projects(id, name, owner_id)")
        .eq("status", "pending")
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      } else {
        setDeals((data || []).filter(d => d.project?.owner_id === user.id))
      }
      setLoading(false)
    }
    fetchDeals()
  }, [user, toast])

  const handleAction = async (dealId: string, status: string) => {
    const { error } = await supabase.from("deals").update({ status }).eq("id", dealId)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: `Deal ${status}` })
      setDeals(deals => deals.filter(d => d.id !== dealId))
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Deal Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : deals.length === 0 ? (
              <div>No pending deal requests.</div>
            ) : (
              deals.map(deal => (
                <div key={deal.id} className="mb-4 p-4 border-b border-gray-800">
                  <div className="font-bold">{deal.title}</div>
                  <div className="text-sm text-gray-400 mb-2">{deal.description}</div>
                  <div className="mb-2">Project: {deal.project?.name}</div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleAction(deal.id, "accepted")}>Approve</Button>
                    <Button variant="destructive" onClick={() => handleAction(deal.id, "rejected")}>Deny</Button>
                    <Button variant="outline" onClick={() => handleAction(deal.id, "negotiation")}>Negotiate</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
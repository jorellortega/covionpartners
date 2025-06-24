"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Handshake, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

export default function CustomDealPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dealData, setDealData] = useState({
    title: "",
    description: "",
    custom_type: "",
    confidentiality_level: "private"
  })

  const partnerId = searchParams.get("partner")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (!dealData.title || !dealData.custom_type) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" })
      setLoading(false)
      return
    }
    if (!user || !user.id || !partnerId) {
      toast({ title: "Error", description: "Missing user or partner.", variant: "destructive" })
      setLoading(false)
      return
    }
    if (user.id === partnerId) {
      toast({ title: "Error", description: "You cannot make a deal with yourself.", variant: "destructive" })
      setLoading(false)
      return
    }
    try {
      // Insert deal
      const { data: deal, error: dealError } = await supabase.from("deals").insert([
        {
          title: dealData.title,
          description: dealData.description,
          deal_type: "custom",
          custom_type: dealData.custom_type,
          confidentiality_level: dealData.confidentiality_level,
          initiator_id: user.id
        }
      ]).select().single()
      if (dealError || !deal) throw dealError || new Error("Deal not created")
      // Add both users as participants
      const { error: partError } = await supabase.from("deal_participants").insert([
        { deal_id: deal.id, user_id: user.id, status: "accepted", role: "initiator" },
        { deal_id: deal.id, user_id: partnerId, status: "pending", role: "partner" }
      ])
      if (partError) throw partError
      toast({ title: "Success", description: "Custom deal created!" })
      setTimeout(() => {
        router.push("/deals")
      }, 700)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create deal.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Handshake className="w-6 h-6 mr-2" />
              Custom Deal
            </CardTitle>
            <CardDescription>Create a custom deal with a user. No project required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Deal Title</Label>
                <Input
                  placeholder="Enter deal title"
                  value={dealData.title}
                  onChange={e => setDealData({ ...dealData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the deal"
                  value={dealData.description}
                  onChange={e => setDealData({ ...dealData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Custom Deal Type</Label>
                <Input
                  placeholder="Enter custom deal type (e.g. Consulting, JV, etc.)"
                  value={dealData.custom_type}
                  onChange={e => setDealData({ ...dealData, custom_type: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Confidentiality Level</Label>
                <select
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white"
                  value={dealData.confidentiality_level}
                  onChange={e => setDealData({ ...dealData, confidentiality_level: e.target.value })}
                  required
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="confidential">Confidential</option>
                </select>
              </div>
              <Button type="submit" className="w-full gradient-button" disabled={loading}>
                {loading ? "Creating Deal..." : "Create Custom Deal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
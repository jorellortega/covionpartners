"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DEAL_TYPES = ["investment", "partnership", "collaboration", "acquisition", "custom"]
const CONFIDENTIALITY_LEVELS = ["public", "private", "confidential"]
const STATUS_OPTIONS = ["pending", "accepted", "rejected", "completed", "negotiation"]

export default function EditDealPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = Array.isArray(params.id) ? params.id[0] : params.id
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchDeal() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase.from("deals").select("*", { count: "exact" }).eq("id", dealId).single()
        if (error) throw error
        setDeal(data)
      } catch (err: any) {
        setError(err.message || "Failed to load deal.")
      } finally {
        setLoading(false)
      }
    }
    if (dealId) fetchDeal()
  }, [dealId])

  const handleChange = (field: string, value: any) => {
    setDeal((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from("deals").update({
        title: deal.title,
        description: deal.description,
        deal_type: deal.deal_type,
        custom_type: deal.deal_type === "custom" ? deal.custom_type : null,
        confidentiality_level: deal.confidentiality_level,
        status: deal.status
      }).eq("id", dealId)
      if (error) throw error
      setSuccess(true)
      setTimeout(() => router.push("/deals"), 1000)
    } catch (err: any) {
      setError(err.message || "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>
  if (!deal) return <div className="min-h-screen flex items-center justify-center text-white">Deal not found</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle>Edit Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block mb-1">Title</label>
                <Input value={deal.title || ""} onChange={e => handleChange("title", e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <Textarea value={deal.description || ""} onChange={e => handleChange("description", e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1">Deal Type</label>
                <Select value={deal.deal_type} onValueChange={v => handleChange("deal_type", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {deal.deal_type === "custom" && (
                <div>
                  <label className="block mb-1">Custom Type</label>
                  <Input value={deal.custom_type || ""} onChange={e => handleChange("custom_type", e.target.value)} required />
                </div>
              )}
              <div>
                <label className="block mb-1">Confidentiality Level</label>
                <Select value={deal.confidentiality_level} onValueChange={v => handleChange("confidentiality_level", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select confidentiality" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONFIDENTIALITY_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1">Status</label>
                <Select value={deal.status} onValueChange={v => handleChange("status", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              {success && <div className="text-green-400 mt-2">Deal updated!</div>}
              {error && <div className="text-red-400 mt-2">{error}</div>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
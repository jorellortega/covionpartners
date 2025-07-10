"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Handshake, Eye, Filter, Clock } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DEAL_TYPES = ["all", "investment", "partnership", "collaboration", "acquisition", "custom"]
const STATUS_OPTIONS = ["all", "pending", "negotiation"]
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
]

interface Deal {
  id: string
  title: string
  description: string
  status: string
  deal_type: string
  custom_type?: string
  confidentiality_level: string
  created_at: string
}

function isNew(created_at: string) {
  const created = new Date(created_at)
  const now = new Date()
  const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 3
}

export default function OpenDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState("newest")

  useEffect(() => {
    async function fetchDeals() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from("deals")
          .select("id, title, description, status, deal_type, custom_type, confidentiality_level, created_at")
          .eq("confidentiality_level", "public")
          .in("status", ["pending", "negotiation"])
          .order("created_at", { ascending: false })
        if (error) throw error
        setDeals(data || [])
      } catch (err: any) {
        setError(err.message || "Failed to load deals.")
      } finally {
        setLoading(false)
      }
    }
    fetchDeals()
  }, [])

  const filteredDeals = useMemo(() => {
    let filtered = deals
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      )
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter(d => d.deal_type === typeFilter)
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(d => d.status === statusFilter)
    }
    if (sort === "newest") {
      filtered = filtered.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      filtered = filtered.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    return filtered
  }, [deals, search, typeFilter, statusFilter, sort])

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">All Open Deals</h1>
        <Card className="border-gray-800 bg-gray-900/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Search</label>
                <Input
                  placeholder="Search deals..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sort</label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : filteredDeals.length === 0 ? (
          <div>No open public deals found.</div>
        ) : (
          <div className="space-y-6">
            {filteredDeals.map((deal) => (
              <Card key={deal.id} className="border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-purple-400" />
                    {deal.title}
                    {isNew(deal.created_at) && (
                      <span className="ml-2 bg-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 inline-block mr-1" /> New
                      </span>
                    )}
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
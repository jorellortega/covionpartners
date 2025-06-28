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
  Trash2,
  Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useDeals } from "@/hooks/useDeals"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Head from "next/head"

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
    <>
      <Head>
        <title>Deal Making Hub | Discover, Negotiate, and Close Deals</title>
        <meta name="description" content="Discover, negotiate, and close deals with powerful collaboration and transaction tools. Manage confidentiality, streamline negotiations, and grow your business." />
      </Head>
      <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full mx-auto text-center py-20">
          <div className="flex flex-col items-center mb-8">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-4 mb-4">
              <Handshake className="w-12 h-12 text-white" />
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Deal Making Hub</h1>
            <p className="text-lg text-gray-300 mb-6">
              Discover, negotiate, and close deals with partners and clients using powerful collaboration and transaction tools. Manage confidentiality, streamline negotiations, and grow your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Shield className="w-8 h-8 text-purple-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Confidentiality Controls</h3>
              <p className="text-gray-400">Set deals as public, private, or confidential to control visibility and access.</p>
        </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Collaboration Tools</h3>
              <p className="text-gray-400">Invite partners, assign roles, and communicate directly within each deal.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Streamlined Negotiations</h3>
              <p className="text-gray-400">Track deal status, manage offers, and keep negotiations organized.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Lock className="w-8 h-8 text-gray-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Secure Transactions</h3>
              <p className="text-gray-400">All deals are protected with robust security and privacy features.</p>
                      </div>
                    </div>
                  </div>
      </div>
    </>
  )
} 
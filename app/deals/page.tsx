"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Deal {
  id: string
  title: string
  description: string
  deal_type: string
  custom_type?: string
  status: string
  confidentiality_level: string
  created_at: string
  initiator_id: string
}

export default function DealsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeals()
  }, [user])

  const fetchDeals = async () => {
    try {
      if (!user) return

      let query = supabase
        .from('deals')
        .select('*')

      // If user is not an admin or partner, only show deals they're involved in
      if (user.role !== 'admin' && user.role !== 'partner') {
        query = query.or(`initiator_id.eq.${user.id},id.in.(select deal_id from deal_participants where user_id='${user.id}')`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setDeals(data || [])
    } catch (error) {
      console.error('Error fetching deals:', error)
      toast({
        title: "Error",
        description: "Failed to fetch deals",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId)

      if (error) throw error

      setDeals(deals.filter(deal => deal.id !== dealId))
      toast({
        title: "Success",
        description: "Deal deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting deal:', error)
      toast({
        title: "Error",
        description: "Failed to delete deal",
        variant: "destructive"
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
          <p className="text-lg text-gray-300 mb-6">You need to be signed in to access this page.</p>
          <Link href="/login" className="gradient-button px-4 py-2">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Deals</h1>
          {user.role !== 'viewer' && (
            <Link href="/makedeal">
              <Button className="gradient-button">
                <Plus className="w-4 h-4 mr-2" />
                New Deal
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="text-center text-gray-400">No deals found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <Card key={deal.id} className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    <Link href={`/deals/${deal.id}`} className="hover:text-blue-400 transition-colors">
                      {deal.title}
                    </Link>
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{deal.deal_type}</Badge>
                    <Badge variant="outline">{deal.status}</Badge>
                    <Badge>{deal.confidentiality_level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 line-clamp-3">{deal.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-gray-400">
                    Created {new Date(deal.created_at).toLocaleDateString()}
                  </div>
                  {user.role !== 'viewer' && (user.id === deal.initiator_id || user.role === 'admin') && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/deals/${deal.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteDeal(deal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
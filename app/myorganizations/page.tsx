"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MyOrganizationsPage() {
  const { user, loading } = useAuth()
  const [orgs, setOrgs] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    const fetchOrgs = async () => {
      setFetching(true)
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
      setOrgs(data || [])
      setFetching(false)
    }
    fetchOrgs()
  }, [user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Please log in to view your organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">My Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {orgs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">You have not created any organizations yet.</div>
            ) : (
              <div className="space-y-4">
                {orgs.map(org => (
                  <div key={org.id} className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-4">
                      {org.logo && (
                        <img src={org.logo} alt={org.name} className="w-12 h-12 rounded object-contain border border-gray-700 bg-white" />
                      )}
                      <div>
                        <div className="font-semibold text-lg">{org.name}</div>
                        <div className="text-gray-400 text-sm">{org.description}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/company/${org.slug}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                      <Link href={`/companysettings?org=${org.id}`}>
                        <Button size="sm" variant="secondary">Settings</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
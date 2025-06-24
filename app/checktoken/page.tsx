"use client"

import { useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function CheckTokenPage() {
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClientComponentClient()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setError("")
    setLoading(true)
    try {
      // Search by certificate_number, token_serial, or metadata.token_number
      const { data, error } = await supabase
        .from('public_supports')
        .select(`
          id, project_id, certificate_number, token_serial, amount, created_at, metadata, project:projects(name), supporter_name, issued_at
        `)
        .or(`certificate_number.eq.${search},token_serial.eq.${search},metadata->>token_number.eq.${search}`)
        .limit(1)
        .single()
      if (error || !data) {
        setError("No valid token or certificate found for this number.")
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError("An error occurred while searching. Please try again.")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#18132a] to-[#2d225a] px-4 py-12">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check Token or Certificate Authenticity</CardTitle>
          <CardDescription>
            Enter a token or certificate number to verify if it is real and view its details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <Input
              placeholder="Enter token or certificate number"
              value={search}
              onChange={e => setSearch(e.target.value)}
              required
              className="text-lg"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loading || !search}>
              {loading ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
              Search
            </Button>
          </form>
          {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
          {result && (
            <div className="mt-6">
              <Card className="bg-[#18132a] border-purple-500/40">
                <CardHeader>
                  <CardTitle className="text-purple-400 text-lg">
                    {result.certificate_number ? "Certificate" : "Token"} Found
                  </CardTitle>
                  <CardDescription>
                    {result.certificate_number || result.token_serial || result.metadata?.token_number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><span className="font-semibold text-gray-300">Supporter:</span> {result.supporter_name || "Anonymous"}</div>
                    <div><span className="font-semibold text-gray-300">Project:</span> {result.project?.name || result.project_id}</div>
                    <div><span className="font-semibold text-gray-300">Amount:</span> ${result.amount}</div>
                    <div><span className="font-semibold text-gray-300">Issued:</span> {result.issued_at ? new Date(result.issued_at).toLocaleDateString() : result.created_at ? new Date(result.created_at).toLocaleDateString() : "N/A"}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
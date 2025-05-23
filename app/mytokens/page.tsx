"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import html2canvas from 'html2canvas'

const TOKEN_IMAGE_URL = "https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png"

export default function MyTokensPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTokens = async () => {
      if (!user) return
      setLoading(true)
      // Fetch tokens (public_supports) created by this user (supporter_id)
      const { data, error } = await supabase
        .from('public_supports')
        .select('id, project_id, certificate_number, token_serial, amount, created_at, metadata, project:projects(name)')
        .eq('supporter_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) {
        setTokens(data)
      } else {
        setTokens([])
      }
      setLoading(false)
    }
    if (user) fetchTokens()
  }, [user])

  const handleDownloadToken = async (tokenId: string) => {
    const tokenElement = document.getElementById(`mytoken-image-${tokenId}`)
    if (tokenElement) {
      const canvas = await html2canvas(tokenElement, { backgroundColor: null, width: 240, height: 320, scale: 2 })
      const link = document.createElement('a')
      link.download = `token-${tokenId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white">
            Back
          </Button>
          <h1 className="text-2xl font-bold">My Tokens</h1>
        </div>
        {tokens.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No Tokens Found</CardTitle>
              <CardDescription>You haven't created any tokens yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tokens.map(token => (
              <Card key={token.id} className="border-purple-500/20">
                <CardHeader>
                  <CardTitle>{token.certificate_number || token.token_serial || 'Token'}</CardTitle>
                  <CardDescription>
                    {token.project?.name ? `Project: ${token.project.name}` : `Project ID: ${token.project_id}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center py-4">
                    <div id={`mytoken-image-${token.id}`} className="flex flex-col items-center justify-center" style={{ width: 240, height: 320 }}>
                      <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 240, height: 320, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
                        <defs>
                          <linearGradient id="card-bg" x1="0" y1="0" x2="1600" y2="2240" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#4f46e5" />
                            <stop offset="0.5" stopColor="#7c3aed" />
                            <stop offset="1" stopColor="#fff" />
                          </linearGradient>
                          <radialGradient id="shine" cx="50%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#card-bg)" stroke="#fff" strokeWidth="16" />
                        <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#shine)" />
                        <text x="50%" y="240" textAnchor="middle" fontSize="160" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">TOKEN</text>
                        <text x="50%" y="380" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="8">COVION PARTNERS</text>
                        <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                        <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                        <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{token.certificate_number || token.token_serial || ''}</text>
                        <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Serial Number</text>
                      </svg>
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      Serial: {token.certificate_number || token.token_serial || ''}
                    </div>
                    <Button className="mt-4 w-full" onClick={() => handleDownloadToken(token.id)}>
                      Download Token
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Amount: <span className="font-bold text-black">{token.amount}</span></div>
                  <div className="text-xs text-gray-400">Created: {token.created_at ? new Date(token.created_at).toLocaleString() : ''}</div>
                  {token.metadata?.token_number && (
                    <div className="text-xs text-gray-400 mt-2">Token Number: {token.metadata.token_number}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
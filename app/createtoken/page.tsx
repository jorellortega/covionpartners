"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { v4 as uuidv4 } from 'uuid'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const TOKEN_IMAGE_URL = "https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png"

export default function CreateTokenPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<{ stripe_connect_account_id: string | null } | null>(null)
  const [tokenName, setTokenName] = useState("")
  const [tokenNumber, setTokenNumber] = useState(uuidv4().split('-')[0].toUpperCase())
  const [creating, setCreating] = useState(false)
  const [createdToken, setCreatedToken] = useState<any>(null)
  const [supporterName] = useState("Supporter")
  const [date] = useState(new Date().toLocaleDateString())
  const tokenSerial = `CP-${tokenNumber}`

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error } = await supabase
        .from('users')
        .select('stripe_connect_account_id')
        .eq('id', user.id)
        .single()
      if (error) {
        toast.error('Failed to load user data')
        setUserData(null)
      } else {
        setUserData(data)
      }
      setLoading(false)
    }
    fetchUserData()
  }, [router, supabase])

  // Helper to generate a unique token number
  function generateTokenNumber() {
    // You can use uuid or a custom format (e.g., COVION-YYYYMMDD-HHMMSS-XXXX)
    // Here, we'll use a short UUID
    return uuidv4().split('-')[0].toUpperCase()
  }

  const handleCreateToken = async () => {
    if (!tokenName) {
      toast.error("Please enter a token name.")
      return
    }
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('public_supports')
        .insert({
          message: tokenName,
          metadata: { token_number: tokenNumber },
          created_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) {
        toast.error('Failed to create token')
      } else {
        setCreatedToken(data)
        toast.success('Token created and saved!')
        setTokenName("")
        setTokenNumber(generateTokenNumber()) // Generate a new unique number for the next token
      }
    } catch (err) {
      toast.error('Error creating token')
    } finally {
      setCreating(false)
    }
  }

  const handleDownloadCertificate = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    doc.setFillColor(20, 20, 20)
    doc.rect(0, 0, 842, 595, 'F')
    doc.setDrawColor('#7c3aed')
    doc.setLineWidth(8)
    doc.roundedRect(30, 30, 782, 535, 24, 24, 'S')
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.src = TOKEN_IMAGE_URL
    img.onload = function () {
      doc.addImage(img, 'PNG', 90, 80, 120, 120, undefined, 'FAST')
      doc.setFont('times', 'bold')
      doc.setTextColor('#7c3aed')
      doc.setFontSize(36)
      doc.text('Certificate of Token Creation', 421, 110, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(18)
      doc.setTextColor('#fff')
      doc.text('This certifies that', 421, 170, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(28)
      doc.setTextColor('#fff')
      doc.text(supporterName, 421, 210, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(18)
      doc.setTextColor('#fff')
      doc.text('has created a unique Covion token', 421, 250, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(24)
      doc.setTextColor('#7c3aed')
      doc.text(tokenName, 421, 290, { align: 'center' })
      doc.setFont('times', 'normal')
      doc.setFontSize(18)
      doc.setTextColor('#4f46e5')
      doc.text(`Serial: ${tokenSerial}`, 421, 330, { align: 'center' })
      doc.setFontSize(16)
      doc.setTextColor('#fff')
      doc.text(`on ${date}`, 421, 370, { align: 'center' })
      doc.setFillColor('#7c3aed')
      doc.circle(421, 440, 48, 'F')
      doc.setFont('times', 'bold')
      doc.setFontSize(22)
      doc.setTextColor('#fff')
      doc.text('Covion Token', 421, 448, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(14)
      doc.setTextColor('#ec4899')
      doc.text('Covion Partners', 421, 520, { align: 'center' })
      doc.save('covion-token-certificate.pdf')
    }
  }

  const handleDownloadToken = async () => {
    const tokenElement = document.getElementById('covion-token-image')
    if (tokenElement) {
      const canvas = await html2canvas(tokenElement, { backgroundColor: null, width: 1600, height: 2240, scale: 1 })
      const link = document.createElement('a')
      link.download = `${tokenSerial}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  }

  if (!userData?.stripe_connect_account_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Set Up Payments to Create Tokens</CardTitle>
            <CardDescription>
              You need to set up your Stripe Express account before you can create tokens and certificates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/managepayments')}>Set Up Payments</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Create a Token/Certificate</CardTitle>
          <CardDescription>
            Enter details below to generate a new token and preview your certificate and token card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!createdToken && (
            <>
              <Input
                placeholder="Token Name (e.g. Project Support Certificate)"
                value={tokenName}
                onChange={e => setTokenName(e.target.value)}
                disabled={creating}
              />
              <Input
                placeholder="Token Number (unique)"
                value={tokenNumber}
                readOnly
                disabled={creating}
              />
              <Button onClick={() => setCreatedToken({ tokenName, tokenNumber })} disabled={creating || !tokenName} className="w-full">
                {creating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
                {creating ? "Creating..." : "Create Token"}
              </Button>
            </>
          )}
          {createdToken && (
            <>
              {/* Confirmation Card */}
              <Card className="border-2 border-green-400 bg-green-50 shadow mb-8 mt-8 max-w-2xl mx-auto">
                <CardContent>
                  <div className="p-3 text-green-800 text-center font-semibold">
                    Token created! Token Number: <b>{createdToken.tokenNumber}</b>
                  </div>
                </CardContent>
              </Card>
              {/* Large Certificate Preview Card */}
              <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden mb-8 max-w-2xl mx-auto">
                <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
                    <rect x="10" y="10" width="380" height="230" rx="24" stroke="#7c3aed" strokeWidth="4" fill="none" />
                  </svg>
                </div>
                <CardHeader>
                  <CardTitle className="text-center text-3xl font-serif tracking-wide mb-2 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">Certificate of Token Creation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-2 py-4 font-serif text-white">
                    <img src={TOKEN_IMAGE_URL} alt="Covion Partners Token" width={96} height={96} className="mx-auto rounded-full border-4 border-[#7c3aed] bg-white object-cover" style={{ width: 96, height: 96 }} />
                    <div className="text-xs text-[#7c3aed] font-bold uppercase tracking-widest">Covion Partners Token</div>
                    <div className="text-lg italic">This certifies that</div>
                    <div className="text-2xl font-bold text-white mt-2">Supporter</div>
                    <div className="text-lg italic mt-2">has created a unique Covion token</div>
                    <div className="text-xl font-semibold text-[#7c3aed] mt-2">{createdToken.tokenName}</div>
                    <div className="text-lg mt-2">Serial: <span className="font-bold text-[#4f46e5]">CP-{createdToken.tokenNumber}</span></div>
                    <div className="text-base text-gray-300 mt-2">on {date}</div>
                    <div className="flex justify-center mt-6">
                      <div className="rounded-full border-4 border-[#7c3aed] bg-[#f3e8ff] px-6 py-2 text-[#7c3aed] font-bold text-lg shadow">Covion Token</div>
                    </div>
                    <div className="text-sm text-[#ec4899] mt-6 font-bold">Covion Partners</div>
                    <Button className="mt-6 w-full" onClick={handleDownloadCertificate}>
                      Download Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {/* Large Token Card Preview Card */}
              <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden flex flex-col items-center py-8 mb-8 max-w-2xl mx-auto">
                <div id="covion-token-image" className="flex flex-col items-center justify-center" style={{ width: 120, height: 160 }}>
                  <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 120, height: 160, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
                    <defs>
                      <linearGradient id="card-bg" x1="0" y1="0" x2="1600" y2="2240" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4f46e5" />
                        <stop offset="0.5" stopColor="#7c3aed" />
                        <stop offset="1" stopColor="#ec4899" />
                      </linearGradient>
                      <radialGradient id="shine" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#card-bg)" stroke="#fff" strokeWidth="16" />
                    <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#shine)" />
                    <text x="50%" y="260" textAnchor="middle" fontSize="120" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">Covion Partners</text>
                    <text x="50%" y="400" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="4">TOKEN</text>
                    <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                    <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                    <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">CP-{createdToken.tokenNumber}</text>
                    <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#ec4899" fontFamily="Arial, sans-serif">Serial Number</text>
                  </svg>
                </div>
                <div className="text-xs text-[#7c3aed] font-bold uppercase tracking-widest mt-4">Covion Partners Token</div>
                <div className="text-xs text-gray-300 mt-1">Serial: CP-{createdToken.tokenNumber}</div>
                <Button className="mt-6 w-full" onClick={handleDownloadToken}>Download Token</Button>
              </Card>
              <Button className="w-full mt-4 max-w-2xl mx-auto" onClick={() => setCreatedToken(null)}>
                Create Another Token
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { v4 as uuidv4 } from 'uuid'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { ArrowLeft } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { useAuth } from "@/hooks/useAuth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TOKEN_IMAGE_URL = "https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png"

export default function CreateTokenPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientComponentClient()
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects(user?.id || "")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<{ stripe_connect_account_id: string | null } | null>(null)
  const [tokenName, setTokenName] = useState("")
  const [tokenNumber, setTokenNumber] = useState(uuidv4().split('-')[0].toUpperCase())
  const [creating, setCreating] = useState(false)
  const [createdToken, setCreatedToken] = useState<any>(null)
  const [supporterName] = useState("Supporter")
  const [date] = useState(new Date().toLocaleDateString())
  const tokenSerial = `CP-${tokenNumber}`
  const [amount, setAmount] = useState("")

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

  function generateTokenNumber() {
    return uuidv4().split('-')[0].toUpperCase()
  }

  const handleCreateToken = async () => {
    if (!tokenName) {
      toast.error("Please enter a token name.")
      return
    }
    if (!selectedProjectId) {
      toast.error("Please select a project first.")
      return
    }
    if (!user) {
      toast.error("User not found. Please log in again.")
      return
    }
    setCreating(true)
    try {
      const payload = {
        project_id: selectedProjectId,
        supporter_id: user.id,
        message: tokenName,
        metadata: { token_number: tokenNumber },
        created_at: new Date().toISOString(),
        amount: Number(amount),
      }
      console.log('DEBUG: Payload for public_supports insert:', payload)
      const { data, error } = await supabase
        .from('public_supports')
        .insert(payload)
        .select()
        .single()
      console.log('DEBUG: Supabase insert error:', error)
      console.log('DEBUG: Supabase insert data:', data)
      if (error) {
        toast.error('Failed to create token')
      } else {
        setCreatedToken({ ...data, project_id: selectedProjectId, tokenNumber })
        toast.success('Token created and saved!')
        setTokenName("")
        setTokenNumber(generateTokenNumber())
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
      doc.text('Certificate of Support', 421, 110, { align: 'center' })
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
      doc.text('has supported Covion Partners', 421, 250, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(24)
      doc.setTextColor('#7c3aed')
      doc.text(`Certificate Number: CP-${createdToken.tokenNumber}`, 421, 290, { align: 'center' })
      doc.setFontSize(16)
      doc.setTextColor('#fff')
      doc.text(`on ${date}`, 421, 330, { align: 'center' })
      doc.setFillColor('#7c3aed')
      doc.circle(421, 400, 48, 'F')
      doc.setFont('times', 'bold')
      doc.setFontSize(22)
      doc.setTextColor('#fff')
      doc.text('Covion Partners', 421, 408, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(14)
      doc.setTextColor('#ec4899')
      doc.text('Thank you for your support!', 421, 520, { align: 'center' })
      doc.save('covion-support-certificate.pdf')
    }
  }

  const handleDownloadToken = async () => {
    const tokenElement = document.getElementById('covion-token-image')
    if (tokenElement) {
      const canvas = await html2canvas(tokenElement, { 
        backgroundColor: null, 
        width: 3200, 
        height: 4480, 
        scale: 2 
      })
      const link = document.createElement('a')
      link.download = `${tokenSerial}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  const handleSaveCertificate = async () => {
    if (!createdToken) {
      toast.error("No certificate/token to save.");
      return;
    }
    const projectIdToUse = createdToken.project_id || selectedProjectId;
    if (!projectIdToUse) {
      toast.error("No project ID found.");
      return;
    }
    const amountToUse = createdToken.amount || amount;
    if (!amountToUse) {
      toast.error("No amount found.");
      return;
    }
    setCreating(true);
    try {
      const payload = {
        project_id: projectIdToUse,
        amount: Number(amountToUse),
        certificate_number: `CP-${createdToken.tokenNumber}`,
        token_serial: createdToken.tokenNumber,
        certificate_title: "Certificate of Support",
        supporter_name: supporterName,
        issued_at: new Date().toISOString(),
        // certificate_url: "OPTIONAL_URL_TO_FILE"
      };
      console.log('DEBUG: Payload for public_supports SAVE:', payload);
      const { data, error } = await supabase
        .from('public_supports')
        .insert(payload)
        .select()
        .single();
      console.log('DEBUG: Supabase SAVE error:', error);
      console.log('DEBUG: Supabase SAVE data:', data);
      if (error) {
        toast.error('Failed to save certificate info');
      } else {
        toast.success('Certificate info saved!');
      }
    } catch (err) {
      toast.error('Error saving certificate info');
    } finally {
      setCreating(false);
    }
  };

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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Create a Token/Certificate</h1>
        </div>

        {/* Token Creation Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Token</CardTitle>
            <CardDescription>
              Enter details below to generate a new token and certificate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-1">Select Project</label>
              <Select value={selectedProjectId || ""} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Show selected project info */}
            {selectedProjectId && (
              <div className="p-3 border rounded bg-gray-50 mb-2">
                <div className="font-bold">
                  {projects.find((p: any) => p.id === selectedProjectId)?.name}
                </div>
                <div className="text-sm text-gray-500">
                  {projects.find((p: any) => p.id === selectedProjectId)?.description}
                </div>
              </div>
            )}
            {/* Token Name/Number Inputs and Create Button (existing code) */}
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
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={creating}
            />
            <Button onClick={handleCreateToken} disabled={creating || !tokenName || !selectedProjectId || !amount || !user} className="w-full">
              {creating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : null}
              {creating ? "Creating..." : "Create Token"}
            </Button>
            {/* End Token Creation Form */}
            {createdToken && (
              <Button className="w-full" onClick={() => setCreatedToken(null)}>
                Create Another Token
              </Button>
            )}
          </CardContent>
        </Card>

        {createdToken && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Certificate Card */}
              <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-center text-3xl font-serif tracking-wide mb-2 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
                    Certificate of Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-2 py-4 font-serif text-white">
                    <img 
                      src={TOKEN_IMAGE_URL} 
                      alt="Covion Partners Support" 
                      width={96} 
                      height={96} 
                      className="mx-auto rounded-full border-4 border-[#7c3aed] bg-white object-cover" 
                    />
                    <div className="text-lg italic mt-2">This certifies that</div>
                    <div className="text-2xl font-bold text-white mt-2">{supporterName}</div>
                    <div className="text-lg italic mt-2">has supported Covion Partners</div>
                    <div className="text-xl font-semibold text-[#7c3aed] mt-2">Certificate Number: CP-{createdToken.tokenNumber}</div>
                    <div className="text-base text-gray-300 mt-2">on {date}</div>
                    <div className="text-sm text-[#ec4899] mt-6 font-bold">Covion Partners</div>
                    <Button className="mt-6 w-full" onClick={handleDownloadCertificate}>
                      Download Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Token Card */}
              <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-center text-3xl font-serif tracking-wide mb-2 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
                    Digital Token
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-8">
                  <div id="covion-token-image" className="flex flex-col items-center justify-center" style={{ width: 240, height: 320 }}>
                    <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 240, height: 320, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
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
                      <text x="50%" y="240" textAnchor="middle" fontSize="160" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">TOKEN</text>
                      <text x="50%" y="380" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="8">COVION PARTNERS</text>
                      <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                      <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                      <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">CP-{createdToken.tokenNumber}</text>
                      <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Serial Number</text>
                    </svg>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    Serial: CP-{createdToken.tokenNumber}
                  </div>
                  <Button className="mt-6 w-full" onClick={handleDownloadToken}>
                    Download Token
                  </Button>
                </CardContent>
              </Card>
            </div>
            <Button className="mt-4 w-full" onClick={handleSaveCertificate} disabled={!selectedProjectId || creating}>
              Save Certificate Info
            </Button>
          </>
        )}
      </div>
    </div>
  )
} 
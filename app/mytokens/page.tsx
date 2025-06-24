"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

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
      // Fetch both tokens and certificates (public_supports) created by this user
      const { data, error } = await supabase
        .from('public_supports')
        .select(`
          id, 
          project_id, 
          certificate_number, 
          token_serial, 
          certificate_title,
          supporter_name,
          issued_at,
          amount, 
          created_at, 
          metadata, 
          message,
          project:projects(name)
        `)
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
    const token = tokens.find(t => t.id === tokenId)
    if (!token) return
    
    const serialNumber = token.certificate_number || token.token_serial || token.metadata?.token_number || 'CP-XXXXXX'
    
    // Create a canvas element
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size (high resolution for better quality)
    canvas.width = 1600
    canvas.height = 2240
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1600, 2240)
    gradient.addColorStop(0, '#4f46e5')
    gradient.addColorStop(0.5, '#7c3aed')
    gradient.addColorStop(1, '#ffffff')
    
    // Draw background
    ctx.fillStyle = gradient
    ctx.fillRect(40, 40, 1520, 2160)
    
    // Draw border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 16
    ctx.beginPath()
    ctx.roundRect(40, 40, 1520, 2160, 80)
    ctx.stroke()
    
    // Add shine effect
    const radialGradient = ctx.createRadialGradient(800, 672, 0, 800, 672, 1568)
    radialGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
    radialGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = radialGradient
    ctx.fillRect(40, 40, 1520, 2160)
    
    // Draw "TOKEN" text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 160px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = '8px'
    ctx.fillText('TOKEN', 800, 240)
    
    // Draw "COVION PARTNERS" text
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 72px Arial'
    ctx.fillText('COVION PARTNERS', 800, 380)
    
    // Draw circle for logo
    ctx.fillStyle = '#141414'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.arc(800, 1100, 400, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    
    // Load and draw the logo image
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function() {
      // Draw the image in the circle
      ctx.save()
      ctx.beginPath()
      ctx.arc(800, 1100, 400, 0, 2 * Math.PI)
      ctx.clip()
      ctx.drawImage(img, 400, 700, 800, 800)
      ctx.restore()
      
      // Add drop shadow effect
      ctx.shadowColor = '#7c3aed'
      ctx.shadowBlur = 24
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Draw serial number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 80px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'transparent' // Reset shadow for text
      ctx.shadowBlur = 0
      ctx.fillText(serialNumber, 800, 2000)
      
      // Draw "Serial Number" text
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 48px Arial'
      ctx.fillText('Serial Number', 800, 2100)
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `token-${serialNumber}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }
    
    img.onerror = function() {
      // If image fails to load, still create the token without it
      // Draw serial number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 80px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(serialNumber, 800, 2000)
      
      // Draw "Serial Number" text
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 48px Arial'
      ctx.fillText('Serial Number', 800, 2100)
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `token-${serialNumber}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }
    
    img.src = TOKEN_IMAGE_URL
  }

  const handleDownloadCertificate = (token: any) => {
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
      doc.text(token.supporter_name || 'Supporter', 421, 210, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(18)
      doc.setTextColor('#fff')
      doc.text('has supported Covion Partners', 421, 250, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(24)
      doc.setTextColor('#7c3aed')
      
      // Get the certificate number with fallbacks
      const certNumber = token.certificate_number || 
                        (token.token_serial ? `CP-${token.token_serial}` : '') ||
                        (token.metadata?.token_number ? `CP-${token.metadata.token_number}` : '') ||
                        'CP-XXXXXX'
      
      doc.text(`Certificate Number: ${certNumber}`, 421, 290, { align: 'center' })
      doc.setFontSize(16)
      doc.setTextColor('#fff')
      const date = token.issued_at ? new Date(token.issued_at).toLocaleDateString() : 
                   token.created_at ? new Date(token.created_at).toLocaleDateString() : 
                   new Date().toLocaleDateString()
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
      
      // Add project name if available
      if (token.project?.name) {
        doc.setFont('times', 'bold')
        doc.setFontSize(16)
        doc.setTextColor('#fff')
        doc.text(`Project: ${token.project.name}`, 421, 480, { align: 'center' })
      }
      
      // Add amount if available
      if (token.amount) {
        doc.setFont('times', 'bold')
        doc.setFontSize(16)
        doc.setTextColor('#7c3aed')
        doc.text(`Amount: $${token.amount}`, 421, 500, { align: 'center' })
      }
      
      const filename = `certificate-${certNumber}.pdf`
      doc.save(filename)
    }
    
    img.onerror = function() {
      // If image fails to load, still create the certificate without it
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
      doc.text(token.supporter_name || 'Supporter', 421, 210, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(18)
      doc.setTextColor('#fff')
      doc.text('has supported Covion Partners', 421, 250, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(24)
      doc.setTextColor('#7c3aed')
      
      const certNumber = token.certificate_number || 
                        (token.token_serial ? `CP-${token.token_serial}` : '') ||
                        (token.metadata?.token_number ? `CP-${token.metadata.token_number}` : '') ||
                        'CP-XXXXXX'
      
      doc.text(`Certificate Number: ${certNumber}`, 421, 290, { align: 'center' })
      doc.setFontSize(16)
      doc.setTextColor('#fff')
      const date = token.issued_at ? new Date(token.issued_at).toLocaleDateString() : 
                   token.created_at ? new Date(token.created_at).toLocaleDateString() : 
                   new Date().toLocaleDateString()
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
      
      if (token.project?.name) {
        doc.setFont('times', 'bold')
        doc.setFontSize(16)
        doc.setTextColor('#fff')
        doc.text(`Project: ${token.project.name}`, 421, 480, { align: 'center' })
      }
      
      if (token.amount) {
        doc.setFont('times', 'bold')
        doc.setFontSize(16)
        doc.setTextColor('#7c3aed')
        doc.text(`Amount: $${token.amount}`, 421, 500, { align: 'center' })
      }
      
      const filename = `certificate-${certNumber}.pdf`
      doc.save(filename)
    }
  }

  const isCertificate = (token: any) => {
    return token.certificate_title || token.supporter_name || token.issued_at
  }

  // Add a delete handler
  const handleDeleteToken = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to delete this token/certificate? This action cannot be undone.')) return;
    setLoading(true);
    const { error } = await supabase
      .from('public_supports')
      .delete()
      .eq('id', tokenId);
    if (error) {
      alert('Failed to delete token/certificate.');
    } else {
      setTokens(tokens.filter(t => t.id !== tokenId));
    }
    setLoading(false);
  };

  // Add a helper to mask the token number
  function maskTokenNumber(tokenNumber: string) {
    if (!tokenNumber) return '';
    // Remove CP- prefix if present
    const prefix = tokenNumber.startsWith('CP-') ? 'CP-' : '';
    const num = tokenNumber.replace('CP-', '');
    if (num.length <= 3) return prefix + num;
    return prefix + '*'.repeat(num.length - 3) + num.slice(-3);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white">
            Back
          </Button>
          <h1 className="text-2xl font-bold">My Tokens & Certificates</h1>
        </div>
        {tokens.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>No Tokens or Certificates Found</CardTitle>
              <CardDescription>You haven't created any tokens or certificates yet.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map(token => {
              const isCert = isCertificate(token)
              return (
                <Card key={token.id} className={`border-${isCert ? 'purple' : 'blue'}-500/20`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {isCert ? 'Certificate' : 'Token'}
                      </CardTitle>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isCert ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {isCert ? 'Certificate' : 'Token'}
                      </span>
                    </div>
                    <CardDescription>
                      {token.certificate_number || token.token_serial || 'Token'}
                    </CardDescription>
                    <div className="text-lg font-bold text-white mt-2 mb-1">
                      {token.project?.name ? token.project.name : `Project ID: ${token.project_id}`}
                    </div>
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
                      {/* Certificate preview below token image */}
                      {isCert && (
                        <div
                          className="mt-4 mb-2 rounded-2xl shadow-lg border-2 border-purple-500 bg-[#141414] flex flex-col items-center justify-center relative"
                          style={{ width: 220, height: 120, padding: 10 }}
                        >
                          {/* Border and background mimic */}
                          <div className="absolute inset-0 rounded-2xl border-2 border-purple-500 pointer-events-none" style={{ zIndex: 1 }} />
                          {/* Handshake logo */}
                          <div className="absolute left-3 top-3" style={{ zIndex: 2 }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="16" r="16" fill="#141414" />
                              <path d="M7.5 13.5L10 16C10.5 16.5 11.5 16.5 12 16L16.5 11.5C17 11 17 10 16.5 9.5L15 8C14.5 7.5 13.5 7.5 13 8L8.5 12.5C8 13 8 13.5 7.5 13.5Z" stroke="#a78bfa" strokeWidth="1.5" fill="none"/>
                            </svg>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full h-full" style={{ zIndex: 2 }}>
                            <div className="text-xs font-bold text-purple-400 text-center mb-1">Certificate of Support</div>
                            <div className="text-[10px] italic text-white text-center">This certifies that</div>
                            <div className="text-xs font-bold text-white text-center mt-0.5">{token.supporter_name || 'Supporter'}</div>
                            <div className="text-[10px] italic text-white text-center mt-0.5">has supported Covion Partners</div>
                            <div className="text-xs font-bold text-purple-400 text-center mt-0.5">{token.certificate_number || (token.token_serial ? `CP-${token.token_serial}` : '')}</div>
                            <div className="text-[9px] text-white text-center mt-0.5">{token.issued_at ? new Date(token.issued_at).toLocaleDateString() : token.created_at ? new Date(token.created_at).toLocaleDateString() : ''}</div>
                            <div className="text-[9px] font-bold text-white text-center mt-0.5">Covion Partners</div>
                            <div className="text-[8px] italic text-pink-400 text-center mt-0.5">Thank you for your support!</div>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-300 mt-1">
                        Serial: {maskTokenNumber(token.certificate_number || (token.token_serial ? `CP-${token.token_serial}` : ''))}
                      </div>
                      <div className="flex gap-2 mt-4 w-full">
                        <Button 
                          className="flex-1" 
                          onClick={() => handleDownloadToken(token.id)}
                          variant="outline"
                        >
                          Download Token
                        </Button>
                        {isCert && (
                          <Button 
                            className="flex-1" 
                            onClick={() => handleDownloadCertificate(token)}
                            variant="outline"
                          >
                            Download Certificate
                          </Button>
                        )}
                      </div>
                      <Button
                        className="flex-1 mt-2"
                        onClick={() => handleDeleteToken(token.id)}
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                    
                    {/* Certificate-specific information */}
                    {isCert && token.supporter_name && (
                      <div className="text-sm text-gray-500 mb-2">
                        Supporter: <span className="font-bold text-black">{token.supporter_name}</span>
                      </div>
                    )}
                    
                    {isCert && token.certificate_title && (
                      <div className="text-sm text-gray-500 mb-2">
                        Title: <span className="font-bold text-black">{token.certificate_title}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-500 mb-2">
                      Amount: <span className="font-bold text-black">${token.amount}</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Created: {token.created_at ? new Date(token.created_at).toLocaleString() : ''}
                    </div>
                    
                    {isCert && token.issued_at && (
                      <div className="text-xs text-gray-400">
                        Issued: {new Date(token.issued_at).toLocaleString()}
                      </div>
                    )}
                    
                    {token.metadata?.token_number && (
                      <div className="text-xs text-gray-400 mt-2">
                        Token Number: {maskTokenNumber(token.metadata.token_number)}
                      </div>
                    )}
                    
                    {token.message && (
                      <div className="text-xs text-gray-400 mt-2">
                        Message: {token.message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Handshake, Users, Briefcase } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDeals } from "@/hooks/useDeals"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function NegotiatePage() {
  const { user } = useAuth()
  const { deals, loading } = useDeals()
  const { projects: allProjects, loading: projectsLoading } = useProjects()
  const [selectedDealId, setSelectedDealId] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const router = useRouter()
  const [showRequestDoc, setShowRequestDoc] = useState(false)
  const [requestedDoc, setRequestedDoc] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [requirements, setRequirements] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  // Filter deals in 'negotiate' or 'negotiation' status
  const negotiateDeals = (deals || []).filter(d => d.status === "negotiate" || d.status === "negotiation")
  const selectedDeal = negotiateDeals.find(d => d.id === selectedDealId)

  // Placeholder: fetch negotiation messages for the selected deal
  useEffect(() => {
    if (selectedDealId) {
      // TODO: Fetch negotiation messages for the deal
      setMessages([
        { sender: "You", text: "Let's discuss the terms.", time: "10:00 AM" },
        { sender: "Partner", text: "Can we adjust the timeline?", time: "10:02 AM" }
      ])
    } else {
      setMessages([])
    }
  }, [selectedDealId])

  const handleSend = () => {
    if (!message.trim()) return
    setMessages([...messages, { sender: "You", text: message, time: new Date().toLocaleTimeString() }])
    setMessage("")
    // TODO: Persist message to backend
  }

  // Group deals by project, using project_id and project name from user's projects
  const projectsWithNegotiationDeals = negotiateDeals.reduce((acc, deal) => {
    const project = allProjects?.find((p: any) => p.id === deal.project_id)
    const projectId = deal.project_id || 'unknown'
    const projectName = project ? project.name : 'Unknown Project'
    if (!acc[projectId]) {
      acc[projectId] = { projectId, projectName, deals: [] }
    }
    acc[projectId].deals.push(deal)
    return acc
  }, {} as Record<string, { projectId: string, projectName: string, deals: any[] }>)
  const projectGroups: { projectId: string, projectName: string, deals: any[] }[] = Object.values(projectsWithNegotiationDeals)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0])
      // TODO: Upload file to backend
    }
  }

  const handleRequestDoc = () => {
    // TODO: Send document request to backend
    setShowRequestDoc(false)
    setRequestedDoc("")
  }

  const handleSaveRequirements = () => {
    // TODO: Save requirements to backend
  }

  const handleSignatureSave = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL()
    setSignatureData(dataUrl)
    // TODO: Upload signature to backend
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 py-10">
      <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-lg bg-gray-900 border border-gray-800">
        <CardHeader className="bg-gradient-to-r from-green-700 to-emerald-700 p-6 flex items-center gap-4">
          <Handshake className="w-8 h-8 text-white" />
          <CardTitle className="text-2xl text-white font-bold">Deal Negotiation</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Projects with Negotiation Deals */}
          <div>
            <label className="block text-white font-semibold mb-2">Projects with Negotiation Deals</label>
            {projectGroups.length === 0 ? (
              <div className="text-gray-400">No projects with deals in negotiation.</div>
            ) : (
              <div className="space-y-4">
                {projectGroups.map((group: { projectId: string, projectName: string, deals: any[] }) => (
                  <div key={group.projectId} className="bg-gray-800 rounded-lg p-4 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                      <span className="text-lg font-semibold text-white">{group.projectName}</span>
                    </div>
                    <div className="space-y-2">
                      {group.deals.map((deal: any) => (
                        <div key={deal.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={deal.id}
                            name="selectedDeal"
                            value={deal.id}
                            checked={selectedDealId === deal.id}
                            onChange={() => setSelectedDealId(deal.id)}
                            className="accent-green-500"
                          />
                          <label htmlFor={deal.id} className="text-white cursor-pointer">
                            {deal.title} <span className="text-gray-400 text-xs">({deal.status})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deal/Project Info */}
          {selectedDeal && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-white">{selectedDeal.project_name || 'Unknown Project'}</span>
              </div>
              <div className="text-white font-semibold mb-1">{selectedDeal.title}</div>
              <div className="text-gray-300 mb-1">{selectedDeal.description}</div>
              <div className="flex gap-4 text-gray-400 text-sm">
                <span><Users className="inline w-4 h-4 mr-1" /> Participants: {selectedDeal.participants?.length || 0}</span>
                <span>Status: <span className="capitalize text-green-400">{selectedDeal.status}</span></span>
              </div>
            </div>
          )}

          {/* Negotiation Chat Area */}
          {selectedDeal && (
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col gap-4">
              <div className="font-semibold text-white mb-2 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" /> Negotiation Messages
              </div>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-2">
                {messages.length === 0 ? (
                  <div className="text-gray-400">No messages yet. Start the negotiation!</div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                      <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender === "You" ? "bg-green-600 text-white" : "bg-gray-700 text-gray-200"}`}>
                        <div className="text-xs font-bold mb-1">{msg.sender}</div>
                        <div>{msg.text}</div>
                        <div className="text-xs text-gray-300 mt-1 text-right">{msg.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                />
                <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700">Send</Button>
              </div>
            </div>
          )}

          {selectedDeal && (
            <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4">Deal Actions</h3>
              {/* Request Document */}
              <Dialog open={showRequestDoc} onOpenChange={setShowRequestDoc}>
                <DialogTrigger asChild>
                  <Button className="mb-2">Request Document</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request a Document</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Document name or type (e.g. ID, Contract)"
                    value={requestedDoc}
                    onChange={e => setRequestedDoc(e.target.value)}
                  />
                  <Button onClick={handleRequestDoc} className="mt-2">Send Request</Button>
                </DialogContent>
              </Dialog>
              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">Upload File</label>
                <input type="file" onChange={handleFileChange} className="text-white" />
                {uploadedFile && <div className="text-green-400 mt-1">Selected: {uploadedFile.name}</div>}
              </div>
              {/* Requirements Form */}
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">Set Requirements</label>
                <Textarea
                  placeholder="Enter requirements for this deal..."
                  value={requirements}
                  onChange={e => setRequirements(e.target.value)}
                  className="mb-2"
                />
                <Button onClick={handleSaveRequirements}>Save Requirements</Button>
              </div>
              {/* Signature Pad */}
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">Sign Document</label>
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={100}
                  style={{ background: '#222', borderRadius: 8, border: '1px solid #444', cursor: 'crosshair' }}
                  onMouseDown={e => {
                    const ctx = canvasRef.current?.getContext('2d')
                    if (ctx) {
                      ctx.beginPath()
                      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
                    }
                  }}
                  onMouseMove={e => {
                    if (e.buttons !== 1) return
                    const ctx = canvasRef.current?.getContext('2d')
                    if (ctx) {
                      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
                      ctx.strokeStyle = '#fff'
                      ctx.lineWidth = 2
                      ctx.stroke()
                    }
                  }}
                />
                <Button onClick={handleSignatureSave} className="mt-2">Save Signature</Button>
                {signatureData && <div className="mt-2"><img src={signatureData} alt="Signature preview" className="border border-gray-700 rounded" /></div>}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  )
} 
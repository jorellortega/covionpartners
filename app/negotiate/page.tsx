"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Handshake, Users, Briefcase, Plus, Image, Video, FileText, Link as LinkIcon, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDeals } from "@/hooks/useDeals"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NegotiatePage() {
  const { user } = useAuth()
  const { deals, loading } = useDeals()
  const { projects: allProjects, loading: projectsLoading } = useProjects()
  const [selectedDealId, setSelectedDealId] = useState("")
  const router = useRouter()
  const [showRequestDoc, setShowRequestDoc] = useState(false)
  const [requestedDoc, setRequestedDoc] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [requirements, setRequirements] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [customFields, setCustomFields] = useState<Array<{
    id: string;
    type: 'text' | 'file' | 'image' | 'video' | 'link';
    label: string;
    value: string | File | null;
  }>>([])
  const [newCustomField, setNewCustomField] = useState<{
    type: 'text' | 'file' | 'image' | 'video' | 'link';
    label: string;
  }>({
    type: 'text',
    label: '',
  })
  const [isAddingCustomField, setIsAddingCustomField] = useState(false)

  const negotiateDeals = (deals || []).filter(d => d.status === "negotiate" || d.status === "negotiation")
  const selectedDeal = negotiateDeals.find(d => d.id === selectedDealId)

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
    }
  }

  const handleRequestDoc = () => {
    setShowRequestDoc(false)
    setRequestedDoc("")
  }

  const handleSaveRequirements = () => {
  }

  const handleSignatureSave = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL()
    setSignatureData(dataUrl)
  }

  const handleAddCustomField = () => {
    if (newCustomField.label.trim()) {
      setCustomFields([...customFields, {
        id: Date.now().toString(),
        ...newCustomField,
        value: null
      }])
      setNewCustomField({ type: 'text', label: '' })
      setIsAddingCustomField(false)
    }
  }

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id))
  }

  const handleCustomFieldChange = (id: string, value: string | File) => {
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, value } : field
    ))
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="w-full max-w-full md:max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="border-gray-800 bg-black mb-8">
          <CardHeader className="bg-gradient-to-r from-green-700 to-emerald-700 p-6 flex items-center gap-4 rounded-t-lg">
            <Handshake className="w-8 h-8 text-white" />
            <CardTitle className="text-2xl text-white font-bold">Deal Negotiation</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Projects Section */}
            <div className="space-y-4">
              <label className="block text-white font-semibold mb-2 text-lg">Projects with Negotiation Deals</label>
              {projectGroups.length === 0 ? (
                <div className="text-gray-400">No projects with deals in negotiation.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectGroups.map((group: { projectId: string, projectName: string, deals: any[] }) => (
                    <div key={group.projectId} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                        <span className="text-lg font-semibold text-white">{group.projectName}</span>
                      </div>
                      <div className="space-y-2">
                        {group.deals.map((deal: any) => (
                          <div key={deal.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800/50 transition-colors">
                            <input
                              type="radio"
                              id={deal.id}
                              name="selectedDeal"
                              value={deal.id}
                              checked={selectedDealId === deal.id}
                              onChange={() => setSelectedDealId(deal.id)}
                              className="accent-green-500"
                            />
                            <label htmlFor={deal.id} className="text-white cursor-pointer flex-1">
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

            {selectedDeal && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Deal Details Section */}
                <Card className="bg-gray-900/50 border border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                      <span className="text-lg font-semibold text-white">{selectedDeal.project_name || 'Unknown Project'}</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{selectedDeal.title}</h3>
                        <p className="text-gray-300">{selectedDeal.description}</p>
                      </div>
                      <div className="flex gap-4 text-gray-400 text-sm">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {selectedDeal.participants?.length || 0} Participants</span>
                        <span className="flex items-center gap-1">Status: <span className="capitalize text-green-400">{selectedDeal.status}</span></span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements Section */}
                <Card className="bg-gray-900/50 border border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Proof of Identity */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Upload proof of identity (ID)</h3>
                              <p className="text-sm text-gray-400">Required for verification purposes</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                            <input 
                              type="file" 
                              accept="image/*,application/pdf" 
                              onChange={handleFileChange}
                              className="text-xs text-white w-full sm:w-36"
                            />
                            {uploadedFile && (
                              <span className="text-green-400 text-xs truncate max-w-[100px]">
                                {uploadedFile.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Upload File */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Upload file (doc, pdf, etc.)</h3>
                              <p className="text-sm text-gray-400">Supporting documents for the deal</p>
                            </div>
                          </div>
                          <input 
                            type="file" 
                            accept=".pdf,.doc,.docx,.txt,image/*" 
                            onChange={handleFileChange}
                            className="text-xs text-white w-full sm:w-36"
                          />
                        </div>
                      </div>

                      {/* Sign Form */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Sign form</h3>
                              <p className="text-sm text-gray-400">Digital signature required</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="px-3 py-1 text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20" 
                            onClick={() => {
                              const canvas = canvasRef.current;
                              if (canvas) canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          >
                            Sign
                          </Button>
                        </div>
                      </div>

                      {/* Fill Form */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                            </div>
                            <div>
                              <h3 className="text-white font-medium">Fill out required form</h3>
                              <p className="text-sm text-gray-400">Additional information needed</p>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="px-3 py-1 text-xs border-pink-500/50 text-pink-400 hover:bg-pink-500/20"
                            onClick={() => {
                              const textarea = document.getElementById('requirements-textarea');
                              if (textarea) textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                          >
                            Fill Out
                          </Button>
                        </div>
                      </div>

                      {/* Custom Fields */}
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-medium">Custom Fields</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            className="px-3 py-1 text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                            onClick={() => setIsAddingCustomField(true)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Field
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {customFields.map((field) => (
                            <div key={field.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-white font-medium">{field.label}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-400"
                                  onClick={() => handleRemoveCustomField(field.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              {field.type === 'text' && (
                                <Input
                                  type="text"
                                  value={field.value as string || ''}
                                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                  className="bg-gray-800 border-gray-700"
                                />
                              )}
                              
                              {field.type === 'file' && (
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    onChange={(e) => e.target.files?.[0] && handleCustomFieldChange(field.id, e.target.files[0])}
                                    className="text-xs text-white w-full"
                                  />
                                  {field.value && (
                                    <span className="text-green-400 text-xs">
                                      {(field.value as File).name}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {field.type === 'image' && (
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleCustomFieldChange(field.id, e.target.files[0])}
                                    className="text-xs text-white w-full"
                                  />
                                  {field.value && (
                                    <div className="mt-2">
                                      <img 
                                        src={URL.createObjectURL(field.value as File)} 
                                        alt="Preview" 
                                        className="max-h-32 rounded-lg border border-gray-700"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {field.type === 'video' && (
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => e.target.files?.[0] && handleCustomFieldChange(field.id, e.target.files[0])}
                                    className="text-xs text-white w-full"
                                  />
                                  {field.value && (
                                    <div className="mt-2">
                                      <video 
                                        src={URL.createObjectURL(field.value as File)} 
                                        controls
                                        className="max-h-32 rounded-lg border border-gray-700"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {field.type === 'link' && (
                                <Input
                                  type="url"
                                  placeholder="Enter URL"
                                  value={field.value as string || ''}
                                  onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                  className="bg-gray-800 border-gray-700"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Add Custom Field Dialog */}
                    <Dialog open={isAddingCustomField} onOpenChange={setIsAddingCustomField}>
                      <DialogContent className="bg-gray-900 border-gray-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add Custom Field</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-white">Field Label</Label>
                            <Input
                              value={newCustomField.label}
                              onChange={(e) => setNewCustomField({ ...newCustomField, label: e.target.value })}
                              className="bg-gray-800 border-gray-700"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Field Type</Label>
                            <Select
                              value={newCustomField.type}
                              onValueChange={(value) => setNewCustomField({ ...newCustomField, type: value as any })}
                            >
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="text" className="text-white">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Text
                                  </div>
                                </SelectItem>
                                <SelectItem value="file" className="text-white">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    File
                                  </div>
                                </SelectItem>
                                <SelectItem value="image" className="text-white">
                                  <div className="flex items-center gap-2">
                                    <Image className="w-4 h-4" />
                                    Image
                                  </div>
                                </SelectItem>
                                <SelectItem value="video" className="text-white">
                                  <div className="flex items-center gap-2">
                                    <Video className="w-4 h-4" />
                                    Video
                                  </div>
                                </SelectItem>
                                <SelectItem value="link" className="text-white">
                                  <div className="flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" />
                                    Link
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsAddingCustomField(false)}
                              className="border-gray-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddCustomField}
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              Add Field
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Signature Section */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-6">
                      <h3 className="text-white font-medium mb-3">Signature</h3>
                      <canvas
                        ref={canvasRef}
                        width={250}
                        height={60}
                        style={{ background: '#222', borderRadius: 6, border: '1px solid #444', cursor: 'crosshair', width: '100%', maxWidth: 250 }}
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
                      <div className="flex items-center gap-2 mt-3">
                        <Button onClick={handleSignatureSave} size="sm" variant="outline" className="px-3 py-1 text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20">
                          Save Signature
                        </Button>
                        {signatureData && (
                          <img src={signatureData} alt="Signature preview" className="border border-gray-700 rounded max-w-[120px]" />
                        )}
                      </div>
                    </div>

                    {/* Form Section */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-6">
                      <h3 className="text-white font-medium mb-3">Required Information</h3>
                      <Textarea
                        id="requirements-textarea"
                        placeholder="Enter required information..."
                        value={requirements}
                        onChange={e => setRequirements(e.target.value)}
                        className="mb-3 text-sm"
                        rows={3}
                      />
                      <Button onClick={handleSaveRequirements} size="sm" variant="outline" className="px-3 py-1 text-xs border-pink-500/50 text-pink-400 hover:bg-pink-500/20">
                        Save Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
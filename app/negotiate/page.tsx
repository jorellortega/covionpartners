"use client"

import { useState, useRef, useEffect } from "react"
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
  const [dealRequirements, setDealRequirements] = useState<any[]>([])
  const supabase = createClientComponentClient()
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [customFieldUploads, setCustomFieldUploads] = useState<Record<string, File | null>>({})
  const [customFieldUploading, setCustomFieldUploading] = useState<Record<string, boolean>>({})
  const [uploadedAttachments, setUploadedAttachments] = useState<Record<string, any[]>>({})

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

  useEffect(() => {
    const fetchRequirements = async () => {
      if (!selectedDealId) return
      const { data, error } = await supabase
        .from("deal_requirements")
        .select(`
          id,
          custom_label,
          custom_description,
          required,
          requirement_templates (
            type,
            label,
            description
          )
        `)
        .eq("deal_id", selectedDealId)
      if (!error && data) {
        setDealRequirements(data)
        console.log('Fetched requirements:', data)
      } else {
        console.error('Error fetching requirements:', error)
      }
    }
    fetchRequirements()
  }, [selectedDealId])

  const fetchAttachments = async () => {
    if (!selectedDealId || !user) return
    const { data, error } = await supabase
      .from('deal_attachments')
      .select('*')
      .eq('deal_id', selectedDealId)
      .eq('user_id', user.id)
    if (!error && data) {
      // Group by requirement/custom field if you want
      setUploadedAttachments(
        data.reduce((acc: Record<string, any[]>, att: any) => {
          // If you store requirement_id or custom_field_id, use it here
          // For now, group all under 'all'
          const key = att.requirement_id || att.custom_field_id || 'all'
          acc[key] = acc[key] || []
          acc[key].push(att)
          return acc
        }, {})
      )
    }
  }

  useEffect(() => {
    fetchAttachments()
  }, [selectedDealId, user])

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

  const handleRequirementFileChange = (requirementId: string, file: File | null) => {
    setFileUploads(prev => ({ ...prev, [requirementId]: file }))
  }

  const handleRequirementFileUpload = async (requirementId: string) => {
    const file = fileUploads[requirementId]
    if (!file || !user || !selectedDealId) return
    setUploading(prev => ({ ...prev, [requirementId]: true }))
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `deal-requirements/${selectedDealId}/${requirementId}/${fileName}`
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file)
      if (uploadError) throw uploadError
      // 2. Save to deal_attachments
      const { data: attachment, error: attachError } = await supabase.from('deal_attachments').insert({
        deal_id: selectedDealId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
      }).select().single()
      if (attachError) throw attachError
      // 3. Save to requirement_responses
      const { error: respError } = await supabase.from('requirement_responses').insert({
        deal_requirement_id: requirementId,
        user_id: user.id,
        file_attachment_id: attachment.id
      })
      if (respError) throw respError
      // Optionally, show success feedback
      setFileUploads(prev => ({ ...prev, [requirementId]: null }))
      // Optionally, refresh responses
      await fetchAttachments()
    } catch (err) {
      // Optionally, show error feedback
      console.error('File upload error:', err)
    } finally {
      setUploading(prev => ({ ...prev, [requirementId]: false }))
    }
  }

  const handleCustomFieldFileChange = (fieldId: string, file: File | null) => {
    setCustomFieldUploads(prev => ({ ...prev, [fieldId]: file }))
  }

  const handleCustomFieldFileUpload = async (fieldId: string) => {
    const file = customFieldUploads[fieldId]
    if (!file || !user || !selectedDealId) return
    setCustomFieldUploading(prev => ({ ...prev, [fieldId]: true }))
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `deal-custom-fields/${selectedDealId}/${fieldId}/${fileName}`
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: attachment, error: attachError } = await supabase.from('deal_attachments').insert({
        deal_id: selectedDealId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
      }).select().single()
      if (attachError) throw attachError
      // Optionally, save to a custom field responses table if you have one
      setCustomFieldUploads(prev => ({ ...prev, [fieldId]: null }))
      await fetchAttachments()
    } catch (err) {
      console.error('Custom field file upload error:', err)
    } finally {
      setCustomFieldUploading(prev => ({ ...prev, [fieldId]: false }))
    }
  }

  const handleCustomFieldSave = async (field: any) => {
    if (!user || !selectedDealId) return
    try {
      let insertData: any = {
        deal_id: selectedDealId,
        user_id: user.id,
        custom_field_id: field.id,
        created_at: new Date().toISOString()
      }

      if (field.type === 'text' || field.type === 'link') {
        if (!field.value) {
          alert('Please enter a value before saving!')
          return
        }
        insertData.file_name = field.value
        insertData.file_type = field.type
        insertData.file_size = 0 // Set file_size to 0 for text/link
        insertData.file_path = `text-link-fields/${selectedDealId}/${field.id}/${Date.now()}.txt`
      } else if (field.type === 'file' || field.type === 'image' || field.type === 'video') {
        const lastUpload = customFieldUploads[field.id]
        if (!lastUpload) {
          alert('Please upload the file first!')
          return
        }
        const { data: attachments } = await supabase
          .from('deal_attachments')
          .select('*')
          .eq('deal_id', selectedDealId)
          .eq('user_id', user.id)
          .eq('custom_field_id', field.id)
          .order('created_at', { ascending: false })
          .limit(1)
        const lastAttachment = attachments && attachments[0]
        if (!lastAttachment || !lastAttachment.file_path) {
          alert('Please upload the file first!')
          return
        }
        insertData.file_name = lastUpload.name
        insertData.file_type = lastUpload.type
        insertData.file_size = lastUpload.size
        insertData.file_path = lastAttachment.file_path
      }

      console.log('Trying to insert into deal_attachments:', insertData)
      const { error } = await supabase.from('deal_attachments').insert(insertData)
      if (error) {
        console.error('Insert error:', error, 'Insert data:', insertData)
        alert('Insert error: ' + (error.message || JSON.stringify(error)))
        throw error
      }
      await fetchAttachments()
    } catch (err) {
      console.error('Custom field save error:', err)
    }
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
                <div className="grid grid-cols-1 gap-4">
                  {projectGroups.map((group: { projectId: string, projectName: string, deals: any[] }) => (
                    <div key={group.projectId} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <Briefcase className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <span className="text-lg font-semibold text-white break-words">{group.projectName}</span>
                      </div>
                      <div className="space-y-2">
                        {group.deals.map((deal: any) => (
                          <div key={deal.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-800/50 transition-colors">
                            <input
                              type="radio"
                              id={deal.id}
                              name="selectedDeal"
                              value={deal.id}
                              checked={selectedDealId === deal.id}
                              onChange={() => setSelectedDealId(deal.id)}
                              className="accent-green-500 mt-1 flex-shrink-0"
                            />
                            <label htmlFor={deal.id} className="text-white cursor-pointer flex-1">
                              <div className="break-words">{deal.title}</div>
                              <span className="text-gray-400 text-xs block mt-1">({deal.status})</span>
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
                      {dealRequirements.length === 0 && (
                        <div className="text-gray-400">No requirements found for this deal.</div>
                      )}
                      {dealRequirements.map((req) => {
                        const type = req.requirement_templates?.type
                        const label = req.custom_label || req.requirement_templates?.label
                        const description = req.custom_description || req.requirement_templates?.description
                        return (
                          <div key={req.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:bg-gray-800/70 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                </div>
                                <div>
                                  <h3 className="text-white font-medium">{label}</h3>
                                  <p className="text-sm text-gray-400">{description}</p>
                                </div>
                              </div>
                              {type === 'file' && (
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="file"
                                    className="text-xs text-white w-full sm:w-36"
                                    onChange={e => handleRequirementFileChange(req.id, e.target.files?.[0] || null)}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleRequirementFileUpload(req.id)}
                                    disabled={uploading[req.id] || !fileUploads[req.id]}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {uploading[req.id] ? 'Uploading...' : 'Upload'}
                                  </Button>
                                </div>
                              )}
                              {type === 'text' && (
                                <Input type="text" className="bg-gray-800 border-gray-700" onChange={e => {/* handle text change */}} />
                              )}
                              {type === 'signature' && (
                                <Button size="sm" variant="outline" className="px-3 py-1 text-xs border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20" onClick={() => { const canvas = canvasRef.current; if (canvas) canvas.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Sign</Button>
                              )}
                              {type === 'link' && (
                                <Input type="url" className="bg-gray-800 border-gray-700" onChange={e => {/* handle link change */}} />
                              )}
                            </div>
                            {uploadedAttachments[req.id]?.map(att => (
                              <div key={att.id} className="mt-2 text-xs text-green-400">
                                {att.file_type === 'text' && (
                                  <div>
                                    <span className="font-semibold text-white">Text:</span> <span className="text-green-300">{att.file_name}</span>
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {att.file_type === 'link' && (
                                  <div>
                                    <span className="font-semibold text-white">Link:</span> <a href={att.file_name} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{att.file_name}</a>
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {(att.file_type === 'file' || att.file_type === 'application/pdf') && (
                                  <div>
                                    <span className="font-semibold text-white">File:</span> <a href={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} target="_blank" rel="noopener noreferrer" className="underline">{att.file_name}</a>
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {att.file_type?.startsWith('image') && (
                                  <div>
                                    <span className="font-semibold text-white">Image:</span> <span className="text-green-300">{att.file_name}</span>
                                    <img src={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} alt={att.file_name} className="max-h-24 mt-1 rounded border border-gray-700" />
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {att.file_type?.startsWith('video') && (
                                  <div>
                                    <span className="font-semibold text-white">Video:</span> <span className="text-green-300">{att.file_name}</span>
                                    <video src={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} controls className="max-h-24 mt-1 rounded border border-gray-700" />
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })}
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
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="text"
                                  value={field.value as string || ''}
                                  onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                  className="bg-gray-800 border-gray-700"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldSave(field)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Save
                                </Button>
                              </div>
                            )}
                            
                            {field.type === 'file' && (
                              <div className="space-y-2 flex items-center gap-2">
                                <input
                                  type="file"
                                  onChange={e => e.target.files?.[0] && handleCustomFieldFileChange(field.id, e.target.files[0])}
                                  className="text-xs text-white w-full"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldFileUpload(field.id)}
                                  disabled={customFieldUploading[field.id] || !customFieldUploads[field.id]}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {customFieldUploading[field.id] ? 'Uploading...' : 'Upload'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldSave(field)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Save
                                </Button>
                                {field.value && (
                                  <span className="text-green-400 text-xs">{(field.value as File).name}</span>
                                )}
                              </div>
                            )}
                            
                            {field.type === 'image' && (
                              <div className="space-y-2 flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => e.target.files?.[0] && handleCustomFieldFileChange(field.id, e.target.files[0])}
                                  className="text-xs text-white w-full"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldFileUpload(field.id)}
                                  disabled={customFieldUploading[field.id] || !customFieldUploads[field.id]}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {customFieldUploading[field.id] ? 'Uploading...' : 'Upload'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldSave(field)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Save
                                </Button>
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
                              <div className="space-y-2 flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={e => e.target.files?.[0] && handleCustomFieldFileChange(field.id, e.target.files[0])}
                                  className="text-xs text-white w-full"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldFileUpload(field.id)}
                                  disabled={customFieldUploading[field.id] || !customFieldUploads[field.id]}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {customFieldUploading[field.id] ? 'Uploading...' : 'Upload'}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldSave(field)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Save
                                </Button>
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
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="url"
                                  placeholder="Enter URL"
                                  value={field.value as string || ''}
                                  onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                  className="bg-gray-800 border-gray-700"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleCustomFieldSave(field)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Save
                                </Button>
                              </div>
                            )}
                            {uploadedAttachments[field.id]?.map(att => (
                              <div key={att.id} className="mt-2 text-xs text-green-400">
                                {att.file_type === 'text' && (
                                  <div>
                                    <span className="font-semibold text-white">Text:</span> <span className="text-green-300">{att.file_name}</span>
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {att.file_type === 'link' && (
                                  <div>
                                    <span className="font-semibold text-white">Link:</span> <a href={att.file_name} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{att.file_name}</a>
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {(att.file_type === 'file' || att.file_type === 'application/pdf') && (
                                  <div>
                                    <span className="font-semibold text-white">File:</span> <a href={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} target="_blank" rel="noopener noreferrer" className="underline">{att.file_name}</a>
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {att.file_type?.startsWith('image') && (
                                  <div>
                                    <span className="font-semibold text-white">Image:</span> <span className="text-green-300">{att.file_name}</span>
                                    <img src={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} alt={att.file_name} className="max-h-24 mt-1 rounded border border-gray-700" />
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                                {att.file_type?.startsWith('video') && (
                                  <div>
                                    <span className="font-semibold text-white">Video:</span> <span className="text-green-300">{att.file_name}</span>
                                    <video src={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} controls className="max-h-24 mt-1 rounded border border-gray-700" />
                                    {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                    {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Show attachments for custom_field_ids not in customFields */}
                    {Object.keys(uploadedAttachments)
                      .filter(key => key !== 'all' && !customFields.some(f => f.id === key))
                      .length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-white font-semibold mb-2">Other Custom Field Attachments</h4>
                          {Object.keys(uploadedAttachments)
                            .filter(key => key !== 'all' && !customFields.some(f => f.id === key))
                            .map(key => (
                              uploadedAttachments[key].map(att => (
                                <div key={att.id} className="mb-1 text-xs text-green-400">
                                  {att.file_type === 'text' && (
                                    <div>
                                      <span className="font-semibold text-white">Text:</span> <span className="text-green-300">{att.file_name}</span>
                                      {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                      {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                    </div>
                                  )}
                                  {att.file_type === 'link' && (
                                    <div>
                                      <span className="font-semibold text-white">Link:</span> <a href={att.file_name} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{att.file_name}</a>
                                      {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                      {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                    </div>
                                  )}
                                  {(att.file_type === 'file' || att.file_type === 'application/pdf') && (
                                    <div>
                                      <span className="font-semibold text-white">File:</span> <a href={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} target="_blank" rel="noopener noreferrer" className="underline">{att.file_name}</a>
                                      {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                      {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                    </div>
                                  )}
                                  {att.file_type?.startsWith('image') && (
                                    <div>
                                      <span className="font-semibold text-white">Image:</span> <span className="text-green-300">{att.file_name}</span>
                                      <img src={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} alt={att.file_name} className="max-h-24 mt-1 rounded border border-gray-700" />
                                      {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                      {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                    </div>
                                  )}
                                  {att.file_type?.startsWith('video') && (
                                    <div>
                                      <span className="font-semibold text-white">Video:</span> <span className="text-green-300">{att.file_name}</span>
                                      <video src={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} controls className="max-h-24 mt-1 rounded border border-gray-700" />
                                      {att.file_size !== undefined && <span className="ml-2 text-gray-400">({att.file_size} bytes)</span>}
                                      {att.created_at && <span className="ml-2 text-gray-500">{new Date(att.created_at).toLocaleString()}</span>}
                                    </div>
                                  )}
                                </div>
                              ))
                            ))}
                        </div>
                      )}

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

                    {/* Uploaded Attachments */}
                    {uploadedAttachments['all'] && uploadedAttachments['all'].length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-white font-semibold mb-2">All Uploaded Attachments</h4>
                        {uploadedAttachments['all'].map(att => (
                          <div key={att.id} className="mb-1 text-xs text-green-400">
                            <a href={`https://YOUR_SUPABASE_URL/storage/v1/object/public/partnerfiles/${att.file_path}`} target="_blank" rel="noopener noreferrer">{att.file_name}</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Negotiation Table Button */}
        <div className="w-full max-w-full md:max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 flex justify-end">
          <a href="/negotiationtable">
            <Button className="bg-gradient-to-r from-yellow-500 to-green-500 text-black font-bold shadow-lg hover:from-yellow-600 hover:to-green-600">
              View Negotiation Table
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
} 
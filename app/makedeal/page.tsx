"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { MessageCircle, Send, UserPlus, CheckCircle, XCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import Link from "next/link"

interface DealComment {
  id: string
  content: string
  user_id: string
  user_name: string
  user_avatar: string
  created_at: string
  replies: DealComment[]
}

interface DealParticipant {
  id: string
  user_id: string
  user_name: string
  user_avatar: string
  status: 'pending' | 'accepted' | 'rejected'
  role: 'investor' | 'partner' | 'collaborator' | 'advisor' | 'custom'
  custom_role?: string
  investment_amount?: number
  equity_share?: number
  responsibilities?: string[]
}

interface DealMilestone {
  id: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface DealAttachment {
  id: string
  file_name: string
  file_url: string
  file_type: string
  uploaded_by: string
}

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface Deal {
  id: string
  title: string
  description: string
  initiator_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  deal_type: 'investment' | 'partnership' | 'collaboration' | 'acquisition' | 'custom'
  custom_type?: string
  requirements: string[]
  terms: string[]
  timeline: string
  budget?: number
  equity_share?: number
  roi_expectation?: number
  deadline?: string
  confidentiality_level: 'public' | 'private' | 'confidential'
  created_at: string
  participants: DealParticipant[]
  milestones: DealMilestone[]
  attachments: DealAttachment[]
  comments: DealComment[]
}

export default function MakeDealPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deal, setDeal] = useState<Deal | null>(null)
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deal_type: "investment" as const,
    custom_type: "",
    requirements: [""],
    terms: [""],
    timeline: "",
    budget: 0,
    equity_share: 0,
    roi_expectation: 0,
    deadline: "",
    confidentiality_level: "private" as const,
    participantEmails: [""],
    participantRoles: [""],
    participantInvestments: [0],
    participantEquity: [0],
    participantResponsibilities: [[""]],
    milestones: [{ title: "", description: "", due_date: "", status: "pending" as const }],
    attachments: [] as File[]
  })

  useEffect(() => {
    if (user?.role === 'viewer') {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
          <p className="text-lg text-gray-300 mb-6">You need to be signed in to access this page.</p>
          <Link href="/login" className="gradient-button px-4 py-2">
            Sign In
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            New to COVION PARTNERS?{' '}
            <Link href="/login?tab=signup" className="text-blue-300 hover:text-blue-200">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      
      // Create the deal first
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            initiator_id: user.id,
            status: 'pending'
          }
        ])
        .select()
        .single()

      if (dealError) throw dealError

      // Add participants
      const participantEmails = formData.participantEmails.filter(email => email.trim())
      const participants = await Promise.all(
        participantEmails.map(async (email) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

          if (userError) throw userError

          return {
            deal_id: dealData.id,
            user_id: userData.id,
            status: 'pending'
          }
        })
      )

      const { error: participantsError } = await supabase
        .from('deal_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      // Fetch the complete deal with participants
      const { data: completeDeal, error: fetchError } = await supabase
        .from('deals')
        .select(`
          *,
          participants:deal_participants(
            id,
            user_id,
            status,
            role,
            user:users(
              name,
              avatar_url
            )
          )
        `)
        .eq('id', dealData.id)
        .single()

      if (fetchError) throw fetchError

      setDeal({
        ...completeDeal,
        participants: completeDeal.participants.map((p: any) => ({
          ...p,
          user_name: p.user.name || p.user.email || 'Unknown User',
          user_avatar: p.user.avatar_url || ''
        }))
      })

      toast({
        title: "Success",
        description: "Deal created successfully!",
      })
    } catch (error) {
      console.error('Error creating deal:', error)
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participantEmails: [...prev.participantEmails, ""]
    }))
  }

  const handleRemoveParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participantEmails: prev.participantEmails.filter((_, i) => i !== index)
    }))
  }

  const handleParticipantEmailChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      participantEmails: prev.participantEmails.map((email, i) => 
        i === index ? value : email
      )
    }))
  }

  const handleAddRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ""]
    }))
  }

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const handleRequirementChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => 
        i === index ? value : req
      )
    }))
  }

  const handleAddTerm = () => {
    setFormData(prev => ({
      ...prev,
      terms: [...prev.terms, ""]
    }))
  }

  const handleRemoveTerm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== index)
    }))
  }

  const handleTermChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      terms: prev.terms.map((term, i) => 
        i === index ? value : term
      )
    }))
  }

  const handleAddMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", description: "", due_date: "", status: "pending" }]
    }))
  }

  const handleRemoveMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }))
  }

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const handleAddComment = async () => {
    if (!deal || !user || !newComment.trim()) return

    try {
      const { data, error } = await supabase
        .from('deal_comments')
        .insert([
          {
            deal_id: deal.id,
            content: newComment,
            user_id: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error

      setDeal(prev => prev ? {
        ...prev,
        comments: [...prev.comments, {
          ...data,
          user_name: user.name || user.email || 'Unknown User',
          user_avatar: user.avatar_url || '',
          replies: []
        }]
      } : null)
      setNewComment("")
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAcceptDeal = async () => {
    if (!deal || !user) return

    try {
      // Update participant status
      const { error: participantError } = await supabase
        .from('deal_participants')
        .update({ status: 'accepted' })
        .eq('deal_id', deal.id)
        .eq('user_id', user.id)

      if (participantError) throw participantError

      // Check if all participants have accepted
      const { data: participants, error: fetchError } = await supabase
        .from('deal_participants')
        .select('status')
        .eq('deal_id', deal.id)

      if (fetchError) throw fetchError

      const allAccepted = participants.every(p => p.status === 'accepted')
      
      if (allAccepted) {
        // Update deal status
        const { error: dealError } = await supabase
          .from('deals')
          .update({ status: 'accepted' })
          .eq('id', deal.id)

        if (dealError) throw dealError

        setDeal(prev => prev ? { ...prev, status: 'accepted' } : null)
      } else {
        // Just update the participant status in the UI
        setDeal(prev => prev ? {
          ...prev,
          participants: prev.participants.map(p => 
            p.user_id === user.id ? { ...p, status: 'accepted' } : p
          )
        } : null)
      }

      toast({
        title: "Success",
        description: "Deal accepted!",
      })
    } catch (error) {
      console.error('Error accepting deal:', error)
      toast({
        title: "Error",
        description: "Failed to accept deal. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRejectDeal = async () => {
    if (!deal || !user) return

    try {
      // Update participant status
      const { error: participantError } = await supabase
        .from('deal_participants')
        .update({ status: 'rejected' })
        .eq('deal_id', deal.id)
        .eq('user_id', user.id)

      if (participantError) throw participantError

      // Update deal status
      const { error: dealError } = await supabase
        .from('deals')
        .update({ status: 'rejected' })
        .eq('id', deal.id)

      if (dealError) throw dealError

      setDeal(prev => prev ? { ...prev, status: 'rejected' } : null)
      toast({
        title: "Deal Rejected",
        description: "The deal has been rejected.",
      })
    } catch (error) {
      console.error('Error rejecting deal:', error)
      toast({
        title: "Error",
        description: "Failed to reject deal. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Deal Creation Form */}
          {!deal && (
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Create a New Deal</CardTitle>
                <CardDescription>
                  Start a conversation and negotiate terms with multiple participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDeal} className="space-y-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-6 mb-8">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="participants">Participants</TabsTrigger>
                      <TabsTrigger value="milestones">Milestones</TabsTrigger>
                      <TabsTrigger value="media">Media & Docs</TabsTrigger>
                      <TabsTrigger value="review">Review</TabsTrigger>
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Deal Title</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter a title for your deal"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Deal Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe the terms and conditions of the deal"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="deal_type">Deal Type</Label>
                          <Select
                            value={formData.deal_type}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, deal_type: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select deal type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="investment">Investment</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="collaboration">Collaboration</SelectItem>
                              <SelectItem value="acquisition">Acquisition</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.deal_type === 'custom' && (
                          <div>
                            <Label htmlFor="custom_type">Custom Type</Label>
                            <Input
                              id="custom_type"
                              value={formData.custom_type}
                              onChange={(e) => setFormData(prev => ({ ...prev, custom_type: e.target.value }))}
                              placeholder="Enter custom deal type"
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Requirements</Label>
                          <div className="space-y-2">
                            {formData.requirements.map((requirement, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={requirement}
                                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                                  placeholder="Enter requirement"
                                  required={index === 0}
                                />
                                {index > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleRemoveRequirement(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2 border-gray-700"
                            onClick={handleAddRequirement}
                          >
                            Add Requirement
                          </Button>
                        </div>

                        <div>
                          <Label>Terms & Conditions</Label>
                          <div className="space-y-2">
                            {formData.terms.map((term, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={term}
                                  onChange={(e) => handleTermChange(index, e.target.value)}
                                  placeholder="Enter term"
                                  required={index === 0}
                                />
                                {index > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleRemoveTerm(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full mt-2 border-gray-700"
                            onClick={handleAddTerm}
                          >
                            Add Term
                          </Button>
                        </div>

                        <div>
                          <Label htmlFor="timeline">Timeline</Label>
                          <Textarea
                            id="timeline"
                            value={formData.timeline}
                            onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                            placeholder="Describe the project timeline"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="budget">Budget (USD)</Label>
                            <Input
                              id="budget"
                              type="number"
                              value={formData.budget}
                              onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                              placeholder="Enter budget"
                            />
                          </div>
                          <div>
                            <Label htmlFor="equity_share">Equity Share (%)</Label>
                            <Input
                              id="equity_share"
                              type="number"
                              value={formData.equity_share}
                              onChange={(e) => setFormData(prev => ({ ...prev, equity_share: Number(e.target.value) }))}
                              placeholder="Enter equity share"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="roi_expectation">Expected ROI (%)</Label>
                          <Input
                            id="roi_expectation"
                            type="number"
                            value={formData.roi_expectation}
                            onChange={(e) => setFormData(prev => ({ ...prev, roi_expectation: Number(e.target.value) }))}
                            placeholder="Enter expected ROI"
                          />
                        </div>

                        <div>
                          <Label htmlFor="deadline">Deadline</Label>
                          <Input
                            id="deadline"
                            type="datetime-local"
                            value={formData.deadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="confidentiality_level">Confidentiality Level</Label>
                          <Select
                            value={formData.confidentiality_level}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, confidentiality_level: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select confidentiality level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="confidential">Confidential</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Participants Tab */}
                    <TabsContent value="participants" className="space-y-6">
                      <div className="space-y-4">
                        <Label>Participants</Label>
                        <div className="space-y-2">
                          {formData.participantEmails.map((email, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  type="email"
                                  value={email}
                                  onChange={(e) => handleParticipantEmailChange(index, e.target.value)}
                                  placeholder="Enter participant email"
                                  required={index === 0}
                                />
                                {index > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleRemoveParticipant(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={formData.participantRoles[index]}
                                  onValueChange={(value) => {
                                    const newRoles = [...formData.participantRoles]
                                    newRoles[index] = value
                                    setFormData(prev => ({ ...prev, participantRoles: newRoles }))
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="investor">Investor</SelectItem>
                                    <SelectItem value="partner">Partner</SelectItem>
                                    <SelectItem value="collaborator">Collaborator</SelectItem>
                                    <SelectItem value="advisor">Advisor</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  value={formData.participantInvestments[index]}
                                  onChange={(e) => {
                                    const newInvestments = [...formData.participantInvestments]
                                    newInvestments[index] = Number(e.target.value)
                                    setFormData(prev => ({ ...prev, participantInvestments: newInvestments }))
                                  }}
                                  placeholder="Investment amount"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-gray-700"
                          onClick={handleAddParticipant}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Another Participant
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Milestones Tab */}
                    <TabsContent value="milestones" className="space-y-6">
                      <div className="space-y-4">
                        <Label>Project Milestones</Label>
                        <div className="space-y-4">
                          {formData.milestones.map((milestone, index) => (
                            <div key={index} className="space-y-2 p-4 bg-gray-800/30 rounded-lg">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Milestone {index + 1}</h4>
                                {index > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                                    onClick={() => handleRemoveMilestone(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Input
                                  value={milestone.title}
                                  onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                                  placeholder="Milestone title"
                                  required={index === 0}
                                />
                                <Textarea
                                  value={milestone.description}
                                  onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                                  placeholder="Milestone description"
                                />
                                <Input
                                  type="datetime-local"
                                  value={milestone.due_date}
                                  onChange={(e) => handleMilestoneChange(index, 'due_date', e.target.value)}
                                  placeholder="Due date"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-gray-700"
                          onClick={handleAddMilestone}
                        >
                          Add Milestone
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Media & Docs Tab */}
                    <TabsContent value="media" className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Upload Files</Label>
                          <div className="mt-2">
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800/30 hover:bg-gray-800/50"
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <svg
                                    className="w-8 h-8 mb-4 text-gray-500"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                  >
                                    <path
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                  </svg>
                                  <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF (MAX. 10MB)
                                  </p>
                                </div>
                                <input
                                  id="file-upload"
                                  type="file"
                                  className="hidden"
                                  multiple
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                                  onChange={handleFileUpload}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Uploaded Files Preview */}
                        {formData.attachments.length > 0 && (
                          <div className="space-y-2">
                            <Label>Uploaded Files</Label>
                            <div className="space-y-2">
                              {formData.attachments.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gray-700 rounded">
                                      {file.type.startsWith('image/') ? (
                                        <svg
                                          className="w-6 h-6 text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                      ) : (
                                        <svg
                                          className="w-6 h-6 text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{file.name}</p>
                                      <p className="text-xs text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        attachments: prev.attachments.filter((_, i) => i !== index)
                                      }))
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Review Tab */}
                    <TabsContent value="review" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Review Your Deal</h3>
                        <p className="text-gray-400">Ensure all details are correct before submission.</p>
                        {/* Display summary of the deal */}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-700"
                      onClick={() => {
                        if (activeTab === "basic") setActiveTab("details")
                        else if (activeTab === "details") setActiveTab("participants")
                        else if (activeTab === "participants") setActiveTab("milestones")
                        else if (activeTab === "milestones") setActiveTab("media")
                      }}
                      disabled={activeTab === "media"}
                    >
                      Next
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-700"
                      onClick={() => {
                        if (activeTab === "media") setActiveTab("milestones")
                        else if (activeTab === "milestones") setActiveTab("participants")
                        else if (activeTab === "participants") setActiveTab("details")
                        else if (activeTab === "details") setActiveTab("basic")
                      }}
                      disabled={activeTab === "basic"}
                    >
                      Previous
                    </Button>
                  </div>

                  {activeTab === "media" && (
                    <Button type="submit" className="w-full gradient-button mt-4" disabled={loading}>
                      {loading ? "Creating..." : "Create Deal"}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Deal Discussion */}
          {deal && (
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{deal.title}</CardTitle>
                    <CardDescription>{deal.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {deal.status === 'pending' && deal.participants.some(p => p.user_id === user?.id && p.status === 'pending') && (
                      <>
                        <Button
                          variant="outline"
                          className="border-green-500 text-green-500 hover:bg-green-500/10"
                          onClick={handleAcceptDeal}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500/10"
                          onClick={handleRejectDeal}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {deal.status === 'accepted' && (
                      <Button
                        className="gradient-button"
                        onClick={() => router.push(`/projects/new?dealId=${deal.id}`)}
                      >
                        Create Project
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Participants Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Participants</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deal.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                          <Avatar>
                            <AvatarImage src={participant.user_avatar} />
                            <AvatarFallback>{participant.user_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{participant.user_name}</p>
                            <Badge
                              variant="outline"
                              className={
                                participant.status === 'accepted'
                                  ? 'border-green-500 text-green-500'
                                  : participant.status === 'rejected'
                                  ? 'border-red-500 text-red-500'
                                  : 'border-yellow-500 text-yellow-500'
                              }
                            >
                              {participant.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Discussion</h3>
                    {deal.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <Avatar>
                          <AvatarImage src={comment.user_avatar} />
                          <AvatarFallback>{comment.user_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.user_name}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="gradient-button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8">
            <Card className="border-gray-800">
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-xl">Sample Deal: Strategic Partnership</CardTitle>
                <CardDescription className="text-gray-400 mt-2">
                  A strategic partnership to enhance market reach and product offerings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Investment Amount: $500,000</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Equity Share: 10%</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Timeline: 12 months</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Confidentiality Level: Private</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Button className="w-full gradient-button">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .leonardo-card {
            padding: 1rem;
          }

          .leonardo-card .CardTitle {
            font-size: 1.25rem;
          }

          .leonardo-card .CardDescription {
            font-size: 1rem;
          }

          .leonardo-card .TabsList {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
} 
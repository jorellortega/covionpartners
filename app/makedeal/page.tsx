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

type DealType = 'investment' | 'partnership' | 'collaboration' | 'acquisition' | 'custom'
type ConfidentialityLevel = 'public' | 'private' | 'confidential'

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
  id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  role: string;
  user_name: string;
  user_avatar: string;
  investment_amount?: number;
  equity_share?: number;
  responsibilities?: string[];
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

interface UserMetadata {
  name?: string;
  avatar_url?: string;
}

interface DealParticipantUser {
  id: string;
  email: string;
  raw_user_meta_data: UserMetadata;
}

interface DealParticipantData {
  id: string;
  user_id: string;
  status: string;
  role: string;
  investment_amount?: number;
  equity_share?: number;
  responsibilities?: string[];
  users: DealParticipantUser;
}

interface CompleteDeal extends Deal {
  deal_participants: DealParticipantData[];
}

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface Deal {
  id: string;
  title: string;
  description: string;
  initiator_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  deal_type: DealType;
  custom_type?: string;
  requirements: string[];
  terms: string[];
  timeline: string;
  budget?: number;
  equity_share?: number;
  roi_expectation?: number;
  deadline?: string;
  confidentiality_level: ConfidentialityLevel;
  created_at: string;
  participants: DealParticipant[];
  milestones: DealMilestone[];
  attachments: DealAttachment[];
  comments: DealComment[];
}

interface FormData {
  title: string;
  description: string;
  deal_type: DealType;
  custom_type: string;
  confidentiality_level: ConfidentialityLevel;
}

export default function MakeDealPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    deal_type: "investment",
    custom_type: "",
    confidentiality_level: "private"
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
      
      // Create the deal with basic info only
      const dealInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        initiator_id: user.id,
        status: 'pending',
        deal_type: formData.deal_type,
        custom_type: formData.deal_type === 'custom' ? formData.custom_type.trim() : null,
        confidentiality_level: formData.confidentiality_level,
        // Set default empty values for required fields
        requirements: JSON.stringify([]),
        terms: JSON.stringify([]),
        timeline: ''
      }

      console.log('Creating deal with:', dealInput)

      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert([dealInput])
        .select('*')
        .single()

      if (dealError) {
        console.error('Deal creation error:', dealError)
        throw dealError
      }

      toast({
        title: "Success",
        description: "Deal created successfully! You can now add more details.",
      })

      // Redirect to the deal edit page
      router.push(`/deals/${dealData.id}`)
    } catch (error) {
      console.error('Error creating deal:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create deal. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle>Create a New Deal</CardTitle>
            <CardDescription>
              Start by entering the basic information for your deal. You can add more details later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDeal} className="space-y-6">
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
                    required
                  />
                </div>
              )}
              
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

              <Button type="submit" className="w-full gradient-button" disabled={loading}>
                {loading ? "Creating..." : "Create Deal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
"use client"

import { use } from 'react'
import { useState, useEffect, useRef } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Link as LinkIcon,
  Github,
  Twitter,
  Linkedin,
  Globe,
  Calendar,
  Award,
  BookOpen,
  Construction,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Video,
  UploadCloud,
  Trash2,
  Pencil,
  FileText,
  RefreshCw,
  Handshake,
  CreditCard,
  Eye,
  CheckCircle,
  Star,
  UserCheck,
  DollarSign,
  TrendingUp,
  Youtube,
  Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { QRCodeCanvas } from 'qrcode.react'

// Utility function to generate user initials
const generateInitials = (name: string): string => {
  if (!name || name.trim() === '') return '?'
  
  const nameParts = name.trim().split(' ')
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase()
  }
  
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
}

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video'
  title: string
  thumbnail?: string
  is_default?: boolean
}

interface MediaData {
  images: MediaItem[]
  videos: MediaItem[]
}

interface ProfileData {
  id: string
  user_id?: string
  name: string
  role: string
  bio: string
  email: string
  phone: string
  location: string
  company: string
  website: string
  github: string
  twitter: string
  linkedin: string
  skills: string[]
  experience: {
    title: string
    company: string
    period: string
    description: string
  }[]
  education: {
    degree: string
    school: string
    period: string
  }[]
  completed_projects: {
    id: number
    title: string
    description: string
    media_files: MediaItem[]
    completionDate: string
    technologies: string[]
    visibility: string
    status: string
    profile_visible: boolean
  }[]
  avatar_url?: string
  nickname?: string
  title1?: string
  title2?: string
  identity_verified?: boolean
  resume_url?: string
  resume_filename?: string
  resume_uploaded_at?: string
  resume_visible?: boolean
}

const defaultProfileData: ProfileData = {
  id: '',
  user_id: '',
  name: 'Anonymous User',
  role: 'User',
  bio: 'No bio available',
  email: '',
  phone: '',
  location: '',
  company: '',
  website: '',
  github: '',
  twitter: '',
  linkedin: '',
  skills: [],
  experience: [],
  education: [],
  completed_projects: [],
  avatar_url: '/placeholder-avatar.jpg',
  title1: '',
  title2: '',
  identity_verified: false,
  resume_url: '',
  resume_filename: '',
  resume_uploaded_at: '',
  resume_visible: true,
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData)
  const [error, setError] = useState<string | null>(null)
  const isOwner = user?.id === id
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null)
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null)
  const [newSkill, setNewSkill] = useState("")
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null)
  const [newExp, setNewExp] = useState({ title: "", company: "", period: "", description: "" })
  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null)
  const [newEdu, setNewEdu] = useState({ degree: "", school: "", period: "" })
  const [editingField, setEditingField] = useState<null | 'location' | 'company'>(null)
  const [editingCompany, setEditingCompany] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [companyValue, setCompanyValue] = useState("")
  const [locationValue, setLocationValue] = useState("")
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeFileInput, setResumeFileInput] = useState<HTMLInputElement | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [editingBio, setEditingBio] = useState(false)
  const [bioValue, setBioValue] = useState("")
  const [showAddExpForm, setShowAddExpForm] = useState(false)
  const [showAddEduForm, setShowAddEduForm] = useState(false)
  const [publicProjectIds, setPublicProjectIds] = useState<string[]>([])
  const [profileMissing, setProfileMissing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  // Add state for editing titles
  const [editingTitle1, setEditingTitle1] = useState(false)
  const [editingTitle2, setEditingTitle2] = useState(false)
  const [title1Value, setTitle1Value] = useState("")
  const [title2Value, setTitle2Value] = useState("")
  // Add state for editing name and role
  const [editingName, setEditingName] = useState(false)
  const [editingRole, setEditingRole] = useState(false)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nameValue, setNameValue] = useState("")
  const [roleValue, setRoleValue] = useState("")
  const [nicknameValue, setNicknameValue] = useState("")
  // Add global edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  // 1. Add state for organization
  const [organization, setOrganization] = useState<{ id: string, name: string, slug: string } | null>(null)
  const [manageProjectsExpanded, setManageProjectsExpanded] = useState(false)
  // Stats state
  const [stats, setStats] = useState({
    projects: 0,
    deals: 0,
    tasks: 0,
    skills: 0,
    years: 0,
    profileCompletion: 0,
    professionalism: 0,
    projectsFunded: 0,
    funded: 0
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Fetch user data (for avatar, email, and titles)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, identity_verified') // <-- fetch identity_verified
          .eq('id', id)
          .single()
        if (userError) {
          console.error('Error fetching user data:', userError)
        }
        // 2. In useEffect, after fetching userData, fetch the user's organization
        let org = null
        // Try as owner first
        let { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .eq('owner_id', id)
          .maybeSingle()
        if (!orgError && orgData) {
          org = orgData
        } else {
          // Try as team member
          const { data: teamData, error: teamError } = await supabase
            .from('team_members')
            .select('organization_id')
            .eq('user_id', id)
            .maybeSingle()
          if (!teamError && teamData && teamData.organization_id) {
            const { data: orgData2, error: orgError2 } = await supabase
              .from('organizations')
              .select('id, name, slug')
              .eq('id', teamData.organization_id)
              .maybeSingle()
            if (!orgError2 && orgData2) {
              org = orgData2
            }
          }
        }
        setOrganization(org)
        // Fetch profile data (for everything else)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', id)
          .single()
        if (!profile) {
          setProfileMissing(true)
        } else {
          setProfileMissing(false)
        }
        // Fetch user's projects from projects table
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', id)
          .order('created_at', { ascending: false })
        if (projectsError) {
          console.error('Error fetching projects:', projectsError)
        }
        // Merge user and profile data
        const transformedData: ProfileData = {
          id: profile?.id || id,
          user_id: profile?.user_id || '',
          name: profile?.name || userData?.name || 'Anonymous User',
          role: profile?.role || userData?.role || 'User',
          bio: profile?.bio || userData?.bio || 'No bio available',
          email: userData?.email || '',
          phone: profile?.phone || userData?.phone || '',
          location: profile?.location || userData?.location || '',
          company: profile?.company || userData?.company || '',
          website: profile?.website || userData?.website || '',
          github: profile?.github || userData?.github || '',
          twitter: profile?.twitter || userData?.twitter || '',
          linkedin: profile?.linkedin || userData?.linkedin || '',
          skills: profile?.skills || [],
          experience: profile?.experience || [],
          education: profile?.education || [],
          completed_projects: projectsData?.map(project => ({
            id: project.id,
            title: project.name,
            description: project.description || '',
            media_files: project.media_files || [],
            completionDate: project.updated_at || project.created_at || '',
            technologies: [],
            visibility: project.visibility || '',
            status: project.status || '',
            profile_visible: project.profile_visible ?? true
          })) || [],
          avatar_url: userData?.avatar_url || '/placeholder-avatar.jpg',
          nickname: profile?.nickname || userData?.nickname || undefined,
          title1: userData?.title1 || '',
          title2: userData?.title2 || '',
          identity_verified: userData?.identity_verified || false,
          resume_url: profile?.resume_url || '',
          resume_filename: profile?.resume_filename || '',
          resume_uploaded_at: profile?.resume_uploaded_at || '',
          resume_visible: profile?.resume_visible ?? true,
        }
        setProfileData(transformedData)
        // Initialize edit values
        setNameValue(transformedData.name)
        setRoleValue(transformedData.role)
        setNicknameValue(transformedData.nickname || "")
        setCompanyValue(transformedData.company || "")
        setLocationValue(transformedData.location || "")

        // Fetch stats for this user
        // Projects count (owned by user)
        const { count: projectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', id)
        
        // Deals count (initiated by user)
        const { count: dealsCount } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('initiator_id', id)
        
        // Tasks count (assigned to user)
        const { count: tasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', id)
        
        // Skills count (from profile)
        const skillsCount = transformedData.skills?.length || 0
        
        // Years (calculate from account creation or first experience)
        const accountCreatedAt = userData?.created_at || new Date().toISOString()
        const yearsSinceAccount = Math.floor((new Date().getTime() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
        const yearsFromExperience = transformedData.experience?.length > 0 
          ? transformedData.experience.reduce((max, exp) => {
              const years = exp.period ? parseInt(exp.period.split('-')[0]) || 0 : 0
              return Math.max(max, new Date().getFullYear() - years)
            }, 0)
          : 0
        const years = Math.max(yearsSinceAccount, yearsFromExperience)
        
        // Profile completion percentage
        const profileFields = [
          transformedData.name,
          transformedData.role,
          transformedData.bio,
          transformedData.email,
          transformedData.location,
          transformedData.company,
          transformedData.avatar_url && transformedData.avatar_url !== '/placeholder-avatar.jpg',
          transformedData.skills?.length > 0,
          transformedData.experience?.length > 0
        ]
        const completedFields = profileFields.filter(Boolean).length
        const profileCompletion = Math.round((completedFields / profileFields.length) * 100)
        
        // Projects funded (count of projects user has funded/invested in)
        const { count: projectsFundedCount } = await supabase
          .from('public_supports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id)
        
        // Funded projects (projects that received funding from this user)
        const fundedCount = projectsFundedCount || 0

        setStats({
          projects: projectsCount || 0,
          deals: dealsCount || 0,
          tasks: tasksCount || 0,
          skills: skillsCount,
          years: years || 0,
          profileCompletion,
          professionalism: profileCompletion, // Using profile completion as professionalism
          projectsFunded: projectsFundedCount || 0,
          funded: fundedCount
        })
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfileData()
  }, [id])

  // Fetch media for this profile
  useEffect(() => {
    const fetchMedia = async () => {
      setMediaLoading(true)
      const { data, error } = await supabase
        .from('profile_media')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      if (!error) setMedia(data || [])
      setMediaLoading(false)
    }
    if (profileData.id) fetchMedia()
  }, [profileData.id])

  // Upload media handler (image or video)
  const handleMediaUpload = async (file: File, type: 'image' | 'video', title = '') => {
    if (!user || !profileData.id) return
    
    console.log('🚀 Starting media upload...')
    console.log('📁 File:', file.name, 'Size:', file.size, 'Type:', file.type)
    console.log('👤 User ID:', user.id)
    console.log('🆔 Profile ID:', profileData.id)
    
    // Sanitize filename - remove special characters and spaces
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    
    const filePath = `project-files/${profileData.id}_${Date.now()}_${sanitizedFileName}`
    console.log('📂 Upload path:', filePath)
    
    // Try upload with detailed error logging
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('partnerfiles')
      .upload(filePath, file)
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      console.error('❌ Error details:', {
        message: uploadError.message,
        name: uploadError.name
      })
      console.error('❌ Full error object:', JSON.stringify(uploadError, null, 2))
      toast.error(`Upload failed: ${uploadError.message}`)
      return
    }
    
    console.log('✅ Upload successful:', uploadData)
    
    // Store the storage path instead of public URL
    const { error: insertError } = await supabase.from('profile_media').insert({
      user_id: user.id,
      profile_id: profileData.id,
      type,
      url: filePath, // Store the storage path, not the public URL
      title,
      created_at: new Date().toISOString(),
    })
    
    if (insertError) {
      console.error('❌ Database insert failed:', insertError)
      toast.error('Failed to save media to database')
      return
    }
    
    console.log('✅ Database insert successful')
    toast.success('Media uploaded!')
    
    // Refetch media
    const { data } = await supabase
      .from('profile_media')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    setMedia(data || [])
  }

  // Resume upload handler
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !profileData.id) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setUploadingResume(true)
      
      // Sanitize filename
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      
      const filePath = `resumes/${profileData.id}_${Date.now()}_${sanitizedFileName}`
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('partnerfiles')
        .upload(filePath, file)
      
      if (uploadError) {
        console.error('Resume upload error:', uploadError)
        toast.error('Failed to upload resume')
        return
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('partnerfiles')
        .getPublicUrl(filePath)
      
      // Update profile with resume information
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_url: publicUrl,
          resume_filename: file.name,
          resume_uploaded_at: new Date().toISOString()
        })
        .eq('user_id', profileData.id)
      
      if (updateError) {
        console.error('Profile update error:', updateError)
        toast.error('Failed to save resume information')
        return
      }
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        resume_url: publicUrl,
        resume_filename: file.name,
        resume_uploaded_at: new Date().toISOString()
      }))
      
      toast.success('Resume uploaded successfully!')
    } catch (error) {
      console.error('Resume upload error:', error)
      toast.error('Failed to upload resume')
    } finally {
      setUploadingResume(false)
    }
  }

  // Resume download handler
  const handleResumeDownload = async () => {
    if (!profileData.resume_url) return
    
    try {
      // Log download (optional - you can add this to resume_downloads table)
      if (user && user.id !== profileData.id) {
        // Only log if someone else is downloading
        await supabase.from('resume_downloads').insert({
          profile_id: profileData.id,
          downloaded_by: user.id,
          user_agent: navigator.userAgent,
          ip_address: 'client-side' // You'd get this from server-side
        })
      }
      
      // Create download link
      const link = document.createElement('a')
      link.href = profileData.resume_url
      link.download = profileData.resume_filename || 'resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Resume download started!')
    } catch (error) {
      console.error('Resume download error:', error)
      toast.error('Failed to download resume')
    }
  }

  // Resume visibility toggle handler
  const handleResumeVisibilityToggle = async (visible: boolean) => {
    if (!user || !profileData.id) return
    
    try {
      // Update profile with new visibility
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_visible: visible })
        .eq('user_id', profileData.user_id)
      
      if (updateError) {
        console.error('Profile update error:', updateError)
        toast.error('Failed to update resume visibility')
        return
      }
      
      // Update local state immediately
      setProfileData(prev => ({
        ...prev,
        resume_visible: visible
      }))
      
      toast.success(`Resume ${visible ? 'made visible' : 'hidden'} on profile!`)
    } catch (error) {
      console.error('Resume visibility toggle error:', error)
      toast.error('Failed to update resume visibility')
    }
  }



  // Individual project visibility toggle handler
  const handleProjectVisibilityToggle = async (projectId: string, currentVisibility: boolean) => {
    if (!user || !profileData.id) return
    
    try {
      const newVisibility = !currentVisibility
      
      // Update project with new visibility
      const { error: updateError } = await supabase
        .from('projects')
        .update({ profile_visible: newVisibility })
        .eq('id', projectId)
      
      if (updateError) {
        console.error('Project update error:', updateError)
        toast.error('Failed to update project visibility')
        return
      }
      
      // Update local state immediately without refetching
      setProfileData(prev => ({
        ...prev,
        completed_projects: prev.completed_projects.map(project => 
          project.id.toString() === projectId 
            ? { ...project, profile_visible: newVisibility }
            : project
        )
      }))
      
      toast.success(`Project ${newVisibility ? 'made visible' : 'hidden'} on profile!`)
    } catch (error) {
      console.error('Project visibility toggle error:', error)
      toast.error('Failed to update project visibility')
    }
  }





  // Resume delete handler
  const handleResumeDelete = async () => {
    if (!user || !profileData.id || !profileData.resume_url) return
    
    try {
      setUploadingResume(true)
      
      // Extract file path from URL for deletion
      const urlParts = profileData.resume_url.split('/')
      const filePath = urlParts.slice(-1)[0] // Get the filename part
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('partnerfiles')
        .remove([`resumes/${filePath}`])
      
      if (deleteError) {
        console.error('Storage delete error:', deleteError)
        // Continue anyway as the file might not exist
      }
      
      // Update profile to remove resume information
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          resume_url: null,
          resume_filename: null,
          resume_uploaded_at: null
        })
        .eq('user_id', profileData.id)
      
      if (updateError) {
        console.error('Profile update error:', updateError)
        toast.error('Failed to remove resume information')
        return
      }
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        resume_url: '',
        resume_filename: '',
        resume_uploaded_at: ''
      }))
      
      toast.success('Resume removed successfully!')
    } catch (error) {
      console.error('Resume delete error:', error)
      toast.error('Failed to remove resume')
    } finally {
      setUploadingResume(false)
    }
  }

  // YouTube embed handler
  const handleYouTubeEmbed = async () => {
    if (!user || !profileData.id || !youtubeUrl.trim()) return
    
    console.log('🎬 Starting YouTube embed...')
    console.log('🔗 YouTube URL:', youtubeUrl)
    
    // Extract video ID from YouTube URL
    const videoId = extractYouTubeVideoId(youtubeUrl)
    console.log('🎥 Video ID:', videoId)
    
    if (!videoId) {
      toast.error('Invalid YouTube URL. Please enter a valid YouTube video link.')
      return
    }
    
    const embedUrl = `https://www.youtube.com/embed/${videoId}`
    console.log('📺 Embed URL:', embedUrl)
    
    // Add to profile_media table
    const { data: insertData, error } = await supabase.from('profile_media').insert({
      user_id: user.id,
      profile_id: profileData.id,
      type: 'video',
      url: embedUrl,
      title: `YouTube Video - ${youtubeUrl}`,
      created_at: new Date().toISOString(),
    })
    
    if (error) {
      console.error('❌ Database insert failed:', error)
      toast.error('Failed to embed YouTube video')
      return
    }
    
    console.log('✅ Database insert successful:', insertData)
    toast.success('YouTube video embedded successfully!')
    setShowYouTubeEmbed(false)
    setYoutubeUrl('')
    
    // Refetch media
    const { data } = await supabase
      .from('profile_media')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    
    console.log('🔄 Refetched media:', data)
    setMedia(data || [])
  }

  // Extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Set media as default handler
  const handleSetAsDefault = async (mediaItem: MediaItem) => {
    if (!user || !profileData.id) return
    
    // If this item is already default, don't do anything
    if (mediaItem.is_default) {
      console.log('Item is already default, no action needed')
      return
    }
    
    try {
      // First, remove default from all other media items
      const { error: updateError } = await supabase
        .from('profile_media')
        .update({ is_default: false })
        .eq('profile_id', profileData.id)
      
      if (updateError) {
        toast.error('Failed to update media defaults')
        return
      }
      
      // Then set the selected item as default
      const { error: setError } = await supabase
        .from('profile_media')
        .update({ is_default: true })
        .eq('id', mediaItem.id)
      
      if (setError) {
        toast.error('Failed to set media as default')
        return
      }
      
      toast.success('Default media updated successfully!')
      
      // Refetch media to update the UI
      const { data } = await supabase
        .from('profile_media')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      setMedia(data || [])
      
      // Update current media index if needed
      const defaultIndex = data?.findIndex(item => item.is_default) || 0
      if (defaultIndex !== -1) {
        setCurrentMediaIndex(defaultIndex)
      }
    } catch (error) {
      toast.error('Failed to set media as default')
    }
  }

  // Delete media handler
  const handleDeleteMedia = async (mediaItem: MediaItem) => {
    if (!user || !profileData.id) return
    // Remove from storage
    const filePath = mediaItem.url.split('/partnerfiles/')[1]
    if (filePath) {
      await supabase.storage.from('partnerfiles').remove([`profile-media/${profileData.id}/${filePath.split('/').pop()}`])
    }
    // Remove from table
    await supabase.from('profile_media').delete().eq('id', mediaItem.id)
    toast.success('Media deleted!')
    // Refetch media
    const { data } = await supabase
      .from('profile_media')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    setMedia(data || [])
  }

  // Sample media data - replace with actual data
  const mediaData: MediaData = {
    images: [
      {
        id: 1,
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        type: "image",
        title: "Project Showcase"
      },
      {
        id: 2,
        url: "https://images.unsplash.com/photo-1516321497487-e288fb19713f",
        type: "image",
        title: "Team Collaboration"
      },
      {
        id: 3,
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        type: "image",
        title: "Office Space"
      }
    ],
    videos: [
      {
        id: 1,
        url: "https://example.com/video1.mp4",
        type: "video",
        title: "Project Demo",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
      },
      {
        id: 2,
        url: "https://example.com/video2.mp4",
        type: "video",
        title: "Team Meeting",
        thumbnail: "https://images.unsplash.com/photo-1516321497487-e288fb19713f"
      }
    ]
  }

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Helper function to get public URL for storage paths
  const getMediaUrl = (mediaItem: MediaItem) => {
    if (mediaItem.url.includes('youtube.com/embed')) {
      return mediaItem.url // YouTube embeds are already full URLs
    }
    // For storage paths, get the public URL
    const { data } = supabase.storage.from('partnerfiles').getPublicUrl(mediaItem.url)
    return data.publicUrl
  }

  // Show all media together instead of separating by type
  const currentMedia = media
  const currentItem = currentMedia[currentMediaIndex]

  // Debug logging for media
  console.log('📊 Media state:', {
    totalMedia: media.length,
    currentMediaLength: currentMedia.length,
    currentItem,
    allMedia: media
  })

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % currentMedia.length)
  }

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + currentMedia.length) % currentMedia.length)
  }

  // Helper to upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `avatars/${user.id}.${fileExt}`
      // Upload to Supabase Storage (partnerfiles bucket)
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      // Get public URL
      const { data } = supabase.storage.from('partnerfiles').getPublicUrl(filePath)
      const publicUrl = data.publicUrl
      // Update user profile
      const { error: updateError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (updateError) throw updateError
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  // Helper to delete avatar
  const handleAvatarDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      // Remove from storage (best effort)
      const ext = profileData.avatar_url?.split('.').pop()
      const filePath = `avatars/${user.id}.${ext}`
      await supabase.storage.from('partnerfiles').remove([filePath])
      // Update user profile to placeholder
      const { error: updateError } = await supabase.from('users').update({ avatar_url: '/placeholder-avatar.jpg' }).eq('id', user.id)
      if (updateError) throw updateError
      setProfileData(prev => ({ ...prev, avatar_url: '/placeholder-avatar.jpg' }))
      toast.success('Avatar deleted!')
    } catch (err) {
      toast.error('Failed to delete avatar')
    } finally {
      setDeleting(false)
    }
  }

  // Update profile helper
  const updateProfileField = async (field: string, value: any) => {
    try {
      console.log('Updating field:', field, 'with value:', value, 'for profile:', profileData.id)
      
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('user_id', profileData.user_id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Update local state
      setProfileData(prev => ({ ...prev, [field]: value }))
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  // Update profile field for users table (for titles)
  const updateUserField = async (field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ [field]: value })
        .eq('id', profileData.user_id)
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      setProfileData(prev => ({ ...prev, [field]: value }))
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update profile')
    }
  }

  // Skill handlers
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return
    const updatedSkills = [...profileData.skills, newSkill.trim()]
    await updateProfileField('skills', updatedSkills)
    setNewSkill("")
  }
  const handleEditSkill = async (idx: number, value: string) => {
    const updatedSkills = [...profileData.skills]
    updatedSkills[idx] = value
    await updateProfileField('skills', updatedSkills)
    setEditingSkillIndex(null)
  }
  const handleDeleteSkill = async (idx: number) => {
    const updatedSkills = profileData.skills.filter((_, i) => i !== idx)
    await updateProfileField('skills', updatedSkills)
  }
  // Experience handlers
  const handleAddExp = async () => {
    if (!newExp.title.trim()) return
    const updatedExp = [...profileData.experience, newExp]
    await updateProfileField('experience', updatedExp)
    setNewExp({ title: "", company: "", period: "", description: "" })
  }
  const handleEditExp = async (idx: number, value: any) => {
    const updatedExp = [...profileData.experience]
    updatedExp[idx] = value
    await updateProfileField('experience', updatedExp)
    setEditingExpIndex(null)
  }
  const handleDeleteExp = async (idx: number) => {
    const updatedExp = profileData.experience.filter((_, i) => i !== idx)
    await updateProfileField('experience', updatedExp)
  }
  // Education handlers
  const handleAddEdu = async () => {
    if (!newEdu.degree.trim()) return
    const updatedEdu = [...profileData.education, newEdu]
    await updateProfileField('education', updatedEdu)
    setNewEdu({ degree: "", school: "", period: "" })
  }
  const handleEditEdu = async (idx: number, value: any) => {
    const updatedEdu = [...profileData.education]
    updatedEdu[idx] = value
    await updateProfileField('education', updatedEdu)
    setEditingEduIndex(null)
  }
  const handleDeleteEdu = async (idx: number) => {
    const updatedEdu = profileData.education.filter((_, i) => i !== idx)
    await updateProfileField('education', updatedEdu)
  }

  // Add the updateProfileRow handler
  const handleProfileUpdate = async () => {
    if (!user) return
    setSyncing(true)
    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      skills: [],
      experience: [],
      education: []
    })
    if (error) {
      console.error('Supabase insert error:', error);
      toast.error('Failed to update profile!');
      setSyncing(false);
      return;
    }
    toast.success('Profile row created!')
    setProfileMissing(false)
    // Refetch profile data
    setIsLoading(true)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!profileError && profile) {
      setProfileData(prev => ({ ...prev, ...profile }))
    }
    setIsLoading(false)
    setSyncing(false)
  }

  // Automatically sync if owner and missing
  useEffect(() => {
    if (isOwner && profileMissing && !syncing) {
      handleProfileUpdate()
    }
  }, [isOwner, profileMissing])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">The profile you're looking for doesn't exist or is no longer available.</p>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className={`leonardo-card border-gray-800 transition-all duration-300 ${isEditMode ? 'ring-2 ring-purple-500/50 bg-gray-900/50' : ''}`}>
              <CardContent className="pt-6">
                                  {/* Edit Mode Toggle */}
                  {isOwner && (
                    <div className="absolute top-4 right-4">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`bg-black/60 hover:bg-black/80 text-white transition-all duration-200 ${isEditMode ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        onClick={() => {
                          if (!isEditMode) {
                            // Enter edit mode - activate all fields
                            setEditingName(true)
                            setEditingRole(true)
                            setEditingNickname(true)
                            setEditingTitle1(true)
                            setEditingTitle2(true)
                            setEditingCompany(true)
                            setCompanyValue(profileData.company || '')
                            setEditingLocation(true)
                            setLocationValue(profileData.location || '')
                            setEditingBio(true)
                            setIsEditMode(true)
                          } else {
                            // Exit edit mode - close all fields
                            setEditingName(false)
                            setEditingRole(false)
                            setEditingNickname(false)
                            setEditingTitle1(false)
                            setEditingTitle2(false)
                            setEditingCompany(false)
                            setEditingLocation(false)
                            setEditingField(null)
                            setEditingBio(false)
                            setIsEditMode(false)
                          }
                        }}
                        title={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                    {profileData.avatar_url && profileData.avatar_url !== '/placeholder-avatar.jpg' ? (
                      <Image
                        src={profileData.avatar_url}
                        alt={profileData.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-white text-3xl font-bold">
                        {generateInitials(profileData.name)}
                      </div>
                    )}
                    {isOwner && !profileMissing && (
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <input
                          type="file"
                          accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg"
                          className="hidden"
                          ref={setFileInput}
                          onChange={handleAvatarUpload}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-black/60 hover:bg-black/80 text-white"
                          onClick={() => fileInput?.click()}
                          disabled={uploading}
                          title="Upload/Replace Avatar"
                        >
                          <UploadCloud className="w-5 h-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-black/60 hover:bg-black/80 text-red-400"
                          onClick={handleAvatarDelete}
                          disabled={deleting || profileData.avatar_url === '/placeholder-avatar.jpg'}
                          title="Delete Avatar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {/* Name Edit */}
                    {editingName ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault()
                          await updateProfileField('name', nameValue)
                          setEditingName(false)
                        }}
                        className="flex items-center"
                      >
                        <input
                          value={nameValue}
                          onChange={e => setNameValue(e.target.value)}
                          className="bg-gray-800 text-white border-blue-500/50 border rounded px-3 py-1 text-2xl font-bold text-center w-64"
                          maxLength={100}
                          autoFocus
                        />
                        <button type="submit" className="ml-2 text-blue-400 text-xs">✔</button>
                        <button type="button" className="ml-1 text-gray-400 text-xs" onClick={() => setEditingName(false)}>✖</button>
                      </form>
                    ) : (
                      <h1 className="text-3xl font-bold text-center group relative">
                        {profileData.name}
                        {profileData.identity_verified && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-semibold">
                            <CheckCircle className="w-4 h-4 mr-1 text-white" /> Verified
                          </span>
                        )}
                        {isOwner && (
                          <span
                            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => { setEditingName(true); setNameValue(profileData.name); }}
                          >
                            <Pencil className="w-4 h-4 inline-block align-middle ml-2" />
                          </span>
                        )}
                      </h1>
                    )}
                    {/* Nickname Edit */}
                    {editingNickname ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault()
                          await updateProfileField('nickname', nicknameValue)
                          setEditingNickname(false)
                        }}
                        className="flex items-center"
                      >
                        <input
                          value={nicknameValue}
                          onChange={e => setNicknameValue(e.target.value)}
                          className="bg-gray-800 text-blue-400 border-blue-500/50 border rounded px-2 py-0.5 text-base text-center w-32"
                          maxLength={50}
                          autoFocus
                          placeholder="Enter nickname"
                        />
                        <button type="submit" className="ml-1 text-blue-400 text-xs">✔</button>
                        <button type="button" className="ml-1 text-gray-400 text-xs" onClick={() => setEditingNickname(false)}>✖</button>
                      </form>
                    ) : (
                      profileData.nickname && profileData.nickname.trim() !== '' ? (
                        <span className="ml-2 text-base text-blue-400 font-normal group relative">
                          ({profileData.nickname})
                          {isOwner && (
                            <span
                              className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => { setEditingNickname(true); setNicknameValue(profileData.nickname || ""); }}
                            >
                              <Pencil className="w-3 h-3 inline-block align-middle ml-1" />
                            </span>
                          )}
                        </span>
                      ) : (
                        isOwner && isEditMode && (
                          <button
                            onClick={() => { setEditingNickname(true); setNicknameValue(""); }}
                            className="ml-2 text-blue-400 text-base font-normal hover:text-blue-300 transition-colors"
                          >
                            + Add Nickname
                          </button>
                        )
                      )
                    )}
                  </div>
                  {/* Role Edit */}
                  {editingRole ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        await updateProfileField('role', roleValue)
                        setEditingRole(false)
                      }}
                      className="flex items-center justify-center mb-4"
                    >
                      <input
                        value={roleValue}
                        onChange={e => setRoleValue(e.target.value)}
                        className="bg-gray-800 text-gray-400 border-blue-500/50 border rounded px-3 py-1 text-base text-center w-48"
                        maxLength={100}
                        autoFocus
                      />
                      <button type="submit" className="ml-2 text-blue-400 text-xs">✔</button>
                      <button type="button" className="ml-1 text-gray-400 text-xs" onClick={() => setEditingRole(false)}>✖</button>
                    </form>
                  ) : (
                    <p className="text-gray-400 mb-4 group relative">
                      {profileData.role}
                      {isOwner && (
                        <span
                          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => { setEditingRole(true); setRoleValue(profileData.role); }}
                        >
                          <Pencil className="w-4 h-4 inline-block align-middle ml-2" />
                        </span>
                      )}
                    </p>
                  )}
                  {/* Titles Inline Edit */}
                  <div className="flex flex-row items-center gap-2 mb-2 justify-center">
                    {/* Title 1 */}
                    {editingTitle1 ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault()
                          await updateUserField('title1', title1Value)
                          setEditingTitle1(false)
                        }}
                        className="flex items-center"
                      >
                        <input
                          value={title1Value}
                          onChange={e => setTitle1Value(e.target.value)}
                          className="bg-gray-800 text-blue-400 border-blue-500/50 border rounded px-2 py-0.5 text-sm w-32"
                          maxLength={100}
                          autoFocus
                          placeholder="Enter title 1"
                        />
                        <button type="submit" className="ml-1 text-blue-400 text-xs">✔</button>
                        <button type="button" className="ml-1 text-gray-400 text-xs" onClick={() => setEditingTitle1(false)}>✖</button>
                      </form>
                    ) : (
                      profileData.title1 ? (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 group-hover:cursor-pointer relative px-4 py-1 text-base font-semibold">
                          {profileData.title1}
                          {isOwner && (
                            <span
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => { setEditingTitle1(true); setTitle1Value(profileData.title1 || ""); }}
                            >
                              <Pencil className="w-3 h-3 inline-block align-middle ml-1" />
                            </span>
                          )}
                        </Badge>
                      ) : (
                        isOwner && isEditMode && (
                          <button
                            onClick={() => { setEditingTitle1(true); setTitle1Value(""); }}
                            className="px-4 py-1 text-base font-semibold text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/50 rounded hover:bg-blue-500/10"
                          >
                            + Add Title 1
                          </button>
                        )
                      )
                    )}
                    {/* Title 2 */}
                    {editingTitle2 ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault()
                          await updateUserField('title2', title2Value)
                          setEditingTitle2(false)
                        }}
                        className="flex items-center"
                      >
                        <input
                          value={title2Value}
                          onChange={e => setTitle2Value(e.target.value)}
                          className="bg-gray-800 text-purple-400 border-purple-500/50 border rounded px-2 py-0.5 text-sm w-32"
                          maxLength={100}
                          autoFocus
                          placeholder="Enter title 2"
                        />
                        <button type="submit" className="ml-1 text-purple-400 text-xs">✔</button>
                        <button type="button" className="ml-1 text-gray-400 text-xs" onClick={() => setEditingTitle2(false)}>✖</button>
                      </form>
                    ) : (
                      profileData.title2 ? (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 group-hover:cursor-pointer relative px-4 py-1 text-base font-semibold">
                          {profileData.title2}
                          {isOwner && (
                            <span
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              onClick={() => { setEditingTitle2(true); setTitle2Value(profileData.title2 || ""); }}
                            >
                              <Pencil className="w-3 h-3 inline-block align-middle ml-1" />
                            </span>
                          )}
                        </Badge>
                      ) : (
                        isOwner && isEditMode && (
                          <button
                            onClick={() => { setEditingTitle2(true); setTitle2Value(""); }}
                            className="px-4 py-1 text-base font-semibold text-purple-400 hover:text-purple-300 transition-colors border border-purple-500/50 rounded hover:bg-purple-500/10"
                          >
                            + Add Title 2
                          </button>
                        )
                      )
                    )}
                  </div>

                  {organization && (
                    <div className="mb-2 text-center">
                      <a
                        href={`http://localhost:3000/company/${organization.slug}`}
                        className="text-white text-base font-semibold hover:text-blue-400 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        {organization.name}
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 mb-6">
                    {/* Company Field */}
                    <div className="relative group inline-block">
                      {editingCompany ? (
                        <form
                          onSubmit={e => { e.preventDefault(); updateProfileField('company', companyValue); setEditingCompany(false); }}
                          className="inline-flex items-center"
                          style={{ minWidth: '100px' }}
                        >
                          <input
                            value={companyValue}
                            onChange={e => setCompanyValue(e.target.value)}
                            className="bg-gray-800 text-white border-none rounded px-2 py-0.5 text-sm"
                            style={{ width: 'auto', minWidth: '60px' }}
                            autoFocus
                            onBlur={() => setEditingCompany(false)}
                            placeholder="Enter company"
                          />
                          <button type="submit" className="ml-1 text-blue-400 text-xs">✔</button>
                        </form>
                      ) : (
                        <span className="text-white text-base font-semibold group relative">
                          {profileData.company || 'No company set'}
                          {isOwner && (
                            <span
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              style={{ pointerEvents: 'auto' }}
                              onClick={e => { e.stopPropagation(); setEditingCompany(true); setCompanyValue(profileData.company || ''); }}
                            >
                              <Pencil className="w-3 h-3 inline-block align-middle ml-1" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {/* Location Field */}
                    <div className="relative group inline-block">
                      {editingLocation ? (
                        <form
                          onSubmit={e => { e.preventDefault(); updateProfileField('location', locationValue); setEditingLocation(false); }}
                          className="inline-flex items-center"
                          style={{ minWidth: '100px' }}
                        >
                          <input
                            value={locationValue}
                            onChange={e => setLocationValue(e.target.value)}
                            className="bg-gray-800 text-purple-400 border-none rounded px-2 py-0.5 text-sm"
                            style={{ width: 'auto', minWidth: '60px' }}
                            autoFocus
                            onBlur={() => setEditingLocation(false)}
                            placeholder="Enter location"
                          />
                          <button type="submit" className="ml-1 text-purple-400 text-xs">✔</button>
                        </form>
                      ) : (
                        <span className="text-purple-400 text-base font-semibold group relative">
                          {profileData.location || 'No location set'}
                          {isOwner && (
                            <span
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              style={{ pointerEvents: 'auto' }}
                              onClick={e => { e.stopPropagation(); setEditingLocation(true); setLocationValue(profileData.location || ''); }}
                            >
                              <Pencil className="w-3 h-3 inline-block align-middle ml-1" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {editingBio ? (
                    <form 
                      onSubmit={async (e) => { 
                        e.preventDefault()
                        console.log('Submitting bio update:', bioValue)
                        await updateProfileField('bio', bioValue)
                        setEditingBio(false)
                      }} 
                      className="flex items-center justify-center mb-6"
                    >
                      <textarea
                        value={bioValue}
                        onChange={e => setBioValue(e.target.value)}
                        className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full max-w-lg"
                        rows={2}
                        autoFocus
                      />
                      <button type="submit" className="ml-2 text-blue-400 text-xs">✔</button>
                    </form>
                  ) : (
                    <div className="text-gray-300 text-center mb-6 group relative">
                      {profileData.bio}
                      {isOwner && (
                        <span
                          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => { setEditingBio(true); setBioValue(profileData.bio); }}
                        >
                          <Pencil className="w-3 h-3 inline-block align-middle ml-1" />
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-4 mb-6">
                    {profileData.github && (
                      <a href={`https://github.com/${profileData.github}`} target="_blank" rel="noopener noreferrer">
                        <Github className="w-5 h-5 text-gray-400 hover:text-white" />
                      </a>
                    )}
                    {profileData.twitter && (
                      <a href={`https://twitter.com/${profileData.twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="w-5 h-5 text-gray-400 hover:text-white" />
                      </a>
                    )}
                    {profileData.linkedin && (
                      <a href={`https://linkedin.com/in/${profileData.linkedin}`} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-5 h-5 text-gray-400 hover:text-white" />
                      </a>
                    )}
                    {profileData.website && (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-5 h-5 text-gray-400 hover:text-white" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                    {/* Message User Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Message User</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send a Message</DialogTitle>
                          <DialogDescription>Send a direct message to this user.</DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={async e => {
                            e.preventDefault();
                            if (!user) {
                              toast.error('You must be logged in to send a message.');
                              return;
                            }
                            if (user.id === profileData.user_id) {
                              toast.error('You cannot message yourself.');
                              return;
                            }
                            const formData = new FormData(e.target as HTMLFormElement);
                            const subject = formData.get('subject');
                            const content = formData.get('content');
                            const { error } = await supabase.from('messages').insert({
                              subject,
                              content,
                              sender_id: user.id,
                              receiver_id: profileData.user_id,
                              read: false,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            });
                            if (!error) {
                              toast.success('Message sent!');
                              // Optionally: router.push('/messages');
                            } else {
                              toast.error('Failed to send message');
                            }
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Subject</label>
                            <input name="subject" type="text" className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white" required />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Message</label>
                            <textarea name="content" className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white" rows={4} required />
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="gradient-button w-full">Send Message</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    {/* Pay Button */}
                    <Link href={`/pay?recipient=${profileData.user_id}`} passHref legacyBehavior>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Pay
                      </Button>
                    </Link>
                    {/* Projects Button */}
                    <Link href={`/userprojects/${profileData.user_id}`} passHref legacyBehavior>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Projects
                      </Button>
                    </Link>
                    {/* Make Deal Modal */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Handshake className="w-4 h-4" />
                          Make Deal
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Start a Deal with this User</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 mt-4">
                          <Button className="w-full gradient-button flex items-center gap-2" onClick={e => {
                            if (user?.id === profileData.user_id) {
                              e.preventDefault();
                              toast.error('You cannot make a deal with yourself.');
                            } else {
                              router.push(`/makedeal?partner=${profileData.user_id}`);
                            }
                          }}>
                            <Briefcase className="w-4 h-4" />
                            From Project
                          </Button>
                          <Button className="w-full gradient-button flex items-center gap-2" onClick={e => {
                            if (user?.id === profileData.user_id) {
                              e.preventDefault();
                              toast.error('You cannot make a deal with yourself.');
                            } else {
                              router.push(`/custom-deal?partner=${profileData.user_id}`);
                            }
                          }}>
                            <Handshake className="w-4 h-4" />
                            Custom Deal
                          </Button>
                          {/* View Open Deals Option */}
                          <Button className="w-full gradient-button flex items-center gap-2" onClick={() => router.push(`/profile/${profileData.user_id}/deals`)}>
                            <Eye className="w-4 h-4" />
                            View Open Deals
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mini Analytics Card */}
            <Card className="leonardo-card border-gray-800 mb-3 p-2">
                    <CardContent className="p-2">
                      <div className="flex flex-row flex-wrap gap-2 justify-center items-center">
                        <Link href="/projects" className="flex items-center gap-1 bg-blue-900/30 hover:bg-blue-900/50 rounded-full px-3 py-1 shadow-sm min-w-[90px] transition-colors cursor-pointer">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-blue-200 text-sm">{stats.projects}</span>
                          <span className="text-xs text-gray-400 ml-1">Projects</span>
                        </Link>
                        <Link href="/deals" className="flex items-center gap-1 bg-purple-900/30 hover:bg-purple-900/50 rounded-full px-3 py-1 shadow-sm min-w-[90px] transition-colors cursor-pointer">
                          <Handshake className="w-4 h-4 text-purple-400" />
                          <span className="font-bold text-purple-200 text-sm">{stats.deals}</span>
                          <span className="text-xs text-gray-400 ml-1">Deals</span>
                        </Link>
                        <Link href="/workmode" className="flex items-center gap-1 bg-green-900/30 hover:bg-green-900/50 rounded-full px-3 py-1 shadow-sm min-w-[110px] transition-colors cursor-pointer">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="font-bold text-green-200 text-sm">{stats.tasks}</span>
                          <span className="text-xs text-gray-400 ml-1">Tasks</span>
                        </Link>
                        <div 
                          onClick={() => document.getElementById('skills-section')?.scrollIntoView({ behavior: 'smooth' })}
                          className="flex items-center gap-1 bg-yellow-900/30 hover:bg-yellow-900/50 rounded-full px-3 py-1 shadow-sm min-w-[90px] transition-colors cursor-pointer"
                        >
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="font-bold text-yellow-200 text-sm">{stats.skills}</span>
                          <span className="text-xs text-gray-400 ml-1">Skills</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-900/30 rounded-full px-3 py-1 shadow-sm min-w-[90px]">
                          <Award className="w-4 h-4 text-gray-500" />
                          <span className="font-bold text-gray-500 text-sm">{stats.years}</span>
                          <span className="text-xs text-gray-500 ml-1">Years</span>
                        </div>
                        <Link href="/setup-checklist" className="flex items-center gap-1 bg-cyan-900/30 hover:bg-cyan-900/50 rounded-full px-3 py-1 shadow-sm min-w-[110px] transition-colors cursor-pointer">
                          <UserCheck className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-cyan-200 text-sm">{stats.profileCompletion}%</span>
                          <span className="text-xs text-gray-400 ml-1">Profile</span>
                        </Link>
                        <div className="flex items-center gap-1 bg-gray-900/30 rounded-full px-3 py-1 shadow-sm min-w-[120px]">
                          <CheckCircle className="w-4 h-4 text-gray-500" />
                          <span className="font-bold text-gray-500 text-sm">{stats.professionalism}%</span>
                          <span className="text-xs text-gray-500 ml-1">Professionalism</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-900/30 rounded-full px-3 py-1 shadow-sm min-w-[120px]">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="font-bold text-gray-500 text-sm">{stats.projectsFunded}</span>
                          <span className="text-xs text-gray-500 ml-1">Projects Funded</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-900/30 rounded-full px-3 py-1 shadow-sm min-w-[120px]">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="font-bold text-gray-500 text-sm">{stats.funded}</span>
                          <span className="text-xs text-gray-500 ml-1">I Funded</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

            {/* Skills Card */}
            <Card id="skills-section" className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(profileData.skills || []).length > 0 ? (
                    (profileData.skills || []).map((skill, index) => (
                      <div key={index} className="flex items-center gap-1">
                        {editingSkillIndex === index ? (
                          <>
                            <input
                              value={skill}
                              onChange={e => handleEditSkill(index, e.target.value)}
                              className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1"
                            />
                            <Button size="sm" onClick={() => setEditingSkillIndex(null)}>Save</Button>
                          </>
                        ) : (
                          <>
                            <Badge className="bg-gray-800 text-gray-300 border-gray-700">{skill}</Badge>
                            {isOwner && (
                              <>
                                <Button size="icon" variant="ghost" onClick={() => setEditingSkillIndex(index)}><BookOpen className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteSkill(index)}><Trash2 className="w-3 h-3 text-red-400" /></Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No skills listed</p>
                  )}
                  {isOwner && (
                    <form onSubmit={e => { e.preventDefault(); handleAddSkill(); }} className="flex gap-2 mt-2">
                      <input
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        placeholder="Add skill"
                        className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1"
                      />
                      <Button size="sm" type="submit">Add</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resume Section */}
            {profileData.resume_visible && (
              <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-gray-400" />
                      Resume
                    </CardTitle>
                    <CardDescription>
                      {profileData.resume_url ? 'Download or manage your resume' : 'Upload your resume for others to download'}
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Visible</span>
                      <Switch
                        checked={profileData.resume_visible}
                        onCheckedChange={handleResumeVisibilityToggle}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.resume_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="font-medium text-white">{profileData.resume_filename}</p>
                          <p className="text-sm text-gray-400">
                            Uploaded {profileData.resume_uploaded_at ? new Date(profileData.resume_uploaded_at).toLocaleDateString() : 'recently'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleResumeDownload}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={uploadingResume}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {isOwner && (
                        <Button
                          variant="outline"
                          onClick={handleResumeDelete}
                          disabled={uploadingResume}
                          className="text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-gray-400">No resume uploaded</p>
                    {isOwner && (
                      <div>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleResumeUpload}
                          ref={setResumeFileInput}
                        />
                        <Button
                          onClick={() => resumeFileInput?.click()}
                          disabled={uploadingResume}
                          className="w-full"
                        >
                          {uploadingResume ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4 mr-2" />
                              Upload Resume
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          PDF, DOC, or DOCX files up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Hidden Resume Indicator (for owners) */}
            {!profileData.resume_visible && isOwner && (
              <Card className="leonardo-card border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Resume section is hidden</p>
                        <p className="text-xs text-gray-500">Others cannot see your resume</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Visible</span>
                      <Switch
                        checked={profileData.resume_visible}
                        onCheckedChange={handleResumeVisibilityToggle}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Experience & Education */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experience Card */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(profileData.experience || []).length > 0 ? (
                    (profileData.experience || []).map((exp, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-full bg-gray-800/30 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          {editingExpIndex === index ? (
                            <form onSubmit={e => { e.preventDefault(); handleEditExp(index, newExp); }} className="space-y-2">
                              <input value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} placeholder="Title" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                              <input value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} placeholder="Company" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                              <input value={newExp.period} onChange={e => setNewExp({ ...newExp, period: e.target.value })} placeholder="Period" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                              <textarea value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} placeholder="Description" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                              <Button size="sm" type="submit">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingExpIndex(null)}>Cancel</Button>
                            </form>
                          ) : (
                            <>
                          <h3 className="text-lg font-semibold text-white">{exp.title}</h3>
                          <p className="text-gray-400">{exp.company}</p>
                          <p className="text-gray-500 text-sm">{exp.period}</p>
                          <p className="text-gray-300 mt-2">{exp.description}</p>
                              {isOwner && (
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingExpIndex(index); setNewExp(exp); }}>Edit</Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteExp(index)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No experience listed</p>
                  )}
                  {isOwner && !showAddExpForm && (
                    <Button size="sm" className="mt-4" onClick={() => setShowAddExpForm(true)}>
                      Add Experience
                    </Button>
                  )}
                  {isOwner && showAddExpForm && (
                    <form onSubmit={e => { e.preventDefault(); handleAddExp(); setShowAddExpForm(false); }} className="space-y-2 mt-4">
                      <input value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} placeholder="Title" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                      <input value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} placeholder="Company" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                      <input value={newExp.period} onChange={e => setNewExp({ ...newExp, period: e.target.value })} placeholder="Period" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                      <textarea value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} placeholder="Description" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                      <div className="flex gap-2">
                        <Button size="sm" type="submit">Add</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddExpForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Education Card */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(profileData.education || []).length > 0 ? (
                    (profileData.education || []).map((edu, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-full bg-gray-800/30 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          {editingEduIndex === index ? (
                            <form onSubmit={e => { e.preventDefault(); handleEditEdu(index, newEdu); }} className="space-y-2">
                              <input value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Degree" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                              <input value={newEdu.school} onChange={e => setNewEdu({ ...newEdu, school: e.target.value })} placeholder="School" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                              <input value={newEdu.period} onChange={e => setNewEdu({ ...newEdu, period: e.target.value })} placeholder="Period" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                              <Button size="sm" type="submit">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingEduIndex(null)}>Cancel</Button>
                            </form>
                          ) : (
                            <>
                          <h3 className="text-lg font-semibold text-white">{edu.degree}</h3>
                          <p className="text-gray-400">{edu.school}</p>
                          <p className="text-gray-500 text-sm">{edu.period}</p>
                              {isOwner && (
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" variant="ghost" onClick={() => { setEditingEduIndex(index); setNewEdu(edu); }}>Edit</Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteEdu(index)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No education listed</p>
                  )}
                  {isOwner && !showAddEduForm && (
                    <Button size="sm" className="mt-4" onClick={() => setShowAddEduForm(true)}>
                      Add Education
                    </Button>
                  )}
                  {isOwner && showAddEduForm && (
                    <form onSubmit={e => { e.preventDefault(); handleAddEdu(); setShowAddEduForm(false); }} className="space-y-2 mt-4">
                      <input value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Degree" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                      <input value={newEdu.school} onChange={e => setNewEdu({ ...newEdu, school: e.target.value })} placeholder="School" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                      <input value={newEdu.period} onChange={e => setNewEdu({ ...newEdu, period: e.target.value })} placeholder="Period" className="bg-gray-800 text-gray-300 border-gray-700 rounded px-2 py-1 w-full" />
                      <div className="flex gap-2">
                        <Button size="sm" type="submit">Add</Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddEduForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Media Gallery Card */}
        <Card className="leonardo-card border-gray-800 mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-gray-400" />
                Media Gallery
              </CardTitle>
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,video/*,.mp4,.mov,.avi,.webm,.mkv"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const type = file.type.startsWith('image/') ? 'image' : 'video'
                          handleMediaUpload(file, type)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Upload Media
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowYouTubeEmbed(true)}
                    >
                      <Youtube className="w-4 h-4 mr-2" />
                      Embed YouTube
                    </Button>
                  </>
                )}
              </div>
            </div>
            <CardDescription>View photos and media from this profile</CardDescription>
          </CardHeader>
          <CardContent>
            {mediaLoading ? (
              <div className="text-gray-400">Loading media...</div>
            ) : (
              <div className="space-y-4">
                {/* Main Media Display */}
                <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-lg overflow-hidden bg-gray-800/30 flex items-center justify-center">
                  {/* Default Media Badge */}
                  {currentItem?.is_default && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-yellow-600 text-black font-semibold">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    </div>
                  )}
                  {currentItem && (
                    currentItem.type === 'image' ? (
                      <Image
                        src={getMediaUrl(currentItem)}
                        alt={currentItem.title}
                        fill
                        className="object-contain w-full h-full"
                        style={{ maxHeight: '80vh' }}
                      />
                    ) : currentItem.url.includes('youtube.com/embed') ? (
                      <iframe
                        key={currentItem.url}
                        src={currentItem.url}
                        title={currentItem.title}
                        className="w-full h-full"
                        style={{ maxHeight: '80vh' }}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        key={currentItem.url}
                        src={getMediaUrl(currentItem)}
                        poster={currentItem.thumbnail || ''}
                        className="object-contain w-full h-full"
                        style={{ maxHeight: '80vh' }}
                        controls
                        playsInline
                        autoPlay
                        muted
                        loop
                      />
                    )
                  )}
                  {/* Media action buttons for owner */}
                  {isOwner && currentItem && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      {/* Set as Default button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`bg-black/60 hover:bg-blue-600 text-white ${currentItem.is_default ? 'bg-blue-600' : ''}`}
                        onClick={() => handleSetAsDefault(currentItem)}
                        title={currentItem.is_default ? 'Currently Default' : 'Set as Default'}
                      >
                        {currentItem.is_default ? 'Default' : 'Set as Default'}
                      </Button>
                      {/* Delete button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-black/60 hover:bg-red-600 text-white"
                        onClick={() => handleDeleteMedia(currentItem)}
                        title="Delete Media"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                  {/* Navigation Buttons */}
                  <button
                    onClick={prevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                {/* Thumbnail Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentMedia.map((media, index) => (
                    <button
                      key={media.id}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                        index === currentMediaIndex ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {/* Default indicator */}
                      {media.is_default && (
                        <div className="absolute top-1 left-1 z-10">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </div>
                      )}
                      {media.type === 'image' ? (
                        <Image
                          src={getMediaUrl(media)}
                          alt={media.title}
                          width={800}
                          height={600}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : media.url.includes('youtube.com/embed') ? (
                        // YouTube embed thumbnail - generate thumbnail from video ID
                        <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={`https://img.youtube.com/vi/${extractYouTubeVideoId(media.url)}/mqdefault.jpg`}
                            alt={media.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if thumbnail fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Video className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                              <div className="text-xs text-gray-500">YouTube</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Regular video thumbnail - try to show first frame or fallback
                        <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
                          <video
                            src={getMediaUrl(media)}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            onLoadedData={(e) => {
                              // Try to capture first frame
                              const video = e.target as HTMLVideoElement
                              video.currentTime = 0.1
                            }}
                            onError={(e) => {
                              // Fallback if video fails to load
                              const video = e.target as HTMLVideoElement
                              video.style.display = 'none'
                              video.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Video className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                              <div className="text-xs text-gray-500">Video</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Management (for owners) */}
        {isOwner && (
          <Card className="leonardo-card border-gray-800 mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2 text-gray-400" />
                    Manage Projects
                  </CardTitle>
                  <CardDescription>Choose which projects to display on your profile</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setManageProjectsExpanded(!manageProjectsExpanded)}
                  className="text-gray-400 hover:text-white"
                >
                  {manageProjectsExpanded ? 'Hide' : 'Show'} ({profileData.completed_projects.length})
                </Button>
              </div>
            </CardHeader>
            {manageProjectsExpanded && (
              <CardContent>
                {profileData.completed_projects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No projects found</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {profileData.completed_projects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{project.title}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge className="bg-gray-700 text-gray-300 text-xs">{project.status}</Badge>
                            {!project.visibility && (
                              <Badge className="bg-red-700/30 text-red-400 text-xs">Private</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">
                            {project.profile_visible ? 'Visible' : 'Hidden'}
                          </span>
                          <Switch
                            checked={project.profile_visible}
                            onCheckedChange={() => handleProjectVisibilityToggle(project.id.toString(), project.profile_visible)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Projects Display Card */}
        <Card className="leonardo-card border-gray-800 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-gray-400" />
              Projects
            </CardTitle>
            <CardDescription>Showcase of your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {profileData.completed_projects.filter(project => project.profile_visible).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  {isOwner ? "No projects are currently visible on your profile. Use the toggles to show projects." : "No projects to display"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileData.completed_projects.filter(project => project.profile_visible).map((project) => {
                  const isPublic = project.visibility === 'public'
                  const cardContent = (
                    <div className="bg-gray-800/30 rounded-lg overflow-hidden">
                      {project.media_files && project.media_files.length > 0 && project.media_files[0].type && project.media_files[0].type.startsWith('image/') ? (
                        <div className="relative w-full aspect-video min-h-[120px] overflow-hidden rounded-t-lg bg-gray-800/30 flex items-center justify-center">
                          <Image
                            src={project.media_files[0].url}
                            alt="Project Image"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority={false}
                          />
                        </div>
                      ) : null}
                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.technologies.map((tech, index) => (
                            <Badge key={index} className="bg-gray-700 text-gray-300">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <p className="text-gray-500 text-sm">
                              {new Date(project.completionDate).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2">
                              {!isPublic && (
                                <Badge className="bg-red-700/30 text-red-400">Private</Badge>
                              )}
                              {project.status === 'active' && (
                                <Badge className="bg-green-700/30 text-green-400">Active</Badge>
                              )}
                              {project.status === 'completed' && (
                                <Badge className="bg-blue-700/30 text-blue-400">Completed</Badge>
                              )}
                              {project.status === 'pending' && (
                                <Badge className="bg-yellow-700/30 text-yellow-400">Pending</Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress bar for active projects */}
                          {project.status === 'active' && (
                            <div className="w-full">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>75%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                  return isPublic ? (
                    <Link key={project.id} href={`/publicprojects/${project.id}`} className="block hover:shadow-lg transition-shadow">
                      {cardContent}
                    </Link>
                  ) : (
                    <div key={project.id}>{cardContent}</div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      {/* QR Code at the bottom */}
      <div className="w-full flex flex-col items-center justify-center py-8">
        <div className="mb-2 text-gray-400 text-sm">Profile Barcode</div>
        <div ref={qrRef}>
          <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${id}`} size={128} bgColor="#18181b" fgColor="#fff" />
        </div>
        <button
          className="mt-3 px-4 py-2 bg-gray-800 text-gray-200 rounded hover:bg-gray-700 transition"
          onClick={() => {
            const canvas = qrRef.current?.querySelector('canvas')
            if (canvas) {
              const url = canvas.toDataURL('image/png')
              const link = document.createElement('a')
              link.href = url
              link.download = `profile-barcode-${id}.png`
              link.click()
            }
          }}
        >
          Download Barcode
        </button>
      </div>

      {/* YouTube Embed Dialog */}
      <Dialog open={showYouTubeEmbed} onOpenChange={setShowYouTubeEmbed}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed YouTube Video</DialogTitle>
            <DialogDescription>
              Paste a YouTube video URL to embed it in your profile media gallery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-300 mb-2">
                YouTube Video URL
              </label>
              <input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-400">
              <p>Supported formats:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
                <li>https://youtu.be/VIDEO_ID</li>
                <li>https://www.youtube.com/embed/VIDEO_ID</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowYouTubeEmbed(false)
                setYoutubeUrl('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleYouTubeEmbed}
              disabled={!youtubeUrl.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Embed Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
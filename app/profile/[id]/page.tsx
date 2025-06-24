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
  CreditCard
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

interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video'
  title: string
  thumbnail?: string
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
  }[]
  avatar_url?: string
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
  avatar_url: '/placeholder-avatar.jpg'
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
  const [editValue, setEditValue] = useState("")
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

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch user data (for avatar and email)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single()
        if (userError) {
          console.error('Error fetching user data:', userError)
        }

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

        // Fetch user's completed projects from projects table
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', id)
          .eq('status', 'completed')
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
            visibility: project.visibility || ''
          })) || [],
          avatar_url: userData?.avatar_url || '/placeholder-avatar.jpg'
        }
        setProfileData(transformedData)
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
        .order('created_at', { ascending: false })
      if (!error) setMedia(data || [])
      setMediaLoading(false)
    }
    if (profileData.id) fetchMedia()
  }, [profileData.id])

  // Upload media handler (image or video)
  const handleMediaUpload = async (file: File, type: 'image' | 'video', title = '') => {
    if (!user || !profileData.id) return
    const filePath = `profile-media/${profileData.id}/${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('partnerfiles')
      .upload(filePath, file)
    if (uploadError) {
      toast.error('Failed to upload media')
      return
    }
    const { data: urlData } = await supabase.storage
      .from('partnerfiles')
      .getPublicUrl(filePath)
    await supabase.from('profile_media').insert({
      user_id: user.id,
      profile_id: profileData.id,
      type,
      url: urlData.publicUrl,
      title,
      created_at: new Date().toISOString(),
    })
    toast.success('Media uploaded!')
    // Refetch media
    const { data } = await supabase
      .from('profile_media')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('created_at', { ascending: false })
    setMedia(data || [])
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
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images')

  const images = media.filter(m => m.type === 'image')
  const videos = media.filter(m => m.type === 'video')
  const currentMedia = activeTab === 'images' ? images : videos
  const currentItem = currentMedia[currentMediaIndex]

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

  useEffect(() => {
    const fetchPublicProjects = async () => {
      const { data, error } = await supabase
        .from('publicprojects')
        .select('id')
      if (!error && data) {
        setPublicProjectIds(data.map((p: { id: string }) => p.id))
      }
    }
    fetchPublicProjects()
  }, [])

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
            <Card className="leonardo-card border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                    <Image
                      src={profileData.avatar_url || '/placeholder-avatar.jpg'}
                      alt={profileData.name}
                      fill
                      className="object-cover"
                    />
                    {isOwner && !profileMissing && (
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
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
                  <h1 className="text-2xl font-bold text-white mb-1">{profileData.name}</h1>
                  <p className="text-gray-400 mb-4">{profileData.role}</p>
                  <div className="flex gap-2 mb-6">
                    {profileData.company && (
                      <div className="relative group inline-block">
                        {editingField === 'company' ? (
                          <form
                            onSubmit={e => { e.preventDefault(); updateProfileField('company', editValue); setEditingField(null); }}
                            className="inline-flex items-center"
                            style={{ minWidth: '100px' }}
                          >
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="bg-gray-800 text-blue-400 border-none rounded px-2 py-0.5 text-sm"
                              style={{ width: 'auto', minWidth: '60px' }}
                              autoFocus
                              onBlur={() => setEditingField(null)}
                            />
                            <button type="submit" className="ml-1 text-blue-400 text-xs">✔</button>
                          </form>
                        ) : (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 group-hover:cursor-pointer relative">
                            {profileData.company}
                            {isOwner && (
                              <span
                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ pointerEvents: 'auto' }}
                                onClick={e => { e.stopPropagation(); setEditingField('company'); setEditValue(profileData.company); }}
                              >
                                <Pencil className="w-3 h-3 inline-block align-middle" />
                              </span>
                            )}
                          </Badge>
                        )}
                      </div>
                    )}
                    {profileData.location && (
                      <div className="relative group inline-block">
                        {editingField === 'location' ? (
                          <form
                            onSubmit={e => { e.preventDefault(); updateProfileField('location', editValue); setEditingField(null); }}
                            className="inline-flex items-center"
                            style={{ minWidth: '100px' }}
                          >
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="bg-gray-800 text-purple-400 border-none rounded px-2 py-0.5 text-sm"
                              style={{ width: 'auto', minWidth: '60px' }}
                              autoFocus
                              onBlur={() => setEditingField(null)}
                            />
                            <button type="submit" className="ml-1 text-purple-400 text-xs">✔</button>
                          </form>
                        ) : (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 group-hover:cursor-pointer relative">
                            {profileData.location}
                            {isOwner && (
                              <span
                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ pointerEvents: 'auto' }}
                                onClick={e => { e.stopPropagation(); setEditingField('location'); setEditValue(profileData.location); }}
                              >
                                <Pencil className="w-3 h-3 inline-block align-middle" />
                              </span>
                            )}
                          </Badge>
                        )}
                      </div>
                    )}
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
                  <div className="flex gap-2 mb-4">
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
                          <Link href="#" passHref legacyBehavior>
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
                          </Link>
                          <Link href="#" passHref legacyBehavior>
                            <Button className="w-full gradient-button flex items-center gap-2" onClick={e => {
                              if (user?.id === profileData.user_id) {
                                e.preventDefault();
                                toast.error('You cannot make a deal with yourself.');
                              } else {
                                router.push(`/customdeal?partner=${profileData.user_id}`);
                              }
                            }}>
                              <Handshake className="w-4 h-4" />
                              Custom Deal
                            </Button>
                          </Link>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills Card */}
            <Card className="leonardo-card border-gray-800">
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
                <Button
                  variant={activeTab === 'images' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('images')
                    setCurrentMediaIndex(0)
                  }}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Images
                </Button>
                <Button
                  variant={activeTab === 'videos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('videos')
                    setCurrentMediaIndex(0)
                  }}
                  className="flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Videos
                </Button>
                {isOwner && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={activeTab === 'images' ? 'image/*' : 'video/*'}
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleMediaUpload(file, activeTab.slice(0, -1) as 'image' | 'video')
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload {activeTab === 'images' ? 'Image' : 'Video'}
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
                  {currentItem && (
                    currentItem.type === 'image' ? (
                      <Image
                        src={currentItem.url}
                        alt={currentItem.title}
                        fill
                        className="object-contain w-full h-full"
                        style={{ maxHeight: '80vh' }}
                      />
                    ) : (
                      <video
                        key={currentItem.url}
                        src={currentItem.url}
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
                  {/* Delete button for owner */}
                  {isOwner && currentItem && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white"
                      onClick={() => handleDeleteMedia(currentItem)}
                      title="Delete Media"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
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
                      {media.type === 'image' ? (
                        <Image
                          src={media.url}
                          alt={media.title}
                          width={800}
                          height={600}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Image
                          src={media.thumbnail || ''}
                          alt={media.title}
                          width={800}
                          height={600}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Projects Card */}
        <Card className="leonardo-card border-gray-800 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-gray-400" />
              Completed Projects
            </CardTitle>
            <CardDescription>Showcase of successfully completed projects</CardDescription>
          </CardHeader>
          <CardContent>
            {profileData.completed_projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No completed projects to display</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileData.completed_projects.map((project) => {
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
                        <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.technologies.map((tech, index) => (
                            <Badge key={index} className="bg-gray-700 text-gray-300">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-gray-500 text-sm">
                          Completed: {new Date(project.completionDate).toLocaleDateString()}
                        </p>
                        {!isPublic && (
                          <Badge className="bg-red-700/30 text-red-400 mt-2">Private Project</Badge>
                        )}
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
    </div>
  )
} 
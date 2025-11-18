"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  MessageSquare, 
  Heart, 
  Share2, 
  Building2, 
  Users, 
  DollarSign, 
  Globe,
  Briefcase,
  Target,
  Calendar,
  Plus,
  X,
  User,
  LayoutDashboard,
  Pencil,
  Trash2,
  Save,
  ThumbsDown,
  Hand,
  Image,
  Video,
  File,
  Sparkles,
  Loader2,
  Handshake
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUser } from '@/hooks/useUser'
import { formatDistanceToNow } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { AdsenseAd } from '@/components/AdsenseAd'
import { toast } from 'sonner'

interface PostInteraction {
  type: string;
  count: number;
}

type FeedPost = {
  id: string;
  [key: string]: any;
};

export default function FeedPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [newPost, setNewPost] = useState({
    type: 'project',
    content: '',
    project: {
      name: '',
      description: '',
      fundingGoal: '',
      deadline: ''
    },
    showSupport: false,
    deal: {
      value: '',
      status: 'In Progress',
      partners: ['']
    },
    milestone: {
      project: '',
      achievement: '',
      target: ''
    },
    job: {},
    partnership: {
      newPartners: [''],
      focus: ''
    }
  })
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showCommentBox, setShowCommentBox] = useState<{ [postId: string]: boolean }>({})
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({})
  const [comments, setComments] = useState<{ [postId: string]: any[] }>({})
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({})
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<string[]>([])
  const [enhancingPost, setEnhancingPost] = useState(false)
  const [publicProjects, setPublicProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [publicDeals, setPublicDeals] = useState<any[]>([])
  const [loadingDeals, setLoadingDeals] = useState(false)
  const [selectedDealId, setSelectedDealId] = useState<string>('')
  const [userJobs, setUserJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [projectSupportInfo, setProjectSupportInfo] = useState<{ [projectId: string]: { accepts_support: boolean; funding_goal?: number; current_funding?: number } }>({})

  useEffect(() => {
    fetchPosts()
  }, [activeTab])

  // Fetch public projects when type is "project"
  useEffect(() => {
    if (newPost.type === 'project' && user?.id) {
      fetchPublicProjects()
    } else {
      setPublicProjects([])
      setSelectedProjectId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPost.type, user?.id])

  // Fetch public deals when type is "deal"
  useEffect(() => {
    if (newPost.type === 'deal' && user?.id) {
      fetchPublicDeals()
    } else {
      setPublicDeals([])
      setSelectedDealId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPost.type, user?.id])

  // Fetch user jobs when type is "job"
  useEffect(() => {
    if (newPost.type === 'job' && user?.id) {
      fetchUserJobs()
    } else {
      setUserJobs([])
      setSelectedJobId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPost.type, user?.id])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('posts')
        .select(`
          *,
          post_details!inner (
            type,
            data
          ),
          post_interactions (
            type,
            user_id
          )
        `)
        .order('created_at', { ascending: false })

      if (activeTab !== 'all') {
        query = query.eq('type', activeTab)
      }

      const { data, error } = await query
      if (error) throw error

      // Collect unique user_ids
      const userIds = Array.from(new Set(data.map((post: any) => post.user_id)))
      // Fetch users for those user_ids
      let usersMap: Record<string, { name: string; avatar_url: string; role?: string }> = {}
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar_url, role')
          .in('id', userIds)
        if (!usersError && usersData) {
          usersData.forEach((u: any) => {
            usersMap[u.id] = {
              name: u.name,
              avatar_url: u.avatar_url,
              role: u.role || ''
            }
          })
        }
      }

      // Transform the data to match our UI structure
      const transformedPosts = data.map((post: any) => {
        // Count interactions by type
        const interactions = post.post_interactions.reduce((acc: { [key: string]: number }, curr: PostInteraction) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1
          return acc
        }, {})
        // Get user info from usersMap
        const userRecord = usersMap[post.user_id] || {}
        const likedByCurrentUser = post.post_interactions.some(
          (i: any) => i.type === 'like' && i.user_id === user?.id
        )
        const dislikedByCurrentUser = post.post_interactions.some(
          (i: any) => i.type === 'dislike' && i.user_id === user?.id
        )
        const smhByCurrentUser = post.post_interactions.some(
          (i: any) => i.type === 'smh' && i.user_id === user?.id
        )
        const trophyByCurrentUser = post.post_interactions.some(
          (i: any) => i.type === 'trophy' && i.user_id === user?.id
        )
        return {
          id: post.id,
          type: post.type,
          user: {
            id: post.user_id,
            name: userRecord.name || 'Unknown User',
            avatar: userRecord.avatar_url || '',
            role: userRecord.role || ''
          },
          content: post.content,
          timestamp: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
          ...post.post_details[0]?.data,
          media: post.media_urls || [],
          likes: interactions['like'] || 0,
          likedByCurrentUser,
          dislikes: interactions['dislike'] || 0,
          dislikedByCurrentUser,
          comments: interactions['comment'] || 0,
          shares: interactions['share'] || 0,
          smh: interactions['smh'] || 0,
          smhByCurrentUser,
          trophy: interactions['trophy'] || 0,
          trophyByCurrentUser
        }
      })

      setPosts(transformedPosts)
      console.log('Transformed posts:', transformedPosts)

      // Fetch project support info only for posts that have showSupport: true
      const postsWithSupport = transformedPosts.filter((post: any) => 
        post.type === 'project' && post.projectId && post.showSupport
      )
      const projectIds = postsWithSupport.map((post: any) => post.projectId)
      
      if (projectIds.length > 0) {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, accepts_support, funding_goal, current_funding')
          .in('id', projectIds)
        
        if (!projectsError && projectsData) {
          const supportInfoMap: { [key: string]: { accepts_support: boolean; funding_goal?: number; current_funding?: number } } = {}
          projectsData.forEach((project: any) => {
            supportInfoMap[project.id] = {
              accepts_support: project.accepts_support || false,
              funding_goal: project.funding_goal,
              current_funding: project.current_funding
            }
          })
          setProjectSupportInfo(supportInfoMap)
        }
      } else {
        setProjectSupportInfo({})
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicProjects = async () => {
    if (!user?.id) return
    
    try {
      setLoadingProjects(true)
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, visibility')
        .eq('owner_id', user.id)
        .eq('visibility', 'public')
        .order('name')

      if (error) throw error
      setPublicProjects(data || [])
    } catch (error) {
      console.error('Error fetching public projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const fetchPublicDeals = async () => {
    if (!user?.id) return
    
    try {
      setLoadingDeals(true)
      const { data, error } = await supabase
        .from('deals')
        .select('id, title, description, confidentiality_level')
        .eq('initiator_id', user.id)
        .eq('confidentiality_level', 'public')
        .order('title')

      if (error) throw error
      setPublicDeals(data || [])
    } catch (error) {
      console.error('Error fetching public deals:', error)
      toast.error('Failed to load deals')
    } finally {
      setLoadingDeals(false)
    }
  }

  const fetchUserJobs = async () => {
    if (!user?.id) return
    
    try {
      setLoadingJobs(true)
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, is_active')
        .eq('employer_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserJobs(data || [])
    } catch (error) {
      console.error('Error fetching user jobs:', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoadingJobs(false)
    }
  }

  const handleEnhancePost = async () => {
    const currentContent = newPost.content.trim()
    if (!currentContent) {
      toast.error('Please enter post content to enhance')
      return
    }

    setEnhancingPost(true)
    try {
      const response = await fetch('/api/enhance-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentContent })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Enhancement failed')
      }

      const data = await response.json()
      setNewPost({ ...newPost, content: data.message })
      toast.success('Post content enhanced with AI')
    } catch (error: any) {
      console.error('Post enhancement error:', error)
      toast.error(error?.message || 'Failed to enhance post content')
    } finally {
      setEnhancingPost(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setShowAuthDialog(true)
      return
    }

    try {
      console.log('DEBUG: Creating post', { user, newPost, mediaFiles })
      setUploadingMedia(true)
      
      // Upload media files first
      const mediaUrls = []
      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `post-media/${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('partnerfiles')
          .upload(filePath, file)

        if (uploadError) {
          console.error('DEBUG: Media upload error', uploadError)
          alert('Media upload error: ' + uploadError.message)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('partnerfiles')
          .getPublicUrl(filePath)

        mediaUrls.push({
          url: publicUrl,
          type: file.type.startsWith('image/') ? 'image' : 'video'
        })
      }

      // Create the post with media URLs
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: newPost.type,
          content: newPost.content,
          media_urls: mediaUrls
        })
        .select()

      console.log('DEBUG: Post insert response', { post, postError })
      if (postError) {
        alert('Post insert error: ' + (postError as any)?.message)
        throw postError
      }

      // Use the correct post id from the inserted post
      const postId = Array.isArray(post) && post.length > 0 ? post[0].id : undefined;
      if (!postId) {
        alert('Could not get new post id')
        throw new Error('No post id returned from insert')
      }

      // Create the post details
      const detailsData = {
        type: newPost.type,
        data: {
          ...(newPost[newPost.type as keyof typeof newPost] as Record<string, any>),
          media_urls: mediaUrls,
          ...(selectedProjectId && newPost.type === 'project' ? { projectId: selectedProjectId } : {}),
          ...(selectedDealId && newPost.type === 'deal' ? { dealId: selectedDealId } : {}),
          ...(selectedJobId && newPost.type === 'job' ? { jobId: selectedJobId } : {}),
          ...(newPost.type === 'project' && newPost.showSupport ? { showSupport: true } : {})
        }
      }

      const { error: detailsError } = await supabase
        .from('post_details')
        .insert({
          post_id: postId,
          ...detailsData
        })

      console.log('DEBUG: Post details insert response', { detailsError })
      if (detailsError) {
        alert('Post details insert error: ' + (detailsError as any)?.message)
        throw detailsError
      }

      // Reset form and refresh posts
    setNewPost({
      type: 'project',
      content: '',
      project: {
        name: '',
        description: '',
        fundingGoal: '',
        deadline: ''
      },
      deal: {
        value: '',
        status: 'In Progress',
        partners: ['']
      },
      milestone: {
        project: '',
        achievement: '',
        target: ''
      },
      job: {},
      partnership: {
        newPartners: [''],
        focus: ''
      },
      showSupport: false
    })
      setMediaFiles([])
      setMediaPreview([])
      setSelectedProjectId('')
      setSelectedDealId('')
      setSelectedJobId('')
    setShowCreateForm(false)
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Error creating post: ' + ((error as any)?.message || error))
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleInteraction = async (postId: string, type: 'like' | 'dislike' | 'share' | 'smh' | 'trophy') => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    try {
      let updatedPosts = [...posts];
      const postIdx = updatedPosts.findIndex(p => p.id === postId);
      if (["like", "dislike", "smh", "trophy"].includes(type)) {
        const already =
          type === 'like' ? updatedPosts[postIdx].likedByCurrentUser :
          type === 'dislike' ? updatedPosts[postIdx].dislikedByCurrentUser :
          type === 'smh' ? updatedPosts[postIdx].smhByCurrentUser :
          type === 'trophy' ? updatedPosts[postIdx].trophyByCurrentUser : false;
        if (already) {
          // Remove
          const { data: existing } = await supabase
            .from('post_interactions')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .eq('type', type)
            .single();
          if (existing) {
            await supabase.from('post_interactions').delete().eq('id', existing.id);
            if (type === 'like') {
              updatedPosts[postIdx].likes -= 1;
              updatedPosts[postIdx].likedByCurrentUser = false;
            } else if (type === 'dislike') {
              updatedPosts[postIdx].dislikes -= 1;
              updatedPosts[postIdx].dislikedByCurrentUser = false;
            } else if (type === 'smh') {
              updatedPosts[postIdx].smh -= 1;
              updatedPosts[postIdx].smhByCurrentUser = false;
            } else if (type === 'trophy') {
              updatedPosts[postIdx].trophy -= 1;
              updatedPosts[postIdx].trophyByCurrentUser = false;
            }
          }
        } else {
          // Add
          await supabase.from('post_interactions').insert({
            post_id: postId,
            user_id: user.id,
            type,
            created_at: new Date().toISOString()
          });
          if (type === 'like') {
            updatedPosts[postIdx].likes += 1;
            updatedPosts[postIdx].likedByCurrentUser = true;
          } else if (type === 'dislike') {
            updatedPosts[postIdx].dislikes += 1;
            updatedPosts[postIdx].dislikedByCurrentUser = true;
          } else if (type === 'smh') {
            updatedPosts[postIdx].smh += 1;
            updatedPosts[postIdx].smhByCurrentUser = true;
          } else if (type === 'trophy') {
            updatedPosts[postIdx].trophy += 1;
            updatedPosts[postIdx].trophyByCurrentUser = true;
          }
        }
        setPosts(updatedPosts);
      } else if (type === 'share') {
        // For share, keep upsert logic
        const { error } = await supabase
          .from('post_interactions')
          .upsert({
            post_id: postId,
            user_id: user.id,
            type,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
        fetchPosts();
      }
    } catch (error) {
      console.error('Error handling interaction:', error);
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'project':
        return <Building2 className="w-5 h-5 text-blue-400" />
      case 'deal':
        return <DollarSign className="w-5 h-5 text-green-400" />
      case 'milestone':
        return <Target className="w-5 h-5 text-purple-400" />
      case 'job':
        return <Briefcase className="w-5 h-5 text-orange-400" />
      case 'partnership':
        return <Users className="w-5 h-5 text-yellow-400" />
      default:
        return <Globe className="w-5 h-5 text-gray-400" />
    }
  }

  const handleEdit = (post: any) => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    setEditingPostId(post.id)
    setEditContent(post.content)
  }

  const handleSave = async (post: any) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent })
        .eq('id', post.id)
      if (error) throw error
      setEditingPostId(null)
      setEditContent('')
      fetchPosts()
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  const handleDelete = async (post: any) => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
      if (error) throw error
      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  // Fetch comments for a post
  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    const { data, error } = await supabase
      .from('post_interactions')
      .select('id, user_id, content, created_at')
      .eq('post_id', postId)
      .eq('type', 'comment')
      .order('created_at', { ascending: true })
    if (!error && data) {
      // Fetch profiles for commenters
      const userIds = Array.from(new Set(data.map((c: any) => c.user_id)))
      let profilesMap: Record<string, { name: string; avatar_url: string }> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', userIds)
        if (profiles) {
          profiles.forEach((profile: any) => {
            profilesMap[profile.user_id] = {
              name: profile.name,
              avatar_url: profile.avatar_url
            }
          })
        }
      }
      // Attach profile info to comments
      const commentsWithProfiles = data.map((c: any) => ({
        ...c,
        user: {
          id: c.user_id,
          name: profilesMap[c.user_id]?.name || 'Unknown User',
          avatar: profilesMap[c.user_id]?.avatar_url || ''
        }
      }))
      setComments(prev => ({ ...prev, [postId]: commentsWithProfiles }))
    }
    setLoadingComments(prev => ({ ...prev, [postId]: false }))
  }

  // Handle comment icon click
  const handleShowCommentBox = (postId: string) => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    setShowCommentBox(prev => ({ ...prev, [postId]: true }))
    if (!comments[postId]) {
      fetchComments(postId)
    }
  }

  // Handle comment input change
  const handleCommentInput = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }))
  }

  // Handle comment submit
  const handleCommentSubmit = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return
    const content = commentInputs[postId].trim()
    const { error } = await supabase
      .from('post_interactions')
      .insert({
        post_id: postId,
        user_id: user.id,
        type: 'comment',
        content
      })
    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
      fetchComments(postId)
      fetchPosts() // update comment count
    }
  }

  // Add this function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setMediaFiles(prev => [...prev, ...files])
    
    // Create preview URLs for images and videos
    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        setMediaPreview(prev => [...prev, url])
      }
    })
  }

  // Add this function to remove a media file
  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
    setMediaPreview(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-gray-950 relative">
        <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-purple-400"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
                  <p className="text-gray-400 text-sm">Stay updated with the latest activities and opportunities</p>
                </div>
              </div>
              {/* Profile and Dashboard Icons on the right */}
              <div className="flex items-center gap-2 ml-auto">
              {user ? (
                <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-purple-400"
                  onClick={() => router.push('/dashboard')}
                  aria-label="Go to dashboard"
                >
                  <LayoutDashboard className="w-7 h-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-purple-400"
                onClick={() => router.push(`/profile/${user?.id}`)}
                  aria-label="Go to my profile"
                >
                  <User className="w-7 h-7" />
                </Button>
                </>
              ) : (
                <Button
                  className="gradient-button"
                  onClick={() => router.push('/account-types')}
                >
                  Sign in
                </Button>
              )}
              </div>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {user && (
          <>
              <Button 
              className="gradient-button w-full mb-8"
                onClick={() => setShowCreateForm(true)}
              >
              Create New Post
              </Button>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>
                    Share your projects, deals, milestones, or jobs with the community.
                  </DialogDescription>
                </DialogHeader>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      className="w-full rounded border-gray-700 bg-gray-900 text-white p-2"
                        value={newPost.type}
                      onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                      required
                    >
                      <option value="project">Project</option>
                      <option value="deal">Deal</option>
                      <option value="milestone">Milestone</option>
                      <option value="job">Job</option>
                    </select>
                    </div>
                    {newPost.type === 'project' && publicProjects.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Link to Project (optional)</label>
                        <select
                          className="w-full rounded border-gray-700 bg-gray-900 text-white p-2"
                          value={selectedProjectId}
                          onChange={e => setSelectedProjectId(e.target.value)}
                        >
                          <option value="">None</option>
                          {publicProjects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {newPost.type === 'project' && loadingProjects && (
                      <div className="text-sm text-gray-400">Loading your projects...</div>
                    )}
                    {newPost.type === 'project' && !loadingProjects && publicProjects.length === 0 && user?.id && (
                      <div className="text-sm text-gray-400">No public projects found. Create a public project to link it here.</div>
                    )}
                    {newPost.type === 'project' && selectedProjectId && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showSupport"
                          checked={newPost.showSupport}
                          onChange={e => setNewPost({ ...newPost, showSupport: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500"
                        />
                        <label htmlFor="showSupport" className="text-sm text-gray-300 cursor-pointer">
                          Include Support Button
                        </label>
                      </div>
                    )}
                    {newPost.type === 'deal' && publicDeals.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Link to Deal (optional)</label>
                        <select
                          className="w-full rounded border-gray-700 bg-gray-900 text-white p-2"
                          value={selectedDealId}
                          onChange={e => setSelectedDealId(e.target.value)}
                        >
                          <option value="">None</option>
                          {publicDeals.map((deal) => (
                            <option key={deal.id} value={deal.id}>
                              {deal.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {newPost.type === 'deal' && loadingDeals && (
                      <div className="text-sm text-gray-400">Loading your deals...</div>
                    )}
                    {newPost.type === 'deal' && !loadingDeals && publicDeals.length === 0 && user?.id && (
                      <div className="text-sm text-gray-400">No public deals found. Create a public deal to link it here.</div>
                    )}
                    {newPost.type === 'job' && userJobs.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Link to Job (optional)</label>
                        <select
                          className="w-full rounded border-gray-700 bg-gray-900 text-white p-2"
                          value={selectedJobId}
                          onChange={e => setSelectedJobId(e.target.value)}
                        >
                          <option value="">None</option>
                          {userJobs.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.title} - {job.company}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {newPost.type === 'job' && loadingJobs && (
                      <div className="text-sm text-gray-400">Loading your jobs...</div>
                    )}
                    {newPost.type === 'job' && !loadingJobs && userJobs.length === 0 && user?.id && (
                      <div className="text-sm text-gray-400">No active jobs found. Create a job to link it here.</div>
                    )}
                    <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <div className="relative">
                      <textarea
                        className="w-full rounded border-gray-700 bg-gray-900 text-white p-2 min-h-[80px] pr-10"
                          value={newPost.content}
                        onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                        placeholder="What's on your mind?"
                          required
                      />
                      {newPost.content.trim() && (
                        <button
                          type="button"
                          onClick={handleEnhancePost}
                          disabled={enhancingPost}
                          className="absolute bottom-3 right-3 p-1.5 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enhance with AI"
                        >
                          {enhancingPost ? (
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          )}
                        </button>
                      )}
                    </div>
                    </div>
                        <div>
                    <label className="block text-sm font-medium mb-1">Media (optional)</label>
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
                    />
                      {mediaPreview.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {mediaPreview.map((url, idx) => (
                          <div key={idx} className="relative group">
                            {url.match(/image\//) ? (
                              <img src={url} alt="preview" className="w-20 h-20 object-cover rounded" />
                              ) : (
                              <video src={url} className="w-20 h-20 object-cover rounded" controls />
                              )}
                              <button
                                type="button"
                              className="absolute top-0 right-0 bg-black bg-opacity-60 text-white rounded-full p-1 text-xs"
                              onClick={() => handleRemoveMedia(idx)}
                              >
                              ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  <DialogFooter>
                    <Button type="submit" className="gradient-button w-full" disabled={uploadingMedia || enhancingPost}>
                      {uploadingMedia ? 'Posting...' : 'Post'}
                      </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="w-full mt-2">Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                  </form>
              </DialogContent>
            </Dialog>
          </>
            )}

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="project">Projects</TabsTrigger>
              <TabsTrigger value="deal">Deals</TabsTrigger>
              <TabsTrigger value="job">Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
            {loading ? (
              <div className="text-center text-gray-400">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-gray-400">No posts yet</div>
            ) : (
              posts.map((item, idx) => (
                <div key={item.id}>
                  <Card className="leonardo-card border-gray-800">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <button
                      className="flex items-center gap-2 group"
                      onClick={() => router.push(`/profile/${item.user.id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      aria-label={`View profile of ${item.user.name || 'Unknown User'}`}
                    >
                      <Avatar>
                          <AvatarImage src={item.user.avatar || undefined} />
                          <AvatarFallback>{item.user.name ? item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg group-hover:underline group-hover:text-purple-400 transition-colors">
                            {item.user.name || 'Unknown User'}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {item.user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{item.timestamp}</p>
                      </div>
                    </button>
                    {getIconForType(item.type)}
                  </CardHeader>
                  <CardContent>
                    {editingPostId === item.id ? (
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="mb-4 bg-gray-900 border-gray-700 min-h-[80px]"
                        autoFocus
                      />
                    ) : (
                    <p className="text-gray-200 mb-4">{item.content}</p>
                    )}
                    
                    {/* Media Display */}
                    {item.media && item.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {item.media.map((media: any, index: number) => (
                          <div key={index} className="relative group">
                            {media.type === 'image' ? (
                              <img
                                src={media.url}
                                alt={`Media ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={media.url}
                                className="w-full h-48 object-cover rounded-lg"
                                controls
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Project Details */}
                    {item.type === 'project' && (
                      <>
                        {(item.name || item.description || item.fundingGoal || item.currentFunding || (item.deadline && !isNaN(new Date(item.deadline).getTime())) || (item.team && item.team.length > 0)) && (
                        <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                            {item.name && (
                          <h3 className="font-semibold text-white mb-2">{item.name}</h3>
                            )}
                            {item.description && (
                          <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                            )}
                          <div className="space-y-2">
                              {item.fundingGoal && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Funding Goal</span>
                              <span className="text-white">${Number(item.fundingGoal).toLocaleString()}</span>
                            </div>
                              )}
                              {item.currentFunding && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Current Funding</span>
                                  <span className="text-white">${Number(item.currentFunding).toLocaleString()}</span>
                            </div>
                              )}
                              {item.deadline && !isNaN(new Date(item.deadline).getTime()) && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Deadline</span>
                              <span className="text-white">{new Date(item.deadline).toLocaleDateString()}</span>
                            </div>
                              )}
                              {item.team && item.team.length > 0 && (
                              <div className="mt-4">
                                <span className="text-gray-400 text-sm">Team Members:</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {item.team.map((member: any) => (
                                    <Button
                                      key={member.id}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => router.push(`/profile/${member.id}`)}
                                    >
                                      {member.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        )}
                        {item.projectId && (
                          <div className="mb-4 space-y-2">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => router.push(`/publicprojects/${item.projectId}`)}
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              View Project Page
                            </Button>
                            {item.showSupport && projectSupportInfo[item.projectId]?.accepts_support && (
                              <div className="bg-pink-500/10 rounded-lg p-4">
                                {(projectSupportInfo[item.projectId].funding_goal || projectSupportInfo[item.projectId].current_funding) && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center text-pink-400">
                                        <Heart className="w-4 h-4 mr-2" />
                                        <span className="text-sm">Support Received</span>
                                      </div>
                                      <span className="text-white font-medium text-sm">
                                        ${(projectSupportInfo[item.projectId].current_funding || 0).toLocaleString()} / ${(projectSupportInfo[item.projectId].funding_goal || 0).toLocaleString()}
                                      </span>
                                    </div>
                                    {projectSupportInfo[item.projectId].funding_goal && (
                                      <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                          className="bg-pink-500 h-2 rounded-full"
                                          style={{ 
                                            width: `${projectSupportInfo[item.projectId].funding_goal && projectSupportInfo[item.projectId].current_funding 
                                              ? Math.min((projectSupportInfo[item.projectId].current_funding! / projectSupportInfo[item.projectId].funding_goal! * 100), 100).toFixed(0) 
                                              : 0}%` 
                                          }}
                                        ></div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <Button
                                  className="w-full bg-pink-600 hover:bg-pink-700"
                                  onClick={() => router.push(`/purchase2support/${item.projectId}`)}
                                >
                                  <Heart className="w-4 h-4 mr-2" />
                                  Support This Project
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Deal Details */}
                    {item.type === 'deal' && (
                      <>
                        {!item.dealId && (item.value || item.status || (item.partners && item.partners.length > 0)) && (
                        <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                          {item.value && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Deal Value</span>
                            <span className="text-white font-semibold">${Number(item.value).toLocaleString()}</span>
                          </div>
                          )}
                          {item.status && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">Status</span>
                            <Badge variant="secondary">{item.status}</Badge>
                          </div>
                          )}
                          {item.partners && item.partners.length > 0 && (
                          <div className="mt-2">
                            <span className="text-gray-400">Partners:</span>
                            <div className="flex gap-2 mt-1">
                                {item.partners.map((partner: any, idx: number) => (
                                <Button
                                  key={typeof partner === 'string' ? `partner-${idx}-${partner}` : partner.id || `partner-${idx}`}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => router.push(`/profile/${typeof partner === 'object' ? partner.id : partner}`)}
                                >
                                  {typeof partner === 'object' ? partner.name : partner}
                                </Button>
                              ))}
                            </div>
                          </div>
                          )}
                        </div>
                        )}
                        {item.dealId && (
                          <div className="mb-4">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => router.push(`/deals/${item.dealId}`)}
                            >
                              <Handshake className="w-4 h-4 mr-2" />
                              View Deal Page
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Milestone Details */}
                    {item.type === 'milestone' && (
                      (item.project || item.achievement || (item.team && item.team.length > 0)) && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                          {item.project && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Project</span>
                          <span className="text-white">{item.project}</span>
                        </div>
                          )}
                          {item.achievement && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Achievement</span>
                          <span className="text-white">{item.achievement}</span>
                        </div>
                          )}
                          {item.team && item.team.length > 0 && (
                          <div className="mt-4">
                            <span className="text-gray-400 text-sm">Team Members:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.team.map((member: any) => (
                                <Button
                                  key={member.id}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => router.push(`/profile/${member.id}`)}
                                >
                                  {member.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      )
                    )}

                    {/* Job Details */}
                    {item.type === 'job' && item.jobId && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/jobs/${item.jobId}`)}
                        >
                          <Briefcase className="w-4 h-4 mr-2" />
                          View Job Page
                        </Button>
                      </div>
                    )}

                    {/* Partnership Details */}
                    {item.type === 'partnership' && (
                      ((item.newPartners && item.newPartners.length > 0 && item.newPartners[0]) || item.focus) && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                          {item.newPartners && item.newPartners.length > 0 && item.newPartners[0] && (
                        <div className="mb-2">
                          <span className="text-gray-400">New Partners:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.newPartners.map((partner: any, idx: number) => (
                              <Button
                                key={typeof partner === 'string' ? `newpartner-${idx}-${partner}` : partner.id || `newpartner-${idx}`}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => router.push(`/profile/${typeof partner === 'object' ? partner.id : partner}`)}
                              >
                                {typeof partner === 'object' ? partner.name : partner}
                              </Button>
                            ))}
                          </div>
                        </div>
                          )}
                          {item.focus && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Focus Area</span>
                          <span className="text-white">{item.focus}</span>
                        </div>
                          )}
                      </div>
                      )
                    )}

                    {/* Interaction Buttons */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.likedByCurrentUser ? "text-pink-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'like')}
                      >
                        <span className="text-lg mr-2" role="img" aria-label="clap">👏</span>
                        {Number(item.likes) || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.dislikedByCurrentUser ? "text-blue-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'dislike')}
                      >
                        <ThumbsDown className={`w-4 h-4 mr-2 ${item.dislikedByCurrentUser ? "fill-blue-500" : ""}`} />
                        {Number(item.dislikes) || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-white"
                        onClick={() => handleShowCommentBox(item.id)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {Number(item.comments) || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-white"
                        onClick={() => handleInteraction(item.id, 'share')}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        {Number(item.shares) || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.smhByCurrentUser ? "text-yellow-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'smh')}
                      >
                        <span className="text-lg mr-2" role="img" aria-label="smh">🤦</span>
                        {Number(item.smh) || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.trophyByCurrentUser ? "text-amber-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'trophy')}
                      >
                        <span className="text-lg mr-2" role="img" aria-label="trophy">🏆</span>
                        {Number(item.trophy) || 0}
                      </Button>
                    </div>

                    {/* Owner controls */}
                    {user && user.id === item.user.id && (
                      <div className="flex gap-2 ml-auto">
                        {editingPostId === item.id ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => handleSave(item)} title="Save">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditingPostId(null); setEditContent('') }} title="Cancel">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(item)} title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Comment input and comments */}
                    {showCommentBox[item.id] && (
                      <div className="mt-4 border-t border-gray-800 pt-4">
                        <div className="flex items-start gap-2 mb-4">
                          <Avatar>
                              <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                              <AvatarFallback>{user?.user_metadata?.name ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                          </Avatar>
                          <Textarea
                            value={commentInputs[item.id] || ''}
                            onChange={e => handleCommentInput(item.id, e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 min-h-[60px] bg-gray-900 border-gray-700"
                            disabled={!user}
                          />
                          <Button
                            onClick={() => handleCommentSubmit(item.id)}
                            disabled={!user || !commentInputs[item.id]?.trim()}
                            className="self-end"
                          >
                            Post
                          </Button>
                        </div>
                        {loadingComments[item.id] ? (
                          <div className="text-gray-400">Loading comments...</div>
                        ) : (
                          <div className="space-y-3">
                            {(comments[item.id] || []).length === 0 ? (
                              <div className="text-gray-500 text-sm">No comments yet.</div>
                            ) : (
                              comments[item.id].map((c: any) => (
                                <div key={c.id} className="flex items-start gap-2">
                                  <Avatar>
                                      <AvatarImage src={c.user.avatar || undefined} />
                                      <AvatarFallback>{c.user.name ? c.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-sm font-semibold text-white">{c.user.name}</div>
                                    <div className="text-gray-300 text-sm">{c.content}</div>
                                    <div className="text-xs text-gray-500">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                  {(idx + 1) % 5 === 0 && <AdsenseAd />}
                </div>
              ))
            )}
            </TabsContent>

          <TabsContent value="project" className="space-y-6">
            {posts.filter(item => item.type === 'project').map((item) => (
                <Card key={item.id} className="leonardo-card border-gray-800">
                <CardHeader className="flex flex-row items-center gap-4">
                  <button
                    className="flex items-center gap-2 group"
                    onClick={() => router.push(`/profile/${item.user.id}`)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    aria-label={`View profile of ${item.user.name || 'Unknown User'}`}
                  >
                    <Avatar>
                      <AvatarImage src={item.user.avatar || undefined} />
                      <AvatarFallback>{item.user.name ? item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg group-hover:underline group-hover:text-purple-400 transition-colors">
                          {item.user.name || 'Unknown User'}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {item.user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{item.timestamp}</p>
                    </div>
                  </button>
                  {getIconForType(item.type)}
                </CardHeader>
                <CardContent>
                  {editingPostId === item.id ? (
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="mb-4 bg-gray-900 border-gray-700 min-h-[80px]"
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-200 mb-4">{item.content}</p>
                  )}
                  
                  {/* Media Display */}
                  {item.media && item.media.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {item.media.map((media: any, index: number) => (
                        <div key={index} className="relative group">
                          {media.type === 'image' ? (
                            <img
                              src={media.url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-48 object-cover rounded-lg"
                              controls
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Project Details */}
                  {item.type === 'project' && (
                    <>
                      {(item.name || item.description || item.fundingGoal || item.currentFunding || (item.deadline && !isNaN(new Date(item.deadline).getTime())) || (item.team && item.team.length > 0)) && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                          {item.name && (
                        <h3 className="font-semibold text-white mb-2">{item.name}</h3>
                          )}
                          {item.description && (
                        <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                          )}
                        <div className="space-y-2">
                            {item.fundingGoal && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Funding Goal</span>
                            <span className="text-white">${Number(item.fundingGoal).toLocaleString()}</span>
                          </div>
                            )}
                            {item.currentFunding && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Current Funding</span>
                                  <span className="text-white">${Number(item.currentFunding).toLocaleString()}</span>
                          </div>
                              )}
                              {item.deadline && !isNaN(new Date(item.deadline).getTime()) && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Deadline</span>
                            <span className="text-white">{new Date(item.deadline).toLocaleDateString()}</span>
                          </div>
                              )}
                              {item.team && item.team.length > 0 && (
                            <div className="mt-4">
                              <span className="text-gray-400 text-sm">Team Members:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.team.map((member: any) => (
                                  <Button
                                    key={member.id}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => router.push(`/profile/${member.id}`)}
                                  >
                                    {member.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          </div>
                        </div>
                      )}
                      {item.projectId && (
                        <div className="mb-4 space-y-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/publicprojects/${item.projectId}`)}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            View Project Page
                          </Button>
                          {item.showSupport && projectSupportInfo[item.projectId]?.accepts_support && (
                            <div className="bg-pink-500/10 rounded-lg p-4">
                              {(projectSupportInfo[item.projectId].funding_goal || projectSupportInfo[item.projectId].current_funding) && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center text-pink-400">
                                      <Heart className="w-4 h-4 mr-2" />
                                      <span className="text-sm">Support Received</span>
                                    </div>
                                    <span className="text-white font-medium text-sm">
                                      ${(projectSupportInfo[item.projectId].current_funding || 0).toLocaleString()} / ${(projectSupportInfo[item.projectId].funding_goal || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  {projectSupportInfo[item.projectId].funding_goal && (
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                      <div
                                        className="bg-pink-500 h-2 rounded-full"
                                        style={{ 
                                          width: `${projectSupportInfo[item.projectId].funding_goal && projectSupportInfo[item.projectId].current_funding 
                                            ? Math.min((projectSupportInfo[item.projectId].current_funding! / projectSupportInfo[item.projectId].funding_goal! * 100), 100).toFixed(0) 
                                            : 0}%` 
                                        }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <Button
                                className="w-full bg-pink-600 hover:bg-pink-700"
                                onClick={() => router.push(`/purchase2support/${item.projectId}`)}
                              >
                                <Heart className="w-4 h-4 mr-2" />
                                Support This Project
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                    {/* Interaction Buttons */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.likedByCurrentUser ? "text-pink-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'like')}
                      >
                        <span className="text-lg mr-2" role="img" aria-label="clap">👏</span>
                        {Number(item.likes) || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.dislikedByCurrentUser ? "text-blue-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'dislike')}
                      >
                        <ThumbsDown className={`w-4 h-4 mr-2 ${item.dislikedByCurrentUser ? "fill-blue-500" : ""}`} />
                        {Number(item.dislikes) || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {Number(item.comments) || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Share2 className="w-4 h-4 mr-2" />
                        {Number(item.shares) || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.smhByCurrentUser ? "text-yellow-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'smh')}
                      >
                        <span className="text-lg mr-2" role="img" aria-label="smh">🤦</span>
                        {Number(item.smh) || 0}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.trophyByCurrentUser ? "text-amber-500" : "text-gray-400 hover:text-white"}
                        onClick={() => handleInteraction(item.id, 'trophy')}
                      >
                        <span className="text-lg mr-2" role="img" aria-label="trophy">🏆</span>
                        {Number(item.trophy) || 0}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

          <TabsContent value="deal" className="space-y-6">
            {posts.filter(item => item.type === 'deal').map((item) => (
                <Card key={item.id} className="leonardo-card border-gray-800">
                <CardHeader className="flex flex-row items-center gap-4">
                  <button
                    className="flex items-center gap-2 group"
                    onClick={() => router.push(`/profile/${item.user.id}`)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    aria-label={`View profile of ${item.user.name || 'Unknown User'}`}
                  >
                    <Avatar>
                      <AvatarImage src={item.user.avatar || undefined} />
                      <AvatarFallback>{item.user.name ? item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg group-hover:underline group-hover:text-purple-400 transition-colors">
                          {item.user.name || 'Unknown User'}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {item.user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{item.timestamp}</p>
                    </div>
                  </button>
                  {getIconForType(item.type)}
                </CardHeader>
                <CardContent>
                  {editingPostId === item.id ? (
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="mb-4 bg-gray-900 border-gray-700 min-h-[80px]"
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-200 mb-4">{item.content}</p>
                  )}
                  
                  {/* Media Display */}
                  {item.media && item.media.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {item.media.map((media: any, index: number) => (
                        <div key={index} className="relative group">
                          {media.type === 'image' ? (
                            <img
                              src={media.url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-48 object-cover rounded-lg"
                              controls
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Deal Details */}
                  {item.type === 'deal' && (
                    <>
                      {!item.dealId && (item.value || item.status || (item.partners && item.partners.length > 0)) && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                          {item.value && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Deal Value</span>
                          <span className="text-white font-semibold">${Number(item.value).toLocaleString()}</span>
                        </div>
                          )}
                          {item.status && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Status</span>
                          <Badge variant="secondary">{item.status}</Badge>
                        </div>
                          )}
                          {item.partners && item.partners.length > 0 && (
                          <div className="mt-2">
                            <span className="text-gray-400">Partners:</span>
                            <div className="flex gap-2 mt-1">
                                {item.partners.map((partner: any, idx: number) => (
                                <Button
                                  key={typeof partner === 'string' ? `partner-${idx}-${partner}` : partner.id || `partner-${idx}`}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => router.push(`/profile/${typeof partner === 'object' ? partner.id : partner}`)}
                                >
                                  {typeof partner === 'object' ? partner.name : partner}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      )}
                      {item.dealId && (
                        <div className="mb-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/deals/${item.dealId}`)}
                          >
                            <Handshake className="w-4 h-4 mr-2" />
                            View Deal Page
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Interaction Buttons */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.likedByCurrentUser ? "text-pink-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'like')}
                    >
                      <span className="text-lg mr-2" role="img" aria-label="clap">👏</span>
                      {Number(item.likes) || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.dislikedByCurrentUser ? "text-blue-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'dislike')}
                    >
                      <ThumbsDown className={`w-4 h-4 mr-2 ${item.dislikedByCurrentUser ? "fill-blue-500" : ""}`} />
                      {Number(item.dislikes) || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {Number(item.comments) || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Share2 className="w-4 h-4 mr-2" />
                      {Number(item.shares) || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.smhByCurrentUser ? "text-yellow-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'smh')}
                    >
                      <span className="text-lg mr-2" role="img" aria-label="smh">🤦</span>
                      {Number(item.smh) || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.trophyByCurrentUser ? "text-amber-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'trophy')}
                    >
                      <span className="text-lg mr-2" role="img" aria-label="trophy">🏆</span>
                      {Number(item.trophy) || 0}
                    </Button>
                  </div>
                </CardContent>
                </Card>
              ))}
            </TabsContent>

          <TabsContent value="job" className="space-y-6">
            {posts.filter(item => item.type === 'job').map((item) => (
                <Card key={item.id} className="leonardo-card border-gray-800">
                <CardHeader className="flex flex-row items-center gap-4">
                  <button
                    className="flex items-center gap-2 group"
                    onClick={() => router.push(`/profile/${item.user.id}`)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    aria-label={`View profile of ${item.user.name || 'Unknown User'}`}
                  >
                    <Avatar>
                      <AvatarImage src={item.user.avatar || undefined} />
                      <AvatarFallback>{item.user.name ? item.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg group-hover:underline group-hover:text-purple-400 transition-colors">
                          {item.user.name || 'Unknown User'}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {item.user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{item.timestamp}</p>
                    </div>
                  </button>
                  {getIconForType(item.type)}
                </CardHeader>
                <CardContent>
                  {editingPostId === item.id ? (
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="mb-4 bg-gray-900 border-gray-700 min-h-[80px]"
                      autoFocus
                    />
                  ) : (
                    <p className="text-gray-200 mb-4">{item.content}</p>
                  )}
                  
                  {/* Media Display */}
                  {item.media && item.media.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {item.media.map((media: any, index: number) => (
                        <div key={index} className="relative group">
                          {media.type === 'image' ? (
                            <img
                              src={media.url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-48 object-cover rounded-lg"
                              controls
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Job Details */}
                  {item.type === 'job' && item.jobId && (
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/jobs/${item.jobId}`)}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        View Job Page
                      </Button>
                    </div>
                  )}

                  {/* Interaction Buttons */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.likedByCurrentUser ? "text-pink-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'like')}
                    >
                      <span className="text-lg mr-2" role="img" aria-label="clap">👏</span>
                      {Number(item.likes) || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.dislikedByCurrentUser ? "text-blue-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'dislike')}
                    >
                      <ThumbsDown className={`w-4 h-4 mr-2 ${item.dislikedByCurrentUser ? "fill-blue-500" : ""}`} />
                      {Number(item.dislikes) || 0}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-white"
                      onClick={() => handleShowCommentBox(item.id)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {Number(item.comments) || 0}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-white"
                      onClick={() => handleInteraction(item.id, 'share')}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {Number(item.shares) || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.smhByCurrentUser ? "text-yellow-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'smh')}
                    >
                      <span className="text-lg mr-2" role="img" aria-label="smh">🤦</span>
                      {Number(item.smh) || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={item.trophyByCurrentUser ? "text-amber-500" : "text-gray-400 hover:text-white"}
                      onClick={() => handleInteraction(item.id, 'trophy')}
                    >
                      <span className="text-lg mr-2" role="img" aria-label="trophy">🏆</span>
                      {Number(item.trophy) || 0}
                    </Button>
                  </div>

                  {/* Owner controls */}
                  {user && user.id === item.user.id && (
                    <div className="flex gap-2 ml-auto">
                      {editingPostId === item.id ? (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => handleSave(item)} title="Save">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { setEditingPostId(null); setEditContent('') }} title="Cancel">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(item)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Comment input and comments */}
                  {showCommentBox[item.id] && (
                    <div className="mt-4 border-t border-gray-800 pt-4">
                      <div className="flex items-start gap-2 mb-4">
                        <Avatar>
                            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                            <AvatarFallback>{user?.user_metadata?.name ? user.user_metadata.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <Textarea
                          value={commentInputs[item.id] || ''}
                          onChange={e => handleCommentInput(item.id, e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 min-h-[60px] bg-gray-900 border-gray-700"
                          disabled={!user}
                        />
                        <Button
                          onClick={() => handleCommentSubmit(item.id)}
                          disabled={!user || !commentInputs[item.id]?.trim()}
                          className="self-end"
                        >
                          Post
                        </Button>
                      </div>
                      {loadingComments[item.id] ? (
                        <div className="text-gray-400">Loading comments...</div>
                      ) : (
                        <div className="space-y-3">
                          {(comments[item.id] || []).length === 0 ? (
                            <div className="text-gray-500 text-sm">No comments yet.</div>
                          ) : (
                            comments[item.id].map((c: any) => (
                              <div key={c.id} className="flex items-start gap-2">
                                <Avatar>
                                    <AvatarImage src={c.user.avatar || undefined} />
                                    <AvatarFallback>{c.user.name ? c.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-semibold text-white">{c.user.name}</div>
                                  <div className="text-gray-300 text-sm">{c.content}</div>
                                  <div className="text-xs text-gray-500">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          </Tabs>
        </main>
    </div>
  )
} 
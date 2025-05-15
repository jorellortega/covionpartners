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
  File
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
} from "@/components/ui/dialog"

interface PostInteraction {
  type: string;
  count: number;
}

export default function FeedPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
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

  useEffect(() => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    fetchPosts()
  }, [activeTab, user])

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
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
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

        if (uploadError) throw uploadError

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
        .single()

      if (postError) throw postError

      // Create the post details
      const detailsData = {
        type: newPost.type,
        data: {
          ...(newPost[newPost.type as keyof typeof newPost] as Record<string, any>),
          media_urls: mediaUrls
        }
      }

      const { error: detailsError } = await supabase
        .from('post_details')
        .insert({
          post_id: post.id,
          ...detailsData
        })

      if (detailsError) throw detailsError

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
      partnership: {
        newPartners: [''],
        focus: ''
      }
    })
      setMediaFiles([])
      setMediaPreview([])
    setShowCreateForm(false)
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleInteraction = async (postId: string, type: 'like' | 'dislike' | 'share' | 'smh' | 'trophy') => {
    if (!user) return;
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
      case 'partnership':
        return <Users className="w-5 h-5 text-yellow-400" />
      default:
        return <Globe className="w-5 h-5 text-gray-400" />
    }
  }

  const handleEdit = (post: any) => {
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
    setShowCommentBox(prev => ({ ...prev, [postId]: !prev[postId] }))
    if (!comments[postId]) fetchComments(postId)
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

  if (!user) {
    return (
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Sign in Required</DialogTitle>
            <DialogDescription className="text-gray-400">
              You need to be signed in to access the activity feed. Please sign in or create an account to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-gray-700 hover:bg-gray-800"
            >
              Go Back
            </Button>
            <Button 
              className="gradient-button"
              onClick={() => router.push('/account-types')}
            >
              Sign in or Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
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
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Create Post Button */}
          <div className="mb-8">
            {!showCreateForm ? (
              <Button 
                className="w-full gradient-button"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            ) : (
              <Card className="leonardo-card border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Create New Post</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setShowCreateForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-200 block mb-2">
                        Post Type
                      </label>
                      <Select
                        value={newPost.type}
                        onValueChange={(value) => setNewPost({ ...newPost, type: value })}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700">
                          <SelectValue placeholder="Select post type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="deal">Deal</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-200 block mb-2">
                        Content
                      </label>
                      <Textarea
                        placeholder="What's on your mind?"
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        className="bg-gray-900 border-gray-700 min-h-[100px]"
                        required
                      />
                    </div>

                    {/* Project Fields */}
                    {newPost.type === 'project' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Project Name (Optional)
                          </label>
                          <input
                            type="text"
                            value={newPost.project.name}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              project: { ...newPost.project, name: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Description (Optional)
                          </label>
                          <Textarea
                            value={newPost.project.description}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              project: { ...newPost.project, description: e.target.value }
                            })}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-200 block mb-2">
                              Funding Goal (Optional)
                            </label>
                            <input
                              type="number"
                              value={newPost.project.fundingGoal}
                              onChange={(e) => setNewPost({
                                ...newPost,
                                project: { ...newPost.project, fundingGoal: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-200 block mb-2">
                              Deadline (Optional)
                            </label>
                            <input
                              type="date"
                              value={newPost.project.deadline}
                              onChange={(e) => setNewPost({
                                ...newPost,
                                project: { ...newPost.project, deadline: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Deal Fields */}
                    {newPost.type === 'deal' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Deal Value (Optional)
                          </label>
                          <input
                            type="number"
                            value={newPost.deal.value}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              deal: { ...newPost.deal, value: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Status (Optional)
                          </label>
                          <Select
                            value={newPost.deal.status}
                            onValueChange={(value) => setNewPost({
                              ...newPost,
                              deal: { ...newPost.deal, status: value }
                            })}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Milestone Fields */}
                    {newPost.type === 'milestone' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Project (Optional)
                          </label>
                          <input
                            type="text"
                            value={newPost.milestone.project}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              milestone: { ...newPost.milestone, project: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Achievement (Optional)
                          </label>
                          <input
                            type="text"
                            value={newPost.milestone.achievement}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              milestone: { ...newPost.milestone, achievement: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Partnership Fields */}
                    {newPost.type === 'partnership' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            New Partners (Optional)
                          </label>
                          <input
                            type="text"
                            value={newPost.partnership.newPartners[0]}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              partnership: { ...newPost.partnership, newPartners: [e.target.value] }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            placeholder="Enter partner names separated by commas"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Focus Area (Optional)
                          </label>
                          <input
                            type="text"
                            value={newPost.partnership.focus}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              partnership: { ...newPost.partnership, focus: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-200 block mb-2">
                        Media
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="media-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-700 hover:bg-gray-800"
                            onClick={() => document.getElementById('media-upload')?.click()}
                          >
                            <Image className="w-4 h-4 mr-2" />
                            Add Media
                          </Button>
                        </label>
                        {mediaFiles.length > 0 && (
                          <span className="text-sm text-gray-400">
                            {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
                          </span>
                        )}
                      </div>
                      
                      {/* Media Preview */}
                      {mediaPreview.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {mediaPreview.map((url, index) => (
                            <div key={index} className="relative group">
                              {url.startsWith('data:image') ? (
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ) : (
                                <video
                                  src={url}
                                  className="w-full h-32 object-cover rounded-lg"
                                  controls
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false)
                          setMediaFiles([])
                          setMediaPreview([])
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="gradient-button"
                        disabled={uploadingMedia}
                      >
                        {uploadingMedia ? 'Uploading...' : 'Post'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="project" disabled style={{ opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' }}>Projects</TabsTrigger>
              <TabsTrigger value="deal" disabled style={{ opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' }}>Deals</TabsTrigger>
              <TabsTrigger value="partnership" disabled style={{ opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' }}>Partnerships</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
            {loading ? (
              <div className="text-center text-gray-400">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-gray-400">No posts yet</div>
            ) : (
              posts.map((item) => (
                <Card key={item.id} className="leonardo-card border-gray-800">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <button
                      className="flex items-center gap-2 group"
                      onClick={() => router.push(`/profile/${item.user.id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      aria-label={`View profile of ${item.user.name || 'Unknown User'}`}
                    >
                      <Avatar>
                        <AvatarImage src={item.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name || 'Unknown User'}`} />
                        <AvatarFallback>{item.user.name ? item.user.name[0] : 'U'}</AvatarFallback>
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
                      (item.name || item.description || item.fundingGoal || item.currentFunding || (item.deadline && !isNaN(new Date(item.deadline).getTime())) || (item.team && item.team.length > 0)) && (
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
                      )
                    )}

                    {/* Deal Details */}
                    {item.type === 'deal' && (
                      (item.value || item.status || (item.partners && item.partners.length > 0)) && (
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
                              {item.partners.map((partner: any) => (
                              <Button
                                key={partner.id}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => router.push(`/profile/${partner.id}`)}
                              >
                                {partner.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                        )}
                      </div>
                    )
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

                    {/* Partnership Details */}
                    {item.type === 'partnership' && (
                      ((item.newPartners && item.newPartners.length > 0 && item.newPartners[0]) || item.focus) && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                          {item.newPartners && item.newPartners.length > 0 && item.newPartners[0] && (
                        <div className="mb-2">
                          <span className="text-gray-400">New Partners:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.newPartners.map((partner: any) => (
                              <Button
                                key={partner.id}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => router.push(`/profile/${partner.id}`)}
                              >
                                {partner.name}
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
                            <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                            <AvatarFallback>{user?.user_metadata?.name ? user.user_metadata.name[0] : 'U'}</AvatarFallback>
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
                                    <AvatarImage src={c.user.avatar || ''} />
                                    <AvatarFallback>{c.user.name ? c.user.name[0] : 'U'}</AvatarFallback>
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
                      <AvatarImage src={item.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name || 'Unknown User'}`} />
                      <AvatarFallback>{item.user.name ? item.user.name[0] : 'U'}</AvatarFallback>
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
                    (item.name || item.description || item.fundingGoal || item.currentFunding || (item.deadline && !isNaN(new Date(item.deadline).getTime())) || (item.team && item.team.length > 0)) && (
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
                      <AvatarImage src={item.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name || 'Unknown User'}`} />
                      <AvatarFallback>{item.user.name ? item.user.name[0] : 'U'}</AvatarFallback>
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
                    (item.value || item.status || (item.partners && item.partners.length > 0)) && (
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
                              {item.partners.map((partner: any) => (
                              <Button
                                key={partner.id}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => router.push(`/profile/${partner.id}`)}
                              >
                                {partner.name}
                              </Button>
                            ))}
                          </div>
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

          <TabsContent value="partnership" className="space-y-6">
            {posts.filter(item => item.type === 'partnership').map((item) => (
                <Card key={item.id} className="leonardo-card border-gray-800">
                <CardHeader className="flex flex-row items-center gap-4">
                  <button
                    className="flex items-center gap-2 group"
                    onClick={() => router.push(`/profile/${item.user.id}`)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    aria-label={`View profile of ${item.user.name || 'Unknown User'}`}
                  >
                    <Avatar>
                      <AvatarImage src={item.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name || 'Unknown User'}`} />
                      <AvatarFallback>{item.user.name ? item.user.name[0] : 'U'}</AvatarFallback>
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
                  
                  {/* Partnership Details */}
                  {item.type === 'partnership' && (
                    ((item.newPartners && item.newPartners.length > 0 && item.newPartners[0]) || item.focus) && (
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                        {item.newPartners && item.newPartners.length > 0 && item.newPartners[0] && (
                      <div className="mb-2">
                        <span className="text-gray-400">New Partners:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.newPartners.map((partner: any) => (
                            <Button
                              key={partner.id}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => router.push(`/profile/${partner.id}`)}
                            >
                              {partner.name}
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
          </Tabs>
        </main>
    </div>
  )
} 
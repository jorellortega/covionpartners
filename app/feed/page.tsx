"use client"

import { useState } from 'react'
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
  LayoutDashboard
} from 'lucide-react'

// Mock data for the feed
const mockFeedData = [
  {
    id: 1,
    type: 'project',
    user: {
      id: 'sarah-johnson',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      role: 'Project Manager'
    },
    content: 'Just launched our new sustainable energy project! Looking for partners to join this exciting venture.',
    project: {
      name: 'Green Energy Initiative',
      description: 'A sustainable energy project focused on solar power implementation.',
      fundingGoal: 500000,
      currentFunding: 150000,
      deadline: '2024-12-31',
      team: [
        { id: 'michael-chen', name: 'Michael Chen', role: 'Technical Lead' },
        { id: 'emma-rodriguez', name: 'Emma Rodriguez', role: 'Sustainability Expert' }
      ]
    },
    timestamp: '2 hours ago',
    likes: 45,
    comments: 12,
    shares: 8
  },
  {
    id: 2,
    type: 'deal',
    user: {
      id: 'michael-chen',
      name: 'Michael Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      role: 'Investment Director'
    },
    content: 'Excited to announce our latest partnership with TechCorp! This collaboration will bring innovative solutions to market.',
    deal: {
      value: 2500000,
      status: 'Completed',
      partners: [
        { id: 'techcorp', name: 'TechCorp', role: 'Technology Partner' },
        { id: 'innovatex', name: 'InnovateX', role: 'Innovation Partner' }
      ]
    },
    timestamp: '5 hours ago',
    likes: 78,
    comments: 24,
    shares: 15
  },
  {
    id: 3,
    type: 'milestone',
    user: {
      id: 'emma-rodriguez',
      name: 'Emma Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      role: 'Project Lead'
    },
    content: 'We\'ve reached 75% of our funding goal for the Urban Development Project! Thank you to all our supporters.',
    milestone: {
      project: 'Urban Development Project',
      achievement: '75% Funding Goal',
      target: '100%',
      team: [
        { id: 'david-kim', name: 'David Kim', role: 'Development Lead' },
        { id: 'sarah-johnson', name: 'Sarah Johnson', role: 'Project Manager' }
      ]
    },
    timestamp: '1 day ago',
    likes: 92,
    comments: 31,
    shares: 19
  },
  {
    id: 4,
    type: 'partnership',
    user: {
      id: 'david-kim',
      name: 'David Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      role: 'Business Development'
    },
    content: 'Welcoming three new partners to our ecosystem! Together, we\'ll drive innovation in sustainable technology.',
    partnership: {
      newPartners: [
        { id: 'ecotech', name: 'EcoTech', role: 'Environmental Partner' },
        { id: 'greensolutions', name: 'GreenSolutions', role: 'Sustainability Partner' },
        { id: 'futureenergy', name: 'FutureEnergy', role: 'Energy Partner' }
      ],
      focus: 'Sustainable Technology'
    },
    timestamp: '2 days ago',
    likes: 65,
    comments: 18,
    shares: 12
  }
]

export default function FeedPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
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

  // Mock current user ID (replace with real user context if available)
  const currentUserId = 'current-user-id'

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the post to your backend
    console.log('Creating new post:', newPost)
    // Reset form and hide it
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
    setShowCreateForm(false)
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

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* Fade overlay */}
      <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block px-8 py-4 rounded-xl bg-gray-800/90 text-3xl font-bold text-white shadow-lg border-2 border-purple-500 animate-pulse">
            Under Development
          </span>
        </div>
      </div>
      {/* Existing content (faded underneath) */}
      <div className="opacity-40 pointer-events-none select-none">
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
                  onClick={() => router.push(`/profile/${currentUserId}`)}
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
                            Project Name
                          </label>
                          <input
                            type="text"
                            value={newPost.project.name}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              project: { ...newPost.project, name: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Description
                          </label>
                          <Textarea
                            value={newPost.project.description}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              project: { ...newPost.project, description: e.target.value }
                            })}
                            className="bg-gray-900 border-gray-700"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-200 block mb-2">
                              Funding Goal
                            </label>
                            <input
                              type="number"
                              value={newPost.project.fundingGoal}
                              onChange={(e) => setNewPost({
                                ...newPost,
                                project: { ...newPost.project, fundingGoal: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-200 block mb-2">
                              Deadline
                            </label>
                            <input
                              type="date"
                              value={newPost.project.deadline}
                              onChange={(e) => setNewPost({
                                ...newPost,
                                project: { ...newPost.project, deadline: e.target.value }
                              })}
                              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                              required
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
                            Deal Value
                          </label>
                          <input
                            type="number"
                            value={newPost.deal.value}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              deal: { ...newPost.deal, value: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Status
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
                            Project
                          </label>
                          <input
                            type="text"
                            value={newPost.milestone.project}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              milestone: { ...newPost.milestone, project: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Achievement
                          </label>
                          <input
                            type="text"
                            value={newPost.milestone.achievement}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              milestone: { ...newPost.milestone, achievement: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Partnership Fields */}
                    {newPost.type === 'partnership' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            New Partners
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
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-200 block mb-2">
                            Focus Area
                          </label>
                          <input
                            type="text"
                            value={newPost.partnership.focus}
                            onChange={(e) => setNewPost({
                              ...newPost,
                              partnership: { ...newPost.partnership, focus: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="gradient-button">
                        Post
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {mockFeedData.map((item) => (
                <Card key={item.id} className="leonardo-card border-gray-800">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <button
                      className="flex items-center gap-2 group"
                      onClick={() => router.push(`/profile/${item.user.id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      aria-label={`View profile of ${item.user.name}`}
                    >
                      <Avatar>
                        <AvatarImage src={item.user.avatar} />
                        <AvatarFallback>{item.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg group-hover:underline group-hover:text-purple-400 transition-colors">
                            {item.user.name}
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
                    <p className="text-gray-200 mb-4">{item.content}</p>
                    
                    {/* Project Details */}
                    {item.type === 'project' && item.project && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-white mb-2">{item.project.name}</h3>
                        <p className="text-gray-400 text-sm mb-3">{item.project.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Funding Goal</span>
                            <span className="text-white">${item.project.fundingGoal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Current Funding</span>
                            <span className="text-white">${item.project.currentFunding.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Deadline</span>
                            <span className="text-white">{new Date(item.project.deadline).toLocaleDateString()}</span>
                          </div>
                          {item.project.team && (
                            <div className="mt-4">
                              <span className="text-gray-400 text-sm">Team Members:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.project.team.map((member) => (
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

                    {/* Deal Details */}
                    {item.type === 'deal' && item.deal && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Deal Value</span>
                          <span className="text-white font-semibold">${item.deal.value.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Status</span>
                          <Badge variant="secondary">{item.deal.status}</Badge>
                        </div>
                        <div className="mt-2">
                          <span className="text-gray-400">Partners:</span>
                          <div className="flex gap-2 mt-1">
                            {item.deal.partners.map((partner) => (
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
                      </div>
                    )}

                    {/* Milestone Details */}
                    {item.type === 'milestone' && item.milestone && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400">Project</span>
                          <span className="text-white">{item.milestone.project}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Achievement</span>
                          <span className="text-white">{item.milestone.achievement}</span>
                        </div>
                        {item.milestone.team && (
                          <div className="mt-4">
                            <span className="text-gray-400 text-sm">Team Members:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.milestone.team.map((member) => (
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
                    )}

                    {/* Partnership Details */}
                    {item.type === 'partnership' && item.partnership && (
                      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                        <div className="mb-2">
                          <span className="text-gray-400">New Partners:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.partnership.newPartners.map((partner) => (
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
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Focus Area</span>
                          <span className="text-white">{item.partnership.focus}</span>
                        </div>
                      </div>
                    )}

                    {/* Interaction Buttons */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Heart className="w-4 h-4 mr-2" />
                        {item.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {item.comments}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Share2 className="w-4 h-4 mr-2" />
                        {item.shares}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              {mockFeedData.filter(item => item.type === 'project').map((item) => (
                // Same card structure as above
                <Card key={item.id} className="leonardo-card border-gray-800">
                  {/* ... (same content as above) ... */}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="deals" className="space-y-6">
              {mockFeedData.filter(item => item.type === 'deal').map((item) => (
                // Same card structure as above
                <Card key={item.id} className="leonardo-card border-gray-800">
                  {/* ... (same content as above) ... */}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="partnerships" className="space-y-6">
              {mockFeedData.filter(item => item.type === 'partnership').map((item) => (
                // Same card structure as above
                <Card key={item.id} className="leonardo-card border-gray-800">
                  {/* ... (same content as above) ... */}
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
} 
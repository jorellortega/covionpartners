"use client"

import { use } from 'react'
import { useState, useEffect } from 'react'
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
  Video
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
    image: string
    completionDate: string
    technologies: string[]
  }[]
  avatar_url?: string
}

const defaultProfileData: ProfileData = {
  id: '',
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

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch user profile data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          // Don't throw error, just use default data
        }

        // Fetch user's completed projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('completed_projects')
          .select('*')
          .eq('user_id', id)
          .order('completion_date', { ascending: false })

        if (projectsError) {
          console.error('Error fetching projects:', projectsError)
          // Don't throw error, just use empty array
        }

        // Transform the data into the expected format, using nullish coalescing for defaults
        const transformedData: ProfileData = {
          id: userData?.id || id,
          name: userData?.name || 'Anonymous User',
          role: userData?.role || 'User',
          bio: userData?.bio || 'No bio available',
          email: userData?.email || '',
          phone: userData?.phone || '',
          location: userData?.location || '',
          company: userData?.company || '',
          website: userData?.website || '',
          github: userData?.github || '',
          twitter: userData?.twitter || '',
          linkedin: userData?.linkedin || '',
          skills: userData?.skills || [],
          experience: userData?.experience || [],
          education: userData?.education || [],
          completed_projects: projectsData?.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description || '',
            image: project.image_url || '/placeholder-project.jpg',
            completionDate: project.completion_date || '',
            technologies: project.technologies || []
          })) || [],
          avatar_url: userData?.avatar_url || '/placeholder-avatar.jpg'
        }

        setProfileData(transformedData)
      } catch (err) {
        console.error('Error in profile data transformation:', err)
        setError('Failed to load profile data')
        toast.error('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [id])

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

  const currentMedia = mediaData[activeTab]
  const currentItem = currentMedia[currentMediaIndex]

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % currentMedia.length)
  }

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + currentMedia.length) % currentMedia.length)
  }

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
                      src={profileData.avatar_url}
                      alt={profileData.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">{profileData.name}</h1>
                  <p className="text-gray-400 mb-4">{profileData.role}</p>
                  <div className="flex gap-2 mb-6">
                    {profileData.company && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                        {profileData.company}
                      </Badge>
                    )}
                    {profileData.location && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                        {profileData.location}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-300 text-center mb-6">{profileData.bio}</p>
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
                          onSubmit={e => {
                            e.preventDefault();
                            toast.success('Message sent!');
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Subject</label>
                            <input type="text" className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white" required />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Message</label>
                            <textarea className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white" rows={4} required />
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="gradient-button w-full">Send Message</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    {/* Invite to Project Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Invite to Project</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite to Project</DialogTitle>
                          <DialogDescription>Select a project to invite this user to join.</DialogDescription>
                        </DialogHeader>
                        {/* For now, just a placeholder select. You can wire this up to your projects. */}
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            toast.success('Invitation sent!');
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Project</label>
                            <select className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-white" required>
                              <option value="">Select a project</option>
                              {/* TODO: Map over user's projects here */}
                              <option value="demo-project">Demo Project</option>
                            </select>
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="gradient-button w-full">Send Invite</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Button variant="outline" size="sm" disabled>Contact</Button>
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
                  {profileData.skills.length > 0 ? (
                    profileData.skills.map((skill, index) => (
                      <Badge key={index} className="bg-gray-800 text-gray-300 border-gray-700">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-400">No skills listed</p>
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
                  {profileData.experience.length > 0 ? (
                    profileData.experience.map((exp, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-800/30 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{exp.title}</h3>
                          <p className="text-gray-400">{exp.company}</p>
                          <p className="text-gray-500 text-sm">{exp.period}</p>
                          <p className="text-gray-300 mt-2">{exp.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No experience listed</p>
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
                  {profileData.education.length > 0 ? (
                    profileData.education.map((edu, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-800/30 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{edu.degree}</h3>
                          <p className="text-gray-400">{edu.school}</p>
                          <p className="text-gray-500 text-sm">{edu.period}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No education listed</p>
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
              </div>
            </div>
            <CardDescription>View photos and media from this profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Main Media Display */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800/30">
                {currentItem && (
                  currentItem.type === 'image' ? (
                    <Image
                      src={currentItem.url}
                      alt={currentItem.title}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      key={currentItem.url}
                      src={currentItem.url}
                      poster={currentItem.thumbnail || ''}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      autoPlay
                      muted
                      loop
                    />
                  )
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
                {profileData.completed_projects.map((project) => (
                  <div key={project.id} className="bg-gray-800/30 rounded-lg overflow-hidden">
                    <div className="relative h-48">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                    </div>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 
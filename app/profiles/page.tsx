"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  MapPin,
  Search,
  Filter,
  Users,
  Briefcase,
  BookOpen,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface Profile {
  id: string
  name: string
  role: string
  bio: string
  location: string
  company: string
  skills: string[]
  avatar_url: string
  user_id?: string
}

const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    role: 'Software Engineer',
    bio: 'Full-stack developer with 5+ years of experience in building scalable web applications. Specialized in React, Node.js, and cloud architecture.',
    location: 'San Francisco, CA',
    company: 'TechCorp',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'GraphQL'],
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'Product Manager',
    bio: 'Product leader with a focus on user-centered design and data-driven decision making. Passionate about creating impactful digital experiences.',
    location: 'New York, NY',
    company: 'InnovateX',
    skills: ['Product Strategy', 'Agile', 'User Research', 'Data Analysis', 'JIRA'],
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
  },
  {
    id: '3',
    name: 'Michael Rodriguez',
    role: 'UX Designer',
    bio: 'Creative problem solver with a keen eye for detail. Specialized in creating intuitive and beautiful user interfaces that drive engagement.',
    location: 'Austin, TX',
    company: 'DesignHub',
    skills: ['Figma', 'UI/UX', 'Prototyping', 'User Testing', 'Design Systems'],
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
  },
  {
    id: '4',
    name: 'Emily Wilson',
    role: 'Data Scientist',
    bio: 'Data enthusiast with expertise in machine learning and predictive analytics. Experienced in turning complex data into actionable insights.',
    location: 'Boston, MA',
    company: 'DataFlow',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Data Visualization'],
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
  },
  {
    id: '5',
    name: 'David Kim',
    role: 'DevOps Engineer',
    bio: 'Infrastructure specialist focused on building robust and scalable cloud environments. Expert in CI/CD and cloud security.',
    location: 'Seattle, WA',
    company: 'CloudScale',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Security'],
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    role: 'Marketing Director',
    bio: 'Strategic marketer with a track record of driving growth through innovative campaigns and data-driven strategies.',
    location: 'Chicago, IL',
    company: 'GrowthMarketing',
    skills: ['Digital Marketing', 'Content Strategy', 'SEO', 'Analytics', 'Social Media'],
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9'
  },
  {
    id: '7',
    name: 'James Taylor',
    role: 'Software Engineer',
    bio: 'Backend specialist with expertise in building high-performance APIs and microservices. Passionate about clean code and system architecture.',
    location: 'Denver, CO',
    company: 'CodeCraft',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST APIs', 'Microservices'],
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
  },
  {
    id: '8',
    name: 'Rachel Park',
    role: 'UX Designer',
    bio: 'User experience designer with a focus on accessibility and inclusive design. Creating digital experiences that work for everyone.',
    location: 'Portland, OR',
    company: 'DesignForAll',
    skills: ['Accessibility', 'UI/UX', 'User Research', 'Prototyping', 'WCAG'],
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9'
  },
  {
    id: '9',
    name: 'Carlos Mendez',
    role: 'Data Scientist',
    bio: 'Machine learning engineer specializing in natural language processing and computer vision applications.',
    location: 'Miami, FL',
    company: 'AILabs',
    skills: ['Python', 'NLP', 'Computer Vision', 'Deep Learning', 'TensorFlow'],
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
  }
]

export default function ProfilesPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // Fetch profiles and join users for avatar_url
        const { data, error } = await supabase
          .from('profiles')
          .select('*, users: user_id (avatar_url, name)')
          .order('created_at', { ascending: false })
        if (error) throw error
        // Map avatar_url from users table into each profile
        const merged = (data || []).map((profile: any) => ({
          ...profile,
          name: profile.name || (profile.users?.name ?? 'Unknown User'),
          avatar_url: profile.users?.avatar_url || profile.avatar_url || '/placeholder-avatar.jpg',
          user_id: profile.users?.user_id || profile.user_id
        }))
        // Only keep profiles with a valid user_id
        const filtered = merged.filter(profile => !!profile.user_id)
        setProfiles(filtered)
        setFilteredProfiles(filtered)
      } catch (error) {
        console.error('Error fetching profiles:', error)
        toast.error('Failed to load profiles')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfiles()
  }, [])

  useEffect(() => {
    let filtered = [...profiles]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(profile =>
        profile.name.toLowerCase().includes(query) ||
        profile.bio.toLowerCase().includes(query) ||
        profile.skills.some(skill => skill.toLowerCase().includes(query))
      )
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(profile => profile.role === roleFilter)
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(profile => profile.location === locationFilter)
    }

    setFilteredProfiles(filtered)
  }, [searchQuery, roleFilter, locationFilter, profiles])

  const uniqueRoles = Array.from(new Set(profiles.map(p => p.role)))
  const uniqueLocations = Array.from(new Set(profiles.map(p => p.location).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profiles</h1>
          <p className="text-gray-400">Discover, connect with, and hire talented professionals in our community for your next project or team.</p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profiles Grid */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No profiles found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Card
                key={profile.id}
                className="leonardo-card border-gray-800 hover:border-blue-500/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/profile/${profile.user_id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={profile.avatar_url} alt={`Avatar of ${profile.name}`} />
                        <AvatarFallback>{profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">{profile.name || 'Unknown User'}</h3>
                      <p className="text-gray-400 text-sm mb-2">{profile.role}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {profile.company && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                            <Building2 className="w-3 h-3 mr-1" />
                            {profile.company}
                          </Badge>
                        )}
                        {profile.location && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                            <MapPin className="w-3 h-3 mr-1" />
                            {profile.location}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">{profile.bio}</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{profile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 
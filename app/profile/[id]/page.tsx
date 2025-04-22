"use client"

import { use } from 'react'
import { useState } from 'react'
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
  Construction
} from 'lucide-react'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // TODO: Replace with actual user data fetching
  const profileData = {
    name: "John Doe",
    role: "Full Stack Developer",
    bio: "Passionate about building scalable web applications and contributing to open source projects.",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    company: "Tech Corp",
    website: "https://johndoe.dev",
    github: "johndoe",
    twitter: "johndoe",
    linkedin: "johndoe",
    skills: ["React", "TypeScript", "Node.js", "Python", "AWS"],
    experience: [
      {
        title: "Senior Developer",
        company: "Tech Corp",
        period: "2020 - Present",
        description: "Leading development of enterprise applications"
      },
      {
        title: "Software Engineer",
        company: "Startup Inc",
        period: "2018 - 2020",
        description: "Full stack development and team leadership"
      }
    ],
    education: [
      {
        degree: "B.S. Computer Science",
        school: "University of Technology",
        period: "2014 - 2018"
      }
    ]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* Development Banner */}
      <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black z-50 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Construction className="w-5 h-5" />
            <span className="font-medium">Under Development</span>
          </div>
          <Button 
            variant="outline" 
            className="bg-transparent border-black text-black hover:bg-yellow-600"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-12 opacity-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="leonardo-card border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                    <Image
                      src="/placeholder-avatar.jpg"
                      alt={profileData.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-1">{profileData.name}</h1>
                  <p className="text-gray-400 mb-4">{profileData.role}</p>
                  <div className="flex gap-2 mb-6">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                      {profileData.company}
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                      {profileData.location}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-center mb-6">{profileData.bio}</p>
                  <div className="flex gap-4 mb-6">
                    <a href={`https://github.com/${profileData.github}`} target="_blank" rel="noopener noreferrer">
                      <Github className="w-5 h-5 text-gray-400 hover:text-white" />
                    </a>
                    <a href={`https://twitter.com/${profileData.twitter}`} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-5 h-5 text-gray-400 hover:text-white" />
                    </a>
                    <a href={`https://linkedin.com/in/${profileData.linkedin}`} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-5 h-5 text-gray-400 hover:text-white" />
                    </a>
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-5 h-5 text-gray-400 hover:text-white" />
                    </a>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
                    Contact
                  </Button>
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
                  {profileData.skills.map((skill, index) => (
                    <Badge key={index} className="bg-gray-800 text-gray-300 border-gray-700">
                      {skill}
                    </Badge>
                  ))}
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
                  {profileData.experience.map((exp, index) => (
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
                  ))}
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
                  {profileData.education.map((edu, index) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 
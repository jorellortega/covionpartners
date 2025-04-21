"use client"

import { use } from 'react'
import { useState } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/hooks/useProjects'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Building2,
  Users,
  Briefcase,
  ClipboardCheck,
  SendHorizontal,
  AlertCircle,
  CheckCircle2,
  Timer,
  ArrowLeft,
  Calendar,
  DollarSign,
  Globe,
  Handshake
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function CollaborationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects()
  const [message, setMessage] = useState('')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const project = projects?.find(p => p.id === id)

  if (!project) {
    return notFound()
  }

  // Sample collaboration opportunities - replace with actual data
  const opportunities = [
    {
      role: "Technical Co-Founder",
      equity: "15-20%",
      requirements: ["5+ years software development", "Previous startup experience", "Full-time commitment"],
      responsibilities: ["Lead technical development", "Build and manage tech team", "Define technical strategy"]
    },
    {
      role: "Marketing Partner",
      equity: "10-15%",
      requirements: ["3+ years in digital marketing", "B2B experience", "Growth hacking expertise"],
      responsibilities: ["Design marketing strategy", "Lead brand development", "Manage marketing budget"]
    }
  ]

  const handleApply = async (role: string) => {
    if (!user) {
      toast.error("Please log in to apply for this role")
      return
    }

    // TODO: Implement actual application logic
    toast.success(`Application submitted for ${role}`)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-purple-400 w-fit"
              onClick={() => router.push('/publicprojects')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Public Projects
            </Button>
            
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{project.name}</h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">{project.description || 'No description available'}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 w-fit">
                  <Handshake className="w-4 h-4 mr-2" />
                  Collaboration Opportunity
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 w-fit">
                  <Globe className="w-4 h-4 mr-2" />
                  Public Project
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-800/30">
                    {project.media_files && project.media_files.length > 0 ? (
                      <Image
                        src={project.media_files[0].url}
                        alt={project.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-400/50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle>Project Overview</CardTitle>
                    <CardDescription className="text-gray-400">
                      Key information about the project
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Project Stage</span>
                      </div>
                      <div className="text-white font-medium">
                        {project.status || 'Not specified'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Users className="w-4 h-4 mr-2" />
                        <span>Team Size</span>
                      </div>
                      <div className="text-white font-medium">
                        Current Team: 4
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Project Progress</span>
                      <span className="text-white">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Opportunities */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
                <CardDescription className="text-gray-400">
                  Available roles and collaboration opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {opportunities.map((opp, index) => (
                    <div key={index} className="bg-gray-800/30 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{opp.role}</h3>
                          <div className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                            {opp.equity} Equity
                          </div>
                        </div>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleApply(opp.role)}
                        >
                          Apply Now
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-gray-400" />
                            Requirements
                          </h4>
                          <ul className="space-y-2">
                            {opp.requirements.map((req, i) => (
                              <li key={i} className="flex items-center gap-2 text-gray-300">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            Responsibilities
                          </h4>
                          <ul className="space-y-2">
                            {opp.responsibilities.map((resp, i) => (
                              <li key={i} className="flex items-center gap-2 text-gray-300">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                {resp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
                <CardDescription className="text-gray-400">
                  Key metrics and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Funding Goal</span>
                    </div>
                    <div className="text-white font-medium">
                      ${project.funding_goal?.toLocaleString() || 'Not set'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Deadline</span>
                    </div>
                    <div className="text-white font-medium">
                      {formatDate(project.deadline)}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Building2 className="w-4 h-4 mr-2" />
                      <span>Project Type</span>
                    </div>
                    <div className="text-white font-medium">
                      {project.type || 'Not specified'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Section */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Express Interest</CardTitle>
                <CardDescription className="text-gray-400">
                  Submit your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-400 mb-1">Before You Apply</h4>
                        <p className="text-gray-300">
                          Please review the requirements carefully and ensure you can commit the necessary time and resources to the project.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Textarea
                      placeholder="Introduce yourself and explain why you'd be a great fit for this project..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[150px]"
                    />
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <SendHorizontal className="w-4 h-4 mr-2" />
                      Submit Application
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 
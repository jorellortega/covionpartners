"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, BarChart2, Briefcase, Zap, FolderKanban, Handshake, Users, Lock, FileText, Globe, DollarSign, Shield, Building2, Leaf, Clock, Check, Target, Heart, MessageSquare, Infinity } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import React from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Head from "next/head"

function escapeHtml(content: string) {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function formatMiniResponse(content: string) {
  const escaped = escapeHtml(content)
  return escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-300 underline">$1</a>').replace(/\n/g, '<br />')
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { projects, loading: projectsLoading, error } = useProjects()
  const [logoError, setLogoError] = useState(false)
  const [miniPrompt, setMiniPrompt] = useState('')
  const [miniResponse, setMiniResponse] = useState('')
  const [miniLoading, setMiniLoading] = useState(false)
  const [miniError, setMiniError] = useState<string | null>(null)

  useEffect(() => {
    // Only redirect if user is authenticated and not in the process of logging out
    if (!loading && user && window.location.pathname === '/' && window.location.search.includes('redirect=true')) {
      switch (user.role) {
        case "partner":
          router.push("/dashboard")
          break
        case "admin":
          router.push("/ceodash")
          break
        case "investor":
        case "viewer":
          router.push("/publicprojects")
          break
      }
    }
  }, [user, loading, router])

  // Get random 3 public projects
  const featuredProjects = React.useMemo(() => {
    if (!projects) return []
    const shuffled = [...projects].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 3)
  }, [projects])

  const handleMiniChat = async () => {
    if (!miniPrompt.trim() || miniLoading) return

    setMiniLoading(true)
    setMiniError(null)
    setMiniResponse('')

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: miniPrompt.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Unable to reach Infinito AI')
      }

      const data = await response.json()
      setMiniResponse(data.message)
      setMiniPrompt('')
    } catch (err: any) {
      setMiniError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setMiniLoading(false)
    }
  }

  const featureCards = [
    {
      key: "workflow",
      icon: <FolderKanban className="h-12 w-12 text-blue-400 mx-auto mb-4" />,
      title: "Task & Workflow Management",
      desc: "Organize, assign, and track tasks with powerful workflow tools designed to boost productivity and team collaboration."
    },
    {
      key: "deal",
      icon: <Handshake className="h-12 w-12 text-purple-400 mx-auto mb-4" />,
      title: "Deal Making Hub",
      desc: "Discover, negotiate, and close deals with partners and clients using powerful collaboration and transaction tools."
    },
    {
      key: "finance",
      icon: <DollarSign className="h-12 w-12 text-green-400 mx-auto mb-4" />,
      title: "Financial Hub",
      desc: "Easily manage your payments, send money to other users, track balances, and monitor financial activity in one place with powerful tools and real-time insights."
    },
    {
      key: "project",
      icon: <Briefcase className="h-12 w-12 text-purple-400 mx-auto mb-4" />,
      title: "Project Management",
      desc: "Create, manage, and track projects with comprehensive tools for milestones and team collaboration."
    },
    {
      key: "team",
      icon: <Users className="h-12 w-12 text-yellow-400 mx-auto mb-4" />,
      title: "Team Collaboration",
      desc: "Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools."
    },
    {
      key: "jobs",
      icon: <Briefcase className="h-12 w-12 text-blue-400 mx-auto mb-4" />,
      title: "Jobs Board",
      desc: "Find your next opportunity or post a job opening. Discover new roles or connect with top talent now!"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Covion Partners | Project Management, Deals, Jobs, and Collaboration</title>
        <meta name="description" content="Manage projects, make deals, find jobs, and collaborate with teams. Discover powerful tools for productivity, finance, and business growth—all in one platform." />
      </Head>
      <div className="flex flex-col min-h-screen bg-gray-950">
        <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl w-full text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="flex justify-center mt-0 mb-2">
                <img
                  src="https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png"
                  alt="Handshake"
                  width={200}
                  height={200}
                  style={{ display: 'block' }}
                />
              </div>
              <h2 className="text-5xl font-extrabold gradient-text m-0 -mt-6">PARTNERS</h2>
              <div className="w-full max-w-2xl mx-auto bg-gray-900/70 border border-gray-800 rounded-2xl p-6 shadow-lg mt-4 mb-6">
                <div className="mb-3 text-left">
                  <a
                    href="https://www.infinitoagi.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-2"
                  >
                    Infinito AI
                    <span className="text-cyan-300">∞</span>
                  </a>
                  <p className="text-sm text-gray-400">Ask the assistant anything about Covion Partners.</p>
                </div>
                <div className="space-y-4">
                  <Textarea
                    value={miniPrompt}
                    onChange={(event) => setMiniPrompt(event.target.value)}
                    placeholder="Try: Which Covion features help with deal flow?"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        handleMiniChat()
                      }
                    }}
                    rows={3}
                    className="bg-gray-950 border-gray-800 text-gray-100 placeholder:text-gray-500"
                    disabled={miniLoading}
                  />
                  <div className="flex items-center justify-between">
                    {miniError ? (
                      <span className="text-sm text-red-400">{miniError}</span>
                    ) : miniLoading ? (
                      <span className="text-sm text-cyan-300 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.2s]"></span>
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"></span>
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                        Thinking…
                      </span>
                    ) : <span />}
                    <Button
                      onClick={handleMiniChat}
                      disabled={miniLoading || !miniPrompt.trim()}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                    >
                      Ask Infinito
                    </Button>
                  </div>
                  {miniResponse && (
                    <div
                      className="bg-gray-950/80 border border-gray-800 rounded-xl p-4 text-left text-sm text-gray-100 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMiniResponse(miniResponse) }}
                    />
                  )}
                </div>
              </div>
            </div>
            <svg width="0" height="0">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#8B5CF6' }} />
                  <stop offset="50%" style={{ stopColor: '#EC4899' }} />
                  <stop offset="100%" style={{ stopColor: '#8B5CF6' }} />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex justify-center w-full mt-10 mb-10">
              {user ? (
                <Button asChild className="gradient-button group text-lg py-6 px-8" size="lg">
                  <Link href="/login">
                    Access Partner Dashboard
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <Button asChild className="gradient-button group text-lg py-6 px-8" size="lg">
                  <Link href="/account-types">
                    Sign Up
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featureCards.map(card => (
                <div
                  key={card.key}
                  className="leonardo-card p-6 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() =>
                    card.key === 'jobs' ? router.push('/jobs') :
                    card.key === 'deal' ? router.push('/deals-feature') :
                    card.key === 'project' ? router.push('/projectsinfo') :
                    card.key === 'finance' ? router.push('/financialhub') :
                    card.key === 'workflow' ? router.push('/workflowhub') :
                    card.key === 'team' ? router.push('/teamcollabinfo') :
                    router.push(`/features?tab=${card.key}`)
                  }
                  tabIndex={0}
                  role="button"
                  aria-label={`Explore ${card.title}`}
                >
                  {card.icon}
                  <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                  <p className="text-gray-300">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* View All Features Button */}
            <div className="flex justify-center mt-8 mb-2">
              <Link href="/features">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2">
                  View All Features
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Public Projects Preview Section */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Featured Public Projects</h2>
                <p className="text-gray-400 text-lg">Discover exciting opportunities and collaborations</p>
              </div>
              {projectsLoading ? (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="text-center text-red-500">
                  Error loading projects: {error}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {featuredProjects.map((project, index) => {
                    // Define different gradient colors for each card
                    const gradients = [
                      'from-purple-500/10 to-blue-500/10 border-purple-500/20 hover:border-purple-500/40',
                      'from-green-500/10 to-cyan-500/10 border-green-500/20 hover:border-green-500/40',
                      'from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40'
                    ]
                    const icons = [Building2, Leaf, Globe]
                    const iconColors = ['text-purple-400', 'text-green-400', 'text-orange-400']
                    
                    const Icon = icons[index]
                    const gradientClass = gradients[index]
                    const iconColor = iconColors[index]

                    // Get the first image from media files
                    const thumbnail = project.media_files?.find(file => file.type.startsWith('image/'))

                    return (
                      <div 
                        key={project.id}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} border border-gray-800/50 hover:border-gray-700/80 transition-all duration-300 cursor-pointer leonardo-card`}
                        onClick={() => router.push(`/publicprojects/${project.id}`)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Project Thumbnail */}
                        <div className="w-full aspect-video relative overflow-hidden">
                          {thumbnail ? (
                            <Image
                              src={thumbnail.url}
                              alt={project.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                              <Icon className="w-16 h-16 text-gray-400/50" />
                            </div>
                          )}
                        </div>

                        <div className="p-6 relative">
                          <div className="mb-4">
                            <h3 className="text-xl font-semibold">{project.name}</h3>
                            <p className="text-sm text-gray-400">{project.type || 'Project'}</p>
                          </div>
                          <p className="text-gray-300 mb-4 line-clamp-2">{project.description || 'No description available'}</p>
                          <div className="space-y-3">
                            {project.funding_goal && (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-400">Funding Goal</span>
                                </div>
                                <span className="text-white">${project.funding_goal.toLocaleString()}</span>
                              </div>
                            )}
                            {project.deadline && (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-400">Deadline</span>
                                </div>
                                <span className="text-white">{new Date(project.deadline).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Status</span>
                              </div>
                              <span className="text-white">{project.status || 'Active'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="text-center mt-8">
                <Button 
                  className="gradient-button"
                  onClick={() => router.push('/publicprojects')}
                >
                  View All Public Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Feed Section */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Community Feed</h2>
                <p className="text-gray-400 text-lg">See what others are sharing, posting, and discussing across Covion Partners.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Sample Feed Cards */}
                <div 
                  className="leonardo-card p-6 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push('/feed')}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      AL
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Alex Lee</h3>
                      <p className="text-sm text-gray-400">Partner • 2h ago</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">Excited to announce our new partnership with TechCorp! Looking forward to building amazing things together. 🚀</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>24</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>8</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="leonardo-card p-6 border border-gray-800 hover:border-green-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push('/feed')}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                      SJ
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Sarah Johnson</h3>
                      <p className="text-sm text-gray-400">Investor • 5h ago</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">Just closed a major deal worth $2M! Thanks to everyone who supported this journey. 💪</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>42</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>15</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="leonardo-card p-6 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push('/feed')}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                      MR
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Mike Ross</h3>
                      <p className="text-sm text-gray-400">Partner • 1d ago</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">Our new project "Green Energy Solutions" has reached its first milestone! Check out the progress report. 🌱</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>36</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>12</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="leonardo-card p-6 border border-gray-800 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push('/feed')}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                      RK
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Rachel Kim</h3>
                      <p className="text-sm text-gray-400">Partner • 3h ago</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">Launching our new AI-powered analytics platform next week! Stay tuned for the demo. 🤖</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>29</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>11</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  className="gradient-button text-lg px-8 py-6 hover:scale-105 transition-transform"
                  onClick={() => router.push('/feed')}
                >
                  View Full Feed
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Jobs Promotion Section */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                  <Briefcase className="inline-block w-8 h-8 text-blue-400 mr-2" />
                  Discover & Post Jobs
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Explore new career opportunities or post your own job openings. Connect with top talent and innovative companies!
                </p>
              </div>
              <div className="flex justify-center">
                <Button 
                  className="gradient-button text-lg px-8 py-6 hover:scale-105 transition-transform"
                  onClick={() => router.push('/jobs')}
                >
                  Explore Jobs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Promotional Sign-up Section */}
            <div className="mt-24 mb-16">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
                <div className="relative px-6 py-16 sm:px-12 sm:py-20">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
                    <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                      Join Covion Partners today and unlock powerful tools for project management, deal making, and team collaboration.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        className="gradient-button text-lg px-8 py-6 hover:scale-105 transition-transform"
                        onClick={() => router.push('/account-types')}
                      >
                        Sign Up Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-lg px-8 py-6 hover:bg-white/10 transition-colors"
                        onClick={() => router.push('/features')}
                      >
                        Learn More
                      </Button>
                    </div>
                    <div className="mt-8 flex justify-center items-center gap-6">
                      <a 
                        href="https://instagram.com/covionpartners" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <svg 
                          className="w-8 h-8" 
                          fill="currentColor" 
                          viewBox="0 0 24 24" 
                          aria-hidden="true"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </a>
                      <Button
                        variant="outline"
                        className="text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                        onClick={() => router.push('/contact')}
                      >
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Card */}
            <div className="mt-16 mb-8">
              <Card className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all">
                <CardContent className="p-8 text-center">
                  <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                    Business Community and Management Platform for project collaboration, deal making, and business growth. 
                    Connect with partners, manage projects, and build successful ventures together.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <p className="text-sm text-white/80">
              New to COVION PARTNERS?{" "}
              <Link href="/account-types" className="font-medium text-blue-300 hover:text-blue-200">
                Create an account
              </Link>
            </p>
          </div>
        </main>
        <footer className="py-8 text-center text-white/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm">Developed by JOR. Powered by Covion Partners © 2025</p>
          </div>
        </footer>
      </div>
    </>
  )
}


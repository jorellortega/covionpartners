"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart2, Briefcase, Zap, FolderKanban, Handshake, Users, Lock, FileText, Globe, DollarSign, Shield, Building2, Leaf, Clock, Check, Target } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import React from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { projects, loading: projectsLoading, error } = useProjects()
  const [logoError, setLogoError] = useState(false)

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
      desc: "Easily manage your payments, balances, and financial activity in one place with powerful tools and real-time insights."
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
      key: "global",
      icon: <Globe className="h-12 w-12 text-green-400 mx-auto mb-4" />,
      title: "Global Opportunities",
      desc: "Discover and connect with investment opportunities and partners from around the world."
    },
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
            <h2 className="text-5xl font-extrabold gradient-text m-0 -mt-6">COVION PARTNERS</h2>
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
                onClick={() => router.push(`/features?tab=${card.key}`)}
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
  )
}


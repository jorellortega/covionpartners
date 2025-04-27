"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart2, Briefcase, Zap, FolderKanban, Handshake, Users, Lock, FileText, Globe, Shield, Building2, Leaf, DollarSign, Clock, Check, Target } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Image from "next/image"
import React from "react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { projects, loading: projectsLoading, error } = useProjects()

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
        <div className="max-w-4xl w-full space-y-12 text-center">
          <h2 className="text-5xl font-extrabold gradient-text mt-8">COVION PARTNERS</h2>
          <p className="text-xl text-white/90">
            Investment opportunities, projects, collaborations, and partnership management
          </p>

          <Button asChild className="gradient-button group text-lg py-6 px-8" size="lg">
            <Link href="/login">
              Access Partner Dashboard
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="leonardo-card p-6">
              <BarChart2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Financial Analytics</h3>
              <p className="text-gray-300">
                Track investments and project performance with advanced analytics and real-time reporting tools.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Briefcase className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Project Management</h3>
              <p className="text-gray-300">
                Create, manage, and track projects with comprehensive tools for milestones and team collaboration.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Globe className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Global Opportunities</h3>
              <p className="text-gray-300">
                Discover and connect with investment opportunities and partners from around the world.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Users className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-300">
                Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
              <p className="text-gray-300">
                Manage investments and payments with enterprise-grade security and multiple withdrawal options.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Target className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Flexible Account Types</h3>
              <p className="text-gray-300">
                Choose from multiple account tiers with features tailored to your investment and project needs.
              </p>
            </div>
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

          {/* Account Types Section */}
          <div className="mt-24 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Choose Your Account Type</h2>
              <p className="text-gray-400 text-lg">Select the perfect plan for your project funding and management needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  name: "Public Account",
                  description: "Perfect for exploring and supporting projects",
                  price: "Free",
                  icon: Users,
                  features: ["View Public Projects", "Support Projects", "Project Discovery", "Basic Analytics"],
                  cta: "Get Started",
                  href: "/login?tab=signup",
                  popular: false
                },
                {
                  name: "Partner Account",
                  description: "For active investors and project supporters",
                  price: "Free",
                  priceDetail: "2% of successful investments",
                  icon: DollarSign,
                  features: ["Project Funding", "Team Collaboration", "Advanced Analytics", "Investment Tracking"],
                  cta: "Sign Up Now",
                  href: "/login?tab=signup",
                  popular: true
                },
                {
                  name: "Manager Account",
                  description: "Complete project creation and management",
                  price: "$25/month",
                  icon: Target,
                  features: ["Create Projects", "Project Management", "Custom Reports", "Priority Support"],
                  cta: "Upgrade Now",
                  href: "/account-types",
                  popular: false
                },
                {
                  name: "Business Account",
                  description: "Full platform access with advanced features",
                  price: "$45/month",
                  icon: Building2,
                  features: ["API Access", "White Label Solutions", "Dedicated Support", "Custom Integration"],
                  cta: "Contact Sales",
                  href: "/account-types",
                  popular: false
                }
              ].map((tier) => (
                <Card 
                  key={tier.name}
                  className={`leonardo-card border-gray-800 ${tier.popular ? 'border-purple-500/50' : ''}`}
                >
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-center gap-3">
                      <tier.icon className="w-6 h-6 text-purple-400" />
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                    </div>
                    <CardDescription className="text-gray-400 mt-2">
                      {tier.description}
                    </CardDescription>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-white">
                        {tier.price}
                      </div>
                      {tier.priceDetail && (
                        <div className="text-sm text-purple-400 mt-1">
                          {tier.priceDetail}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Button 
                      asChild
                      className={`w-full ${tier.popular ? 'bg-purple-500 hover:bg-purple-600' : 'gradient-button'}`}
                    >
                      <Link href={tier.href}>
                        {tier.cta}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <p className="text-sm text-white/80">
            New to COVION PARTNERS?{" "}
            <Link href="/login?tab=signup" className="font-medium text-blue-300 hover:text-blue-200">
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


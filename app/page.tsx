"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart2, Briefcase, Zap, FolderKanban, Handshake } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if user is authenticated and not in the process of logging out
    if (!loading && user && window.location.pathname === '/' && window.location.search.includes('redirect=true')) {
      switch (user.role) {
        case "partner":
          router.push("/dashboard")
          break
        case "admin":
          router.push("/admindashboard")
          break
        case "investor":
        case "viewer":
          router.push("/publicprojects")
          break
      }
    }
  }, [user, loading, router])

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
          <h2 className="text-5xl font-extrabold gradient-text mt-8">COVION STUDIO partners</h2>
          <p className="text-xl text-white/90">
            Investment opportunities, projects, collaborations, and partnership management
          </p>

          <Button asChild className="gradient-button group text-lg py-6 px-8" size="lg">
            <Link href="/login">
              Access Partner Dashboard
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="leonardo-card p-6">
              <BarChart2 className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Financial Analytics</h3>
              <p className="text-gray-300">
                Access cutting-edge analytics tools to track your investments and project performance in real-time.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Briefcase className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Exclusive Investment Opportunities</h3>
              <p className="text-gray-300">
                Discover and participate in carefully curated investment projects across various industries.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <FolderKanban className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Project Management Dashboard</h3>
              <p className="text-gray-300">
                Track and manage all your projects with our comprehensive dashboard featuring milestones, team
                collaboration, and financial metrics.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Partner Payouts</h3>
              <p className="text-gray-300">
                Access our robust payment system with multiple withdrawal options including bank transfers, PayPal, and
                debit cards for seamless fund management.
              </p>
            </div>
            <div className="leonardo-card p-6">
              <Briefcase className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Project Actions</h3>
              <p className="text-gray-300">
                Create, manage, or view projects with ease.
              </p>
            </div>
            {/* Make a Deal Section */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Handshake className="w-5 h-5 mr-2" />
                  Make a Deal
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Start a new deal or negotiation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full gradient-button"
                  onClick={() => {
                    if (user?.role === 'viewer') {
                      toast.error('You must have a higher account to access this feature.')
                    } else {
                      router.push('/makedeal')
                    }
                  }}
                >
                  <Handshake className="w-4 h-4 mr-2" />
                  Make Deal
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 space-y-6">
            <p className="text-sm text-white/80">
              New to COVION STUDIO?{" "}
              <Link href="/login?tab=signup" className="font-medium text-blue-300 hover:text-blue-200">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>
      <footer className="py-8 text-center text-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm">Developed by JOR. Powered by Covion Studio © 2025</p>
        </div>
      </footer>
    </div>
  )
}


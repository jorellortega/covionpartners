"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Briefcase, 
  Search,
  Filter,
  MapPin,
  DollarSign,
  Users,
  Eye,
  Send,
  Building2,
  Target,
  CheckCircle,
  Zap,
  FileText,
  UserCheck,
  TrendingUp,
  Globe,
  Clock,
  Star,
  ArrowRight,
  UserPlus
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function JobsInfoContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <div className="px-4 sm:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center mb-8">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 mb-6">
              <Briefcase className="w-12 h-12 text-white" />
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Jobs Board
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Find your next opportunity or post a job opening. Discover new roles or connect with top talent and innovative companies. Advanced search and filtering tools help you find the perfect match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="gradient-button text-lg px-8 py-6 hover:scale-105 transition-transform"
                onClick={() => router.push('/jobs')}
              >
                Browse Jobs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                className="text-lg px-8 py-6 hover:bg-white/10 transition-colors border-gray-700"
                onClick={() => router.push('/account-types')}
              >
                Sign Up
                <UserPlus className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-4 sm:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Job Seekers and Employers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Search & Discovery */}
            <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-gray-800 hover:border-blue-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle>Advanced Search</CardTitle>
                <CardDescription className="text-gray-400">
                  Search jobs by title, company name, description, or skills. Find exactly what you're looking for with powerful search capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Filtering */}
            <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-gray-800 hover:border-purple-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Filter className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle>Smart Filtering</CardTitle>
                <CardDescription className="text-gray-400">
                  Filter by location, job type, experience level, and skills. Toggle remote-only jobs to find opportunities that match your preferences.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Job Types */}
            <Card className="bg-gradient-to-br from-green-500/5 to-cyan-500/5 border-gray-800 hover:border-green-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle>Multiple Job Types</CardTitle>
                <CardDescription className="text-gray-400">
                  Browse Full Time, Part Time, Contract, Internship, and Freelance positions. Find the work arrangement that fits your lifestyle.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Experience Levels */}
            <Card className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-gray-800 hover:border-yellow-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <CardTitle>Experience Levels</CardTitle>
                <CardDescription className="text-gray-400">
                  Filter by Entry, Junior, Mid, Senior, Lead, or Executive level positions. Find opportunities that match your career stage.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Remote Jobs */}
            <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-gray-800 hover:border-cyan-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle>Remote Opportunities</CardTitle>
                <CardDescription className="text-gray-400">
                  Find remote jobs from anywhere in the world. Filter specifically for remote-only positions to work from wherever you choose.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Skills Matching */}
            <Card className="bg-gradient-to-br from-pink-500/5 to-red-500/5 border-gray-800 hover:border-pink-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-pink-400" />
                </div>
                <CardTitle>Skills-Based Matching</CardTitle>
                <CardDescription className="text-gray-400">
                  Filter jobs by specific skills like React, Python, AWS, or UI/UX. Find positions that match your technical expertise.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Company Profiles */}
            <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-gray-800 hover:border-indigo-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-indigo-400" />
                </div>
                <CardTitle>Company Integration</CardTitle>
                <CardDescription className="text-gray-400">
                  View company profiles, logos, and banners. Learn about organizations before applying and see all their open positions.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Application Management */}
            <Card className="bg-gradient-to-br from-teal-500/5 to-green-500/5 border-gray-800 hover:border-teal-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-teal-400" />
                </div>
                <CardTitle>Application Tracking</CardTitle>
                <CardDescription className="text-gray-400">
                  See application counts and view counts for each job. Employers can manage applications and track candidate interest.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Job Details */}
            <Card className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-gray-800 hover:border-violet-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-violet-400" />
                </div>
                <CardTitle>Detailed Job Pages</CardTitle>
                <CardDescription className="text-gray-400">
                  Comprehensive job descriptions with requirements, benefits, salary ranges, and skills. Everything you need to make an informed decision.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Salary Information */}
            <Card className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-gray-800 hover:border-emerald-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <CardTitle>Salary Transparency</CardTitle>
                <CardDescription className="text-gray-400">
                  View salary ranges with minimum and maximum amounts. Multiple currency support for international opportunities.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Job Posting */}
            <Card className="bg-gradient-to-br from-rose-500/5 to-pink-500/5 border-gray-800 hover:border-rose-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-rose-400" />
                </div>
                <CardTitle>Easy Job Posting</CardTitle>
                <CardDescription className="text-gray-400">
                  Post job openings quickly and easily. Public users get 2 free posts per month, paid accounts have unlimited posting.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Project Roles */}
            <Card className="bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border-gray-800 hover:border-amber-500/40 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-amber-400" />
                </div>
                <CardTitle>Project-Based Roles</CardTitle>
                <CardDescription className="text-gray-400">
                  Discover open roles within specific projects. Find opportunities to join exciting projects and collaborate with innovative teams.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Key Benefits Section */}
          <div className="mt-20 mb-12">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Jobs Board?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">For Job Seekers</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Advanced search and filtering to find your perfect role</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Browse by skills, location, experience level, and job type</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>View company profiles and learn about potential employers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Apply directly through the platform with resume upload</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>Track application status and manage your job search</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">For Employers</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Post unlimited jobs with paid accounts (2/month for free users)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Manage applications and review candidates in one place</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Link jobs to your organization profile for brand visibility</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Track views and applications to measure job performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>Edit job postings and update details anytime</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Types Detail */}
          <div className="mt-12 mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Job Types Available</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { type: "Full Time", icon: Clock, iconClass: "text-blue-400", hoverClass: "hover:border-blue-500/40" },
                { type: "Part Time", icon: Clock, iconClass: "text-green-400", hoverClass: "hover:border-green-500/40" },
                { type: "Contract", icon: FileText, iconClass: "text-purple-400", hoverClass: "hover:border-purple-500/40" },
                { type: "Internship", icon: Target, iconClass: "text-yellow-400", hoverClass: "hover:border-yellow-500/40" },
                { type: "Freelance", icon: Globe, iconClass: "text-cyan-400", hoverClass: "hover:border-cyan-500/40" }
              ].map(({ type, icon: Icon, iconClass, hoverClass }) => (
                <div key={type} className={`bg-gray-900/50 rounded-lg p-4 border border-gray-800 text-center ${hoverClass} transition-all`}>
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${iconClass}`} />
                  <p className="font-semibold">{type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Levels Detail */}
          <div className="mt-12 mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Experience Levels</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                "Entry Level",
                "Junior",
                "Mid Level",
                "Senior",
                "Lead",
                "Executive"
              ].map((level) => (
                <div key={level} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 text-center hover:border-purple-500/40 transition-all">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <p className="font-semibold text-sm">{level}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border-purple-500/20 max-w-3xl mx-auto">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-lg text-gray-300 mb-8">
                  Whether you're looking for your next opportunity or seeking top talent, our Jobs Board has everything you need.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="gradient-button text-lg px-8 py-6 hover:scale-105 transition-transform"
                    onClick={() => router.push('/jobs')}
                  >
                    Browse Jobs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-lg px-8 py-6 hover:bg-white/10 transition-colors border-gray-700"
                    onClick={() => router.push('/account-types')}
                  >
                    Sign Up
                    <UserPlus className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


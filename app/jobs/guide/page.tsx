"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Briefcase, Users, FileText, CheckCircle, Clock, DollarSign } from "lucide-react"
import Link from "next/link"

export default function JobPostingGuidePage() {
  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Job Posting Guide
          </h1>
          <p className="text-gray-400 text-lg">
            Understand how to post jobs and work-for-hire opportunities on our platform
          </p>
        </div>

        {/* Overview */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-blue-400">Platform Overview</CardTitle>
            <CardDescription>
              We offer two main ways to find talent: traditional job postings and work-for-hire projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  Traditional Jobs
                </h3>
                <p className="text-gray-400 text-sm">
                  Full-time, part-time, contract, and internship positions. These appear on the public job board and are searchable by all users.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Full-time</Badge>
                  <Badge variant="secondary">Part-time</Badge>
                  <Badge variant="secondary">Contract</Badge>
                  <Badge variant="secondary">Internship</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Work for Hire
                </h3>
                <p className="text-gray-400 text-sm">
                  Project-based work, freelance opportunities, and specific deliverables. These are also publicly visible but focused on project completion.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Freelance</Badge>
                  <Badge variant="secondary">Project-based</Badge>
                  <Badge variant="secondary">Work for Hire</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step by Step Process */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white mb-6">How to Post a Job</h2>
          
          {/* Step 1 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  1                </div>
                <CardTitle className="text-lg">Choose Your Job Type</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">For Traditional Jobs:</h4>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Go to <Link href="/jobs/post" className="text-blue-400 hover:underline">Post a Job</Link></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Select job type: Full-time, Part-time, Contract, or Internship</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Fill in standard job details</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">For Work for Hire:</h4>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Go to <Link href="/jobs/post" className="text-blue-400 hover:underline">Post a Job</Link></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Select job type: Work for Hire or Freelance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Fill in project-specific details</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  2                </div>
                <CardTitle className="text-lg">Set Requirements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Traditional Job Requirements:</h4>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Experience level</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Required skills</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      <span>Salary range</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>Job type and schedule</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Work for Hire Requirements:</h4>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span>Project deliverables</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>Timeline and deadlines</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                      <span>Project budget</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Required skills</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  3                </div>
                <CardTitle className="text-lg">Where Your Job Appears</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Public Visibility:</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-400" />
                        <span>Main job board (<Link href="/jobs" className="text-blue-400 hover:underline">/jobs</Link>)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-400" />
                        <span>Company profile pages</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-green-400" />
                        <span>Search results</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3">Your Dashboard:</h4>
                    <ul className="text-gray-400 text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span>Job portal dashboard (<Link href="/jobportal" className="text-blue-400 hover:underline">/jobportal</Link>)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span>Application management</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span>Job analytics</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  4                </div>
                <CardTitle className="text-lg">Managing Applications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-400">
                  Once candidates start applying, you can manage them through your job portal dashboard:
                </p>
                <ul className="text-gray-400 text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Review applications and resumes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Contact candidates directly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Update application status</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Track application metrics</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 center">
          <h2 className="text-2xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/jobs/post">           <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Briefcase className="w-4 h-4 mr-2" />
                Post a Job
              </Button>
            </Link>
            <Link href="/jobs">           <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                <FileText className="w-4 h-4 mr-2" />
                Browse Jobs
              </Button>
            </Link>
            <Link href="/jobportal">           <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                <Users className="w-4 h-4 mr-2" />
                Job Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
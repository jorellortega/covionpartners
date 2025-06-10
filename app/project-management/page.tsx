"use client"

import { Briefcase, Users, DollarSign, CheckCircle, FileText, Bell, Zap, ArrowRight, Building2 } from "lucide-react"

export default function ProjectManagementPromo() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-2">
      <div className="bg-[#19191d] border border-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-2xl flex flex-col items-center text-center">
        {/* Header */}
        <div className="mb-6">
          <Briefcase className="mx-auto w-14 h-14 text-purple-400" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Project Management</h1>
        <p className="text-gray-400 mb-6 text-base max-w-lg">
          Covion's Project Management suite empowers teams to plan, track, and deliver projects efficiently. Collaborate, manage resources, and keep stakeholders in the loop—all in one secure platform.
        </p>
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-10">
          <div className="flex flex-col items-center">
            <Users className="w-8 h-8 text-indigo-400 mb-2" />
            <span className="font-semibold text-white">Team Collaboration</span>
            <span className="text-gray-400 text-sm">Invite, assign roles, and work together in real time.</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <span className="font-semibold text-white">Task & Progress Tracking</span>
            <span className="text-gray-400 text-sm">Create tasks, set deadlines, and visualize progress.</span>
          </div>
          <div className="flex flex-col items-center">
            <DollarSign className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="font-semibold text-white">Financial Oversight</span>
            <span className="text-gray-400 text-sm">Track budgets, expenses, and investments with ease.</span>
          </div>
          <div className="flex flex-col items-center">
            <Bell className="w-8 h-8 text-pink-400 mb-2" />
            <span className="font-semibold text-white">Smart Notifications</span>
            <span className="text-gray-400 text-sm">Stay updated on project changes and deadlines.</span>
          </div>
        </div>
        {/* How it Works */}
        <div className="w-full bg-gray-900/60 rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <div className="flex flex-col items-center">
              <Building2 className="w-7 h-7 text-purple-400 mb-1" />
              <span className="text-white font-semibold">Create a Project</span>
              <span className="text-gray-400 text-xs">Set up your workspace in seconds.</span>
            </div>
            <ArrowRight className="hidden sm:block w-6 h-6 text-gray-500" />
            <div className="flex flex-col items-center">
              <Users className="w-7 h-7 text-indigo-400 mb-1" />
              <span className="text-white font-semibold">Add Your Team</span>
              <span className="text-gray-400 text-xs">Invite members and assign roles.</span>
            </div>
            <ArrowRight className="hidden sm:block w-6 h-6 text-gray-500" />
            <div className="flex flex-col items-center">
              <FileText className="w-7 h-7 text-blue-400 mb-1" />
              <span className="text-white font-semibold">Plan & Execute</span>
              <span className="text-gray-400 text-xs">Organize tasks, share files, and hit milestones.</span>
            </div>
            <ArrowRight className="hidden sm:block w-6 h-6 text-gray-500" />
            <div className="flex flex-col items-center">
              <Zap className="w-7 h-7 text-yellow-400 mb-1" />
              <span className="text-white font-semibold">Achieve Results</span>
              <span className="text-gray-400 text-xs">Track progress and celebrate success.</span>
            </div>
          </div>
        </div>
        {/* Testimonial */}
        <div className="w-full bg-gray-900/60 rounded-xl p-6 mb-10">
          <p className="text-lg text-white font-semibold mb-2">“Covion made it easy for our distributed team to stay on track and deliver on time. The financial tools and notifications are game changers!”</p>
          <span className="text-gray-400 text-sm">— Alex P., Project Lead</span>
        </div>
        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold text-lg shadow hover:from-purple-600 hover:to-indigo-600 transition-all">
            Get Started Free
          </button>
          <button className="px-6 py-3 rounded-lg border border-purple-500 text-purple-300 font-semibold text-lg hover:bg-purple-900/20 transition-all">
            See Live Demo
          </button>
        </div>
      </div>
    </div>
  )
} 
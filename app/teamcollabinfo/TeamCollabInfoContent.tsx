"use client"

import { Users } from "lucide-react"

export default function TeamCollabInfoContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-2">
      <div className="bg-[#19191d] border border-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-2xl flex flex-col items-center text-center">
        {/* Header */}
        <div className="mb-6">
          <Users className="mx-auto w-14 h-14 text-yellow-400" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Team Collaboration</h1>
        <p className="text-gray-400 mb-6 text-base max-w-lg">
          Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools.
        </p>
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-10">
          <div className="flex flex-col items-center">
            <Users className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="font-semibold text-white">Real-Time Messaging</span>
            <span className="text-gray-400 text-sm">Chat instantly with your team and partners.</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="font-semibold text-white">Shared Calendars</span>
            <span className="text-gray-400 text-sm">Coordinate meetings and deadlines with ease.</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="font-semibold text-white">Document Sharing</span>
            <span className="text-gray-400 text-sm">Share files and resources securely.</span>
          </div>
          <div className="flex flex-col items-center">
            <Users className="w-8 h-8 text-yellow-400 mb-2" />
            <span className="font-semibold text-white">Role-Based Access</span>
            <span className="text-gray-400 text-sm">Control permissions for every collaborator.</span>
          </div>
        </div>
        {/* Testimonial */}
        <div className="w-full bg-gray-900/60 rounded-xl p-6 mb-10">
          <p className="text-lg text-white font-semibold mb-2">“The collaboration tools made it easy for our team to stay connected and productive, no matter where we were.”</p>
          <span className="text-gray-400 text-sm">— Jamie L., Operations Manager</span>
        </div>
      </div>
    </div>
  )
} 
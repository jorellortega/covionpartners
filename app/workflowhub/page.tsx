"use client"
import Head from "next/head"
import { FolderKanban, Users, Zap, CheckCircle2, BarChart, Timer, FileText, StickyNote } from "lucide-react"

export default function WorkflowHubPage() {
  return (
    <>
      <Head>
        <title>Workflow Automation & Task Management | Organize, Automate, Collaborate</title>
        <meta name="description" content="Organize, assign, and track tasks across projects. Automate repetitive work, collaborate in real time, manage priorities, and boost productivity with powerful workflow tools." />
      </Head>
      <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full mx-auto text-center py-20">
          <div className="flex flex-col items-center mb-8">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 mb-4">
              <FolderKanban className="w-12 h-12 text-white" />
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Workflow Automation & Task Management</h1>
            <p className="text-lg text-gray-300 mb-6">
              Organize, assign, and track tasks across all your projects. Automate repetitive work, collaborate in real time, and boost productivity with powerful workflow tools.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Zap className="w-8 h-8 text-yellow-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Workflow Automation</h3>
              <p className="text-gray-400">Automate repetitive tasks and processes to save time and reduce manual work. Real-time updates keep your team in sync.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <Users className="w-8 h-8 text-blue-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Real-Time Collaboration</h3>
              <p className="text-gray-400">Assign tasks, share updates, and communicate instantly with your team. Everyone stays on the same page.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Priority & Status Management</h3>
              <p className="text-gray-400">Set priorities, update statuses, and track progress for every task. Stay organized and focused on what matters most.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <BarChart className="w-8 h-8 text-purple-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Productivity Insights</h3>
              <p className="text-gray-400">View weekly and monthly stats, monitor completed and in-progress tasks, and optimize your workflow for better results.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <FileText className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Attachments & Links</h3>
              <p className="text-gray-400">Attach files, add links, and keep all task-related resources in one place for easy access.</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-6 flex flex-col items-center">
              <StickyNote className="w-8 h-8 text-pink-400 mb-2" />
              <h3 className="font-semibold text-xl mb-2">Notes & Documentation</h3>
              <p className="text-gray-400">Add notes and documentation to tasks to provide context and keep your team informed.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
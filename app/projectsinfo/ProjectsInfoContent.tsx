"use client"

import { Briefcase, Users, DollarSign, CheckCircle, FileText, Bell, Zap, ArrowRight, Building2, Search, Filter, Key, Lock, Globe, BarChart3, Calendar, Target, FolderKanban, MessageSquare, Settings, Eye, Star, Upload, Download, Share2, TrendingUp, Shield, Clock, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ProjectsInfoContent() {
  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="mb-6 flex justify-center" aria-hidden="true">
            <Briefcase className="w-16 h-16 text-purple-400" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Project Management Software & Team Collaboration Platform</h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Covion's comprehensive Project Management suite empowers teams to plan, track, and deliver projects efficiently. Collaborate, manage resources, track finances, and keep stakeholders in the loop—all in one secure platform. Features include unlimited project creation, 5-level access control, workflow automation, budget tracking, file management, and real-time collaboration tools.
          </p>
        </header>

        {/* Core Features Grid */}
        <section aria-label="Project Management Features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-colors">
            <Building2 className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Project Creation & Setup</h3>
            <p className="text-gray-400 text-sm mb-4">Create projects with custom names, descriptions, budgets, and deadlines. Set project status and organize with media files.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Custom project keys for easy sharing</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Media gallery support</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Project type categorization</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-indigo-500/50 transition-colors">
            <Users className="w-10 h-10 text-indigo-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Team Collaboration</h3>
            <p className="text-gray-400 text-sm mb-4">Invite team members, assign roles, and manage permissions with granular access control levels.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Join projects via project key</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> 5-level access control system</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Team member status management</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Custom project roles</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-green-500/50 transition-colors">
            <FolderKanban className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Task & Workflow Management</h3>
            <p className="text-gray-400 text-sm mb-4">Create, assign, and track tasks with status updates, deadlines, and progress visualization.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Task assignment and tracking</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Workflow automation</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Progress indicators</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-yellow-500/50 transition-colors">
            <DollarSign className="w-10 h-10 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Financial Management</h3>
            <p className="text-gray-400 text-sm mb-4">Track budgets, expenses, investments, and financial transactions all in one place.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Budget tracking and management</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Expense tracking</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Investment and funding features</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Financial reports</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-colors">
            <FileText className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">File Management</h3>
            <p className="text-gray-400 text-sm mb-4">Organize, store, and share project files with version control and access permissions.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> File upload and organization</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Access level controls</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Team-only file sharing</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-pink-500/50 transition-colors">
            <Bell className="w-10 h-10 text-pink-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Updates & Notifications</h3>
            <p className="text-gray-400 text-sm mb-4">Keep your team informed with project updates, announcements, and real-time notifications.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Project updates and announcements</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Real-time notifications</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Join request notifications</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-cyan-500/50 transition-colors">
            <Globe className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Public & Private Projects</h3>
            <p className="text-gray-400 text-sm mb-4">Control project visibility and enable public discovery for funding and collaboration.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Public project visibility</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Funding goal settings</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Investment options</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Support/purchase features</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-orange-500/50 transition-colors">
            <Search className="w-10 h-10 text-orange-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Search & Organization</h3>
            <p className="text-gray-400 text-sm mb-4">Find and organize your projects with powerful search, filtering, and favorite features.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Search by name or description</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Filter by status</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Pin favorite projects</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Status statistics dashboard</li>
            </ul>
          </div>

          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-800 hover:border-red-500/50 transition-colors">
            <BarChart3 className="w-10 h-10 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Progress & Analytics</h3>
            <p className="text-gray-400 text-sm mb-4">Track project progress, view analytics, and monitor key performance metrics.</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Progress percentage tracking</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Visual progress bars</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Project statistics</li>
            </ul>
          </div>
        </section>

        {/* Status Management */}
        <section aria-label="Project Status Types" className="bg-gray-900/60 rounded-xl p-8 mb-12 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Project Status Management</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-400 mb-2" />
              <span className="text-white font-semibold text-sm">Active</span>
              <span className="text-gray-400 text-xs text-center">Projects in progress</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-yellow-400 mb-2" />
              <span className="text-white font-semibold text-sm">Pending</span>
              <span className="text-gray-400 text-xs text-center">Awaiting start</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
              <Shield className="w-8 h-8 text-red-400 mb-2" />
              <span className="text-white font-semibold text-sm">On Hold</span>
              <span className="text-gray-400 text-xs text-center">Temporarily paused</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
              <span className="text-white font-semibold text-sm">Completed</span>
              <span className="text-gray-400 text-xs text-center">Successfully finished</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
              <Target className="w-8 h-8 text-purple-400 mb-2" />
              <span className="text-white font-semibold text-sm">All Projects</span>
              <span className="text-gray-400 text-xs text-center">Complete overview</span>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section aria-label="How Project Management Works" className="bg-gray-900/60 rounded-xl p-8 mb-12 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How Project Management Works</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Create a Project</h3>
              <p className="text-gray-400 text-sm">Set up your workspace with name, description, budget, and deadline. Generate a unique project key for team access.</p>
            </div>
            <ArrowRight className="hidden md:block w-8 h-8 text-gray-500 rotate-90 md:rotate-0" />
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Add Your Team</h3>
              <p className="text-gray-400 text-sm">Invite members via project key or email. Assign roles, set access levels, and manage permissions.</p>
            </div>
            <ArrowRight className="hidden md:block w-8 h-8 text-gray-500 rotate-90 md:rotate-0" />
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <FolderKanban className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Plan & Execute</h3>
              <p className="text-gray-400 text-sm">Create tasks, upload files, track progress, manage finances, and share updates with your team.</p>
            </div>
            <ArrowRight className="hidden md:block w-8 h-8 text-gray-500 rotate-90 md:rotate-0" />
            <div className="flex flex-col items-center text-center max-w-[200px]">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Achieve Results</h3>
              <p className="text-gray-400 text-sm">Monitor progress, celebrate milestones, complete projects, and analyze performance with comprehensive analytics.</p>
            </div>
          </div>
        </section>

        {/* Key Features List */}
        <section aria-label="Complete Feature List" className="bg-gray-900/60 rounded-xl p-8 mb-12 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Complete Project Management Feature List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Project creation with custom keys</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Team member invitation and management</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">5-level access control system</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Task creation and assignment</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Workflow automation</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Budget and expense tracking</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Investment and funding features</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">File upload and organization</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Media gallery support</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Project updates and announcements</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Real-time notifications</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Public/private project visibility</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Funding goal settings</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Search and filter capabilities</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Project favorites/pinning</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Progress tracking with visual indicators</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Status management (Active, Pending, On Hold, Completed)</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Deadline tracking and reminders</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Custom project roles</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Team member status management</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Financial reports and analytics</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Project settings and configuration</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">Join requests and approvals</span>
            </div>
          </div>
        </section>

        {/* Signup Call to Action */}
        <section aria-label="Get Started" className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-purple-500/20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
            Join Covion Partners today and unlock powerful project management tools. Start organizing, collaborating, and delivering projects with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/account-types"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign Up Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 bg-gray-800/50 hover:bg-gray-800/70 text-white font-semibold rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200"
            >
              Log In
            </a>
          </div>
        </section>
      </article>
    </main>
  )
} 
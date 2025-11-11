"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderKanban, Handshake, DollarSign, Briefcase, Users, Globe, Lock, BarChart2, FileText, Bell, Shield, ArrowRight, Star, Eye, UserPlus, Bot, Calendar, Building2, Cloud, StickyNote, MessageSquare } from "lucide-react";
import { useState, Suspense } from "react";

const features = [
  {
    key: "workflow",
    label: "Task & Workflow Management",
    icon: <FolderKanban className="w-6 h-6 mr-2 text-blue-400" />,
    description: "Organize, assign, and track tasks with powerful workflow tools designed to boost productivity and team collaboration.",
    intro: "Stay on top of your projects with intuitive task boards and automated reminders.",
    benefits: [
      "Visualize project progress with Kanban boards",
      "Assign and prioritize tasks easily",
      "Automated reminders to keep everyone on track"
    ],
    useCase: "A project manager can assign tasks, set deadlines, and monitor progress in real time, ensuring nothing falls through the cracks.",
    mock: [
      { title: "Kanban Board", detail: "Visualize project tasks and progress." },
      { title: "Task Assignment", detail: "Assign tasks to team members and set deadlines." },
      { title: "Automated Reminders", detail: "Never miss a deadline with smart notifications." },
    ],
    href: "/workflow"
  },
  {
    key: "deal",
    label: "Deal Making Hub",
    icon: <Handshake className="w-6 h-6 mr-2 text-purple-400" />,
    description: "Discover, negotiate, and close deals with partners and clients using powerful collaboration and transaction tools.",
    intro: "Centralize all your deal negotiations and agreements in one place.",
    benefits: [
      "Streamline negotiations with real-time messaging",
      "Track deal status and next steps",
      "Secure digital contract signing"
    ],
    useCase: "Move from initial contact to signed agreement without leaving the platform.",
    mock: [
      { title: "Deal Pipeline", detail: "Track deals from negotiation to close." },
      { title: "Secure Messaging", detail: "Communicate with partners in real time." },
      { title: "Digital Contracts", detail: "Sign agreements electronically and securely." },
    ],
    href: "/deals"
  },
  {
    key: "finance",
    label: "Financial Hub",
    icon: <DollarSign className="w-6 h-6 mr-2 text-green-400" />,
    description: "Easily manage your payments, balances, and financial activity in one place with powerful tools and real-time insights.",
    intro: "Get a complete overview of your finances and manage transactions effortlessly.",
    benefits: [
      "Monitor balances and cash flow in real time",
      "Review transaction history and payouts",
      "Instantly withdraw or transfer funds"
    ],
    useCase: "A business owner can track all incoming and outgoing payments, ensuring financial clarity and control.",
    mock: [
      { title: "Balance Overview", detail: "See all your accounts and balances at a glance." },
      { title: "Transaction History", detail: "Review all incoming and outgoing payments." },
      { title: "Instant Payouts", detail: "Withdraw funds quickly and securely." },
    ],
    href: "/managepayments"
  },
  {
    key: "project",
    label: "Project Management",
    icon: <Briefcase className="w-6 h-6 mr-2 text-purple-400" />,
    description: "Create, manage, and track projects with comprehensive tools for milestones and team collaboration.",
    intro: "Keep your projects organized from start to finish with robust management tools.",
    benefits: [
      "Set and track project milestones",
      "Store and share important documents",
      "Assign roles and permissions to team members"
    ],
    useCase: "A team can collaborate on a project, upload files, and track progress toward key deliverables.",
    mock: [
      { title: "Milestone Tracking", detail: "Monitor project progress and deadlines." },
      { title: "Document Storage", detail: "Keep all project files organized and accessible." },
      { title: "Role Management", detail: "Assign roles and permissions to team members." },
    ],
    href: "/projects"
  },
  {
    key: "team",
    label: "Team Collaboration",
    icon: <Users className="w-6 h-6 mr-2 text-yellow-400" />,
    description: "Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools.",
    intro: "Enhance teamwork with real-time communication and shared resources.",
    benefits: [
      "Instant group chat and messaging",
      "Shared calendars for meetings and deadlines",
      "Easy feedback collection and review"
    ],
    useCase: "A distributed team can coordinate tasks, chat, and keep everyone aligned on project goals.",
    mock: [
      { title: "Group Chat", detail: "Communicate instantly with your team." },
      { title: "Shared Calendars", detail: "Coordinate meetings and deadlines." },
      { title: "Feedback Tools", detail: "Collect and act on team feedback easily." },
    ],
    href: "/groupchat"
  },
  {
    key: "secure",
    label: "Secure Payments",
    icon: <Lock className="w-6 h-6 mr-2 text-red-400" />,
    description: "Process payments with enterprise-grade security and compliance.",
    intro: "Protect your transactions with advanced security and compliance features.",
    benefits: [
      "PCI-compliant payment processing",
      "Real-time fraud detection",
      "End-to-end encryption for all data"
    ],
    useCase: "A user can confidently send and receive payments, knowing their data is protected.",
    mock: [
      { title: "PCI Compliance", detail: "All transactions are processed with the highest security standards." },
      { title: "Fraud Detection", detail: "Advanced algorithms monitor and prevent fraudulent activity." },
      { title: "Encrypted Transactions", detail: "All payment data is encrypted end-to-end." },
    ],
    href: "/managepayments"
  },
  {
    key: "messaging",
    label: "Messaging & Group Chat",
    icon: <Users className="w-6 h-6 mr-2 text-cyan-400" />,
    description: "Communicate instantly with your team and partners using secure messaging and group chat features.",
    intro: "Stay connected with direct messages and group chat rooms for every project.",
    benefits: [
      "Private and group messaging",
      "File sharing in chat",
      "Real-time notifications for new messages"
    ],
    useCase: "A team can quickly resolve issues and share updates in a dedicated group chat for each project.",
    mock: [
      { title: "Direct Messaging", detail: "Send private messages to any team member or partner." },
      { title: "Group Chat Rooms", detail: "Create and join group chats for projects or topics." },
      { title: "File Sharing", detail: "Share files and media directly in chat conversations." },
    ],
    href: "/groupchat"
  },
  {
    key: "documents",
    label: "Document Management",
    icon: <FileText className="w-6 h-6 mr-2 text-yellow-400" />,
    description: "Store, share, and manage important documents securely.",
    intro: "Keep all your important files organized and accessible in one place.",
    benefits: [
      "Version control for all documents",
      "E-signature support",
      "Granular sharing permissions"
    ],
    useCase: "A project team can upload, sign, and share documents securely with external partners.",
    mock: [
      { title: "Version Control", detail: "Keep track of document changes and history." },
      { title: "E-signatures", detail: "Sign documents electronically and securely." },
      { title: "Secure Sharing", detail: "Share documents with granular access controls." },
    ],
    href: "/documents"
  },
  {
    key: "publicprojects",
    label: "Public Project Discovery",
    icon: <Globe className="w-6 h-6 mr-2 text-green-400" />,
    description: "Browse and join public projects and investment opportunities.",
    intro: "Find and join exciting projects from around the world.",
    benefits: [
      "Advanced project search and filters",
      "Easy join requests",
      "Diverse opportunities across industries"
    ],
    useCase: "A user can browse, filter, and join public projects that match their interests.",
    mock: [
      { title: "Project Search", detail: "Find projects by category, location, or funding needs." },
      { title: "Filters", detail: "Narrow results with advanced filters." },
      { title: "Join Requests", detail: "Request to join and collaborate on public projects." },
    ],
    href: "/publicprojects"
  },
  {
    key: "notifications",
    label: "Notifications & Alerts",
    icon: <Bell className="w-6 h-6 mr-2 text-purple-400" />,
    description: "Stay updated with real-time notifications and alerts.",
    intro: "Never miss an important update with customizable notifications.",
    benefits: [
      "Email and in-app alerts",
      "Activity summaries",
      "Customizable notification settings"
    ],
    useCase: "A user receives instant alerts for new deals, messages, and project updates.",
    mock: [
      { title: "Email Alerts", detail: "Receive important updates directly to your inbox." },
      { title: "In-app Notifications", detail: "Get notified instantly within the platform." },
      { title: "Activity Summaries", detail: "Review daily or weekly summaries of your activity." },
    ],
    href: "/updates"
  },
  {
    key: "access",
    label: "Account & Access Control",
    icon: <Shield className="w-6 h-6 mr-2 text-blue-400" />,
    description: "Manage user roles, permissions, and account security.",
    intro: "Control who can access what with robust account management tools.",
    benefits: [
      "Role-based access for users",
      "Two-factor authentication",
      "Comprehensive audit logs"
    ],
    useCase: "An admin can assign roles, enable 2FA, and review all account activity for compliance.",
    mock: [
      { title: "Role-based Access", detail: "Assign roles and permissions to control access." },
      { title: "Two-Factor Authentication", detail: "Enhance security with 2FA options." },
      { title: "Audit Logs", detail: "Track all account activity for compliance." },
    ],
    href: "/settings"
  },
  {
    key: "jobs",
    label: "Jobs Board",
    icon: <Briefcase className="w-6 h-6 mr-2 text-blue-400" />,
    description: "Find your next opportunity or post job openings. Discover new roles or connect with top talent.",
    intro: "A comprehensive job board for posting and discovering career opportunities.",
    benefits: [
      "Post and browse job listings",
      "Advanced search and filtering options",
      "Connect with employers and candidates"
    ],
    useCase: "An employer can post job openings and find qualified candidates, while job seekers can discover opportunities that match their skills.",
    mock: [
      { title: "Job Listings", detail: "Browse and post job opportunities across various industries." },
      { title: "Advanced Filters", detail: "Filter jobs by location, type, experience level, and skills." },
      { title: "Application Management", detail: "Track applications and manage the hiring process." },
    ],
    href: "/jobs"
  },
  {
    key: "ai",
    label: "Infinito AI Assistant",
    icon: <Bot className="w-6 h-6 mr-2 text-purple-400" />,
    description: "Get instant answers and guidance about your projects, partners, and workflows with our AI assistant.",
    intro: "Your intelligent companion for navigating the platform and getting help when you need it.",
    benefits: [
      "Instant answers to your questions",
      "Guidance on platform features",
      "Help with projects and workflows"
    ],
    useCase: "A user can ask Infinito AI about how to use features, get project recommendations, or learn about best practices.",
    mock: [
      { title: "Smart Assistance", detail: "Get instant answers about platform features and workflows." },
      { title: "Project Guidance", detail: "Receive recommendations and guidance for your projects." },
      { title: "24/7 Support", detail: "Access help anytime with our AI-powered assistant." },
    ],
    href: "/infinito-ai"
  },
  {
    key: "contracts",
    label: "Contract Library",
    icon: <FileText className="w-6 h-6 mr-2 text-green-400" />,
    description: "Manage, store, and sign contracts digitally with our comprehensive contract library.",
    intro: "Streamline your contract management with digital storage and e-signature capabilities.",
    benefits: [
      "Digital contract storage and management",
      "E-signature support for contracts",
      "Template library for common agreements"
    ],
    useCase: "A business can create, store, and manage contracts, send them for e-signature, and track contract status.",
    mock: [
      { title: "Contract Storage", detail: "Store and organize all your contracts in one secure location." },
      { title: "E-Signatures", detail: "Send contracts for digital signatures and track signing status." },
      { title: "Contract Templates", detail: "Use pre-built templates for common contract types." },
    ],
    href: "/contract-library"
  },
  {
    key: "notes",
    label: "Notes & Documentation",
    icon: <StickyNote className="w-6 h-6 mr-2 text-yellow-400" />,
    description: "Create and manage personal, project, and task notes to keep track of important information.",
    intro: "Stay organized with comprehensive note-taking for personal use, projects, and tasks.",
    benefits: [
      "Personal and project notes",
      "Task-specific documentation",
      "Easy search and organization"
    ],
    useCase: "A team member can create notes for personal reminders, project documentation, or task-specific information.",
    mock: [
      { title: "Personal Notes", detail: "Create and manage personal notes and reminders." },
      { title: "Project Notes", detail: "Document project information and updates." },
      { title: "Task Notes", detail: "Add notes to specific tasks for context and details." },
    ],
    href: "/notes"
  },
  {
    key: "schedule",
    label: "Schedule & Calendar",
    icon: <Calendar className="w-6 h-6 mr-2 text-cyan-400" />,
    description: "Manage your schedule, events, and meetings with our integrated calendar system.",
    intro: "Keep track of important dates, meetings, and deadlines in one centralized calendar.",
    benefits: [
      "Event and meeting management",
      "Task deadline tracking",
      "Team calendar integration"
    ],
    useCase: "A manager can schedule meetings, set deadlines, and coordinate team events through the integrated calendar.",
    mock: [
      { title: "Event Management", detail: "Create and manage events, meetings, and appointments." },
      { title: "Deadline Tracking", detail: "View and track project and task deadlines." },
      { title: "Team Calendar", detail: "Coordinate with team members through shared calendar views." },
    ],
    href: "/schedule"
  },
  {
    key: "cloud",
    label: "Cloud Services Integration",
    icon: <Cloud className="w-6 h-6 mr-2 text-blue-400" />,
    description: "Connect and sync with popular cloud storage services like Google Drive, Dropbox, and OneDrive.",
    intro: "Seamlessly integrate your existing cloud storage with the platform.",
    benefits: [
      "Connect multiple cloud storage providers",
      "Sync files across platforms",
      "Access cloud files directly from the platform"
    ],
    useCase: "A user can connect their Google Drive account and access files directly within the platform without manual uploads.",
    mock: [
      { title: "Multi-Cloud Support", detail: "Connect Google Drive, Dropbox, OneDrive, and more." },
      { title: "File Synchronization", detail: "Sync files between cloud services and the platform." },
      { title: "Direct Access", detail: "Access cloud files without leaving the platform." },
    ],
    href: "/cloud-services"
  },
  {
    key: "organizations",
    label: "Organizations",
    icon: <Building2 className="w-6 h-6 mr-2 text-purple-400" />,
    description: "Create and manage organizations with team members, goals, and collaborative tools.",
    intro: "Build and manage your business organizations with comprehensive team and project management.",
    benefits: [
      "Create and manage organizations",
      "Team member management",
      "Organization goals and tracking"
    ],
    useCase: "A business owner can create an organization, invite team members, set goals, and manage all organization activities.",
    mock: [
      { title: "Organization Management", detail: "Create and configure organizations with custom settings." },
      { title: "Team Management", detail: "Invite and manage team members with role-based access." },
      { title: "Goal Tracking", detail: "Set and track organizational goals and milestones." },
    ],
    href: "/myorganizations"
  },
  {
    key: "feed",
    label: "Activity Feed",
    icon: <MessageSquare className="w-6 h-6 mr-2 text-pink-400" />,
    description: "Stay connected with the community through posts, updates, and social interactions.",
    intro: "Engage with the community and share updates about your projects and achievements.",
    benefits: [
      "Post updates and announcements",
      "Engage with community posts",
      "Share achievements and milestones"
    ],
    useCase: "A user can post about project milestones, engage with community updates, and build their professional network.",
    mock: [
      { title: "Community Posts", detail: "Share updates, announcements, and achievements with the community." },
      { title: "Social Engagement", detail: "Like, comment, and interact with community posts." },
      { title: "Activity Tracking", detail: "Stay updated with recent activity from your network." },
    ],
    href: "/feed"
  },
];

export default function FeaturesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "workflow";
  const [activeTabState, setActiveTab] = useState(activeTab);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Platform Features</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover the powerful tools and features that make Covion Partners the ultimate platform for business collaboration and growth.
          </p>
        </header>
        <Suspense fallback={<div className="text-center">Loading features...</div>}>
          <FeaturesTabContent />
        </Suspense>
      </div>
    </div>
  );
}

function FeaturesTabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "workflow";
  const [activeTabState, setActiveTab] = useState(activeTab);
  
  return (
    <>
        {/* Clickable Feature Cards */}
        <nav className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8" aria-label="Feature categories">
          {features.map((f) => (
            <article
              key={f.key}
              className={`cursor-pointer rounded-xl p-6 flex flex-col items-center justify-center border transition-all leonardo-card ${activeTabState === f.key ? 'border-blue-500/70 bg-gray-900/80' : 'border-gray-800 bg-gray-900/40 hover:border-blue-400/40'}`}
              onClick={() => setActiveTab(f.key)}
              role="button"
              aria-label={`View ${f.label} feature details`}
              tabIndex={0}
            >
              {f.icon}
              <span className="mt-2 font-semibold text-white text-center">{f.label}</span>
            </article>
          ))}
        </nav>
        <Tabs value={activeTabState} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex gap-2 justify-center mb-6 p-1 overflow-x-auto whitespace-nowrap -mx-4 px-4 scrollbar-hide" role="tablist" aria-label="Feature tabs">
            {features.map((f) => (
              <TabsTrigger 
                key={f.key} 
                value={f.key} 
                className="flex items-center justify-center p-2 sm:p-3 min-w-[40px] sm:min-w-[48px] h-[40px] sm:h-[48px] rounded-lg"
                aria-label={f.label}
              >
                {f.icon}
              </TabsTrigger>
            ))}
          </TabsList>
          {features.map((f) => (
            <TabsContent key={f.key} value={f.key} className="bg-gray-900 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center">{f.icon}{f.label}</h3>
              <p className="text-gray-300 mb-6">{f.description}</p>
              <div className="mb-6">
                <p className="text-white/90 mb-2 font-medium">{f.intro}</p>
                <div className="mb-2">
                  <span className="font-semibold text-white">Key Benefits:</span>
                  <ul className="list-disc list-inside text-gray-300 ml-4">
                    {f.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-white">Use Case:</span>
                  <span className="text-gray-300 ml-2">{f.useCase}</span>
                </div>
              </div>
              <ul className="mb-8 space-y-3">
                {f.mock.map((item, i) => (
                  <li key={i} className="bg-gray-800 rounded-lg px-4 py-3 text-white/90">
                    <span className="font-semibold text-white">{item.title}:</span> {item.detail}
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
        {/* Account Types Card */}
        <section className="mt-12" aria-label="Account types">
          <div 
            className="bg-gray-900 rounded-xl p-8 shadow-lg cursor-pointer hover:bg-gray-800/80 transition-all"
            onClick={() => router.push('/account-types')}
            role="button"
            aria-label="View account types"
            tabIndex={0}
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Account Types</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                <Users className="w-8 h-8 text-blue-400 mb-2" />
                <span className="font-semibold text-white">Public</span>
                <span className="text-gray-400 text-sm text-center mt-1">Browse and join public projects. Limited access to platform features.</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-400 mb-2" />
                <span className="font-semibold text-white">Partner</span>
                <span className="text-gray-400 text-sm text-center mt-1">Support and invest in projects. Access to dealmaking and financial tools.</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                <Briefcase className="w-8 h-8 text-purple-400 mb-2" />
                <span className="font-semibold text-white">Manager</span>
                <span className="text-gray-400 text-sm text-center mt-1">Create and manage projects. Full access to workflow and collaboration tools.</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg">
                <Shield className="w-8 h-8 text-yellow-400 mb-2" />
                <span className="font-semibold text-white">Business</span>
                <span className="text-gray-400 text-sm text-center mt-1">Advanced analytics, team management, and enterprise features.</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button className="gradient-button">
                View All Account Types
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
        <section className="max-w-5xl mx-auto mb-16" aria-label="Access levels">
          <h2 className="text-3xl font-bold text-white mb-4">Access Levels</h2>
          <p className="text-lg text-gray-300 mb-8">
            Our advanced Access Level system lets you control exactly who can view, edit, or manage every part of your project. Assign levels 1–5 to team members and files for secure, flexible collaboration.
          </p>
          <div className="w-full bg-gradient-to-r from-purple-800/60 to-indigo-800/60 rounded-2xl p-8 mb-8 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Access Level Examples</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              <div className="flex flex-col items-center">
                <Lock className="w-10 h-10 text-purple-400 mb-2" />
                <span className="text-lg font-bold text-purple-300">Level 1</span>
                <span className="text-gray-300 text-sm mt-1 text-center">Strictly confidential<br />Top-level management only</span>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="w-10 h-10 text-blue-400 mb-2" />
                <span className="text-lg font-bold text-blue-300">Level 2</span>
                <span className="text-gray-300 text-sm mt-1 text-center">Sensitive project data<br />Core team access</span>
              </div>
              <div className="flex flex-col items-center">
                <Star className="w-10 h-10 text-green-400 mb-2" />
                <span className="text-lg font-bold text-green-300">Level 3</span>
                <span className="text-gray-300 text-sm mt-1 text-center">General team files<br />Collaborators & advisors</span>
              </div>
              <div className="flex flex-col items-center">
                <Eye className="w-10 h-10 text-yellow-400 mb-2" />
                <span className="text-lg font-bold text-yellow-300">Level 4</span>
                <span className="text-gray-300 text-sm mt-1 text-center">View-only or external partners</span>
              </div>
              <div className="flex flex-col items-center">
                <UserPlus className="w-10 h-10 text-pink-400 mb-2" />
                <span className="text-lg font-bold text-pink-300">Level 5</span>
                <span className="text-gray-300 text-sm mt-1 text-center">Guests, new members, or public info</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <a href="/accesslevels" className="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg shadow-lg hover:from-purple-600 hover:to-indigo-600 transition">
              Learn More About Access Levels
            </a>
          </div>
        </section>
    </>
  );
}


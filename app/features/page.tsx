"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderKanban, Handshake, DollarSign, Briefcase, Users, Globe, Lock, BarChart2, FileText, Bell, Shield } from "lucide-react";
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
    key: "global",
    label: "Global Opportunities",
    icon: <Globe className="w-6 h-6 mr-2 text-green-400" />,
    description: "Discover and connect with investment opportunities and partners from around the world.",
    intro: "Expand your reach and find new partners or projects worldwide.",
    benefits: [
      "Browse a global marketplace of projects",
      "Transact in multiple currencies",
      "Connect with international partners"
    ],
    useCase: "An investor can discover and join projects in different countries, diversifying their portfolio.",
    mock: [
      { title: "Marketplace", detail: "Browse global projects and deals." },
      { title: "International Payments", detail: "Transact in multiple currencies." },
      { title: "Partner Discovery", detail: "Find and connect with new partners worldwide." },
    ],
    href: "/publicprojects"
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
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Platform Features</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Discover the powerful tools and features that make Covion Partners the ultimate platform for business collaboration and growth.
          </p>
        </div>

        <Suspense fallback={<div className="text-center">Loading features...</div>}>
          <FeaturesContent />
        </Suspense>
      </div>
    </div>
  );
}

function FeaturesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "workflow";
  const [activeTabState, setActiveTab] = useState(activeTab);
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Platform Features</h1>
        {/* Clickable Feature Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {features.map((f) => (
            <div
              key={f.key}
              className={`cursor-pointer rounded-xl p-6 flex flex-col items-center justify-center border transition-all leonardo-card ${activeTabState === f.key ? 'border-blue-500/70 bg-gray-900/80' : 'border-gray-800 bg-gray-900/40 hover:border-blue-400/40'}`}
              onClick={() => setActiveTab(f.key)}
            >
              {f.icon}
              <span className="mt-2 font-semibold text-white text-center">{f.label}</span>
            </div>
          ))}
        </div>
        <Tabs value={activeTabState} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-2 justify-center mb-6">
            {features.map((f) => (
              <TabsTrigger key={f.key} value={f.key} className="flex items-center justify-center">
                {f.icon}
              </TabsTrigger>
            ))}
          </TabsList>
          {features.map((f) => (
            <TabsContent key={f.key} value={f.key} className="bg-gray-900 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center">{f.icon}{f.label}</h2>
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
        <div className="mt-12">
          <div className="bg-gray-900 rounded-xl p-8 shadow-lg">
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
          </div>
        </div>
      </div>
    </div>
  );
} 
import { Metadata } from "next"
import ProjectsInfoContent from "./ProjectsInfoContent"

export const metadata: Metadata = {
  title: "Project Management Software | Comprehensive Team Collaboration Platform | Covion Partners",
  description: "Complete project management solution with team collaboration, task tracking, financial management, file sharing, and workflow automation. Create unlimited projects, manage teams with 5-level access control, track budgets, and deliver projects efficiently. Free and paid plans available.",
  keywords: [
    "project management",
    "project management software",
    "team collaboration",
    "task tracking",
    "project planning",
    "team management",
    "project delivery",
    "collaboration tools",
    "project tracking",
    "milestone management",
    "team coordination",
    "workflow automation",
    "project management platform",
    "team collaboration software",
    "project tracking tools",
    "budget tracking",
    "file management",
    "project analytics",
    "project status management",
    "team access control",
    "project financials",
    "project updates",
    "public projects",
    "private projects",
    "project key sharing",
    "project management features",
    "agile project management",
    "scrum project management",
    "kanban boards",
    "project dashboard"
  ].join(", "),
  authors: [{ name: "Covion Partners" }],
  creator: "Covion Partners",
  publisher: "Covion Partners",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Project Management Software | Comprehensive Team Collaboration Platform | Covion Partners",
    description: "Complete project management solution with team collaboration, task tracking, financial management, file sharing, and workflow automation. Create unlimited projects, manage teams with 5-level access control, track budgets, and deliver projects efficiently.",
    type: "website",
    url: "https://www.covionpartners.com/projectsinfo",
    siteName: "Covion Partners",
    locale: "en_US",
    images: [
      {
        url: "https://www.covionpartners.com/og-project-management.jpg",
        width: 1200,
        height: 630,
        alt: "Covion Partners Project Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Management Software | Covion Partners",
    description: "Complete project management solution with team collaboration, task tracking, financial management, and workflow automation.",
    images: ["https://www.covionpartners.com/og-project-management.jpg"],
    creator: "@covionpartners",
  },
  alternates: {
    canonical: "https://www.covionpartners.com/projectsinfo",
  },
  category: "Project Management Software",
}

export default function ProjectsInfoPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Covion Partners Project Management",
    "applicationCategory": "ProjectManagementApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "description": "Comprehensive project management platform with team collaboration, task tracking, financial management, file sharing, workflow automation, and 5-level access control system.",
    "featureList": [
      "Project creation with custom keys",
      "Team member invitation and management",
      "5-level access control system",
      "Task creation and assignment",
      "Workflow automation",
      "Budget and expense tracking",
      "Investment and funding features",
      "File upload and organization",
      "Media gallery support",
      "Project updates and announcements",
      "Real-time notifications",
      "Public/private project visibility",
      "Funding goal settings",
      "Search and filter capabilities",
      "Project favorites/pinning",
      "Progress tracking with visual indicators",
      "Status management (Active, Pending, On Hold, Completed)",
      "Deadline tracking and reminders",
      "Custom project roles",
      "Team member status management",
      "Financial reports and analytics",
      "Project settings and configuration",
      "Join requests and approvals"
    ],
    "screenshot": "https://www.covionpartners.com/project-management-screenshot.jpg"
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProjectsInfoContent />
    </>
  )
} 
import { Metadata } from "next";
import FeaturesContent from "./FeaturesContent";

export const metadata: Metadata = {
  title: "Platform Features | Covion Partners - Business Collaboration & Management Tools",
  description: "Discover 19+ powerful features including task management, deal making, financial hub, project management, AI assistant, jobs board, contracts, cloud services, and more. All-in-one platform for business collaboration and growth.",
  keywords: [
    "business collaboration platform",
    "project management tools",
    "deal making software",
    "task management",
    "workflow automation",
    "financial management",
    "team collaboration",
    "contract management",
    "AI assistant",
    "jobs board",
    "cloud services integration",
    "organization management",
    "document management",
    "calendar scheduling",
    "messaging platform",
    "secure payments",
    "public projects",
    "business growth tools",
    "enterprise collaboration",
    "Covion Partners features"
  ].join(", "),
  openGraph: {
    title: "Platform Features | Covion Partners",
    description: "Discover 19+ powerful features for business collaboration, project management, deal making, and team coordination. All-in-one platform for modern businesses.",
    type: "website",
    siteName: "Covion Partners",
  },
  twitter: {
    card: "summary_large_image",
    title: "Platform Features | Covion Partners",
    description: "Discover 19+ powerful features for business collaboration, project management, deal making, and team coordination.",
  },
  alternates: {
    canonical: "/features",
  },
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
};

export default function FeaturesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Covion Partners",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150",
            },
            "featureList": [
              "Task & Workflow Management",
              "Deal Making Hub",
              "Financial Hub",
              "Project Management",
              "Team Collaboration",
              "Secure Payments",
              "Messaging & Group Chat",
              "Document Management",
              "Public Project Discovery",
              "Notifications & Alerts",
              "Account & Access Control",
              "Jobs Board",
              "Infinito AI Assistant",
              "Contract Library",
              "Notes & Documentation",
              "Schedule & Calendar",
              "Cloud Services Integration",
              "Organizations",
              "Activity Feed"
            ],
            "description": "Comprehensive business collaboration and management platform with 19+ features for project management, deal making, team collaboration, and business growth.",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Platform Features | Covion Partners",
            "description": "Discover 19+ powerful features for business collaboration, project management, deal making, and team coordination.",
            "url": "https://covionpartners.com/features",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Task & Workflow Management",
                  "description": "Organize, assign, and track tasks with powerful workflow tools designed to boost productivity and team collaboration."
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Deal Making Hub",
                  "description": "Discover, negotiate, and close deals with partners and clients using powerful collaboration and transaction tools."
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Financial Hub",
                  "description": "Easily manage your payments, balances, and financial activity in one place with powerful tools and real-time insights."
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "name": "Project Management",
                  "description": "Create, manage, and track projects with comprehensive tools for milestones and team collaboration."
                },
                {
                  "@type": "ListItem",
                  "position": 5,
                  "name": "Team Collaboration",
                  "description": "Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools."
                },
                {
                  "@type": "ListItem",
                  "position": 6,
                  "name": "Infinito AI Assistant",
                  "description": "Get instant answers and guidance about your projects, partners, and workflows with our AI assistant."
                },
                {
                  "@type": "ListItem",
                  "position": 7,
                  "name": "Jobs Board",
                  "description": "Find your next opportunity or post job openings. Discover new roles or connect with top talent."
                },
                {
                  "@type": "ListItem",
                  "position": 8,
                  "name": "Contract Library",
                  "description": "Manage, store, and sign contracts digitally with our comprehensive contract library."
                }
              ]
            }
          }),
        }}
      />
      <FeaturesContent />
    </>
  );
}

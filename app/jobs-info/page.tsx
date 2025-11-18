import { Metadata } from "next"
import JobsInfoContent from "./JobsInfoContent"

export const metadata: Metadata = {
  title: "Jobs Board | Find Your Next Opportunity or Post Job Openings | Covion Partners",
  description: "Discover amazing job opportunities or post your own job openings. Advanced search and filtering by location, type, experience level, and skills. Connect with top talent and innovative companies. Free job posting for public users (2 posts/month), unlimited for paid accounts.",
  keywords: [
    "jobs board",
    "job board",
    "job search",
    "job posting",
    "career opportunities",
    "find jobs",
    "post jobs",
    "job listings",
    "remote jobs",
    "full time jobs",
    "part time jobs",
    "contract jobs",
    "internship",
    "freelance jobs",
    "job search platform",
    "hiring platform",
    "recruitment",
    "job applications",
    "job board software",
    "career platform",
    "job marketplace",
    "talent acquisition",
    "job discovery",
    "job filtering",
    "job search by skills",
    "job search by location",
    "job search by experience",
    "company job postings",
    "organization jobs",
    "project roles",
    "open positions",
    "job opportunities",
    "career growth",
    "job matching",
    "applicant tracking",
    "job management",
    "employment opportunities",
    "job board features",
    "job search tools",
    "job posting platform",
    "Covion Partners jobs"
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
    title: "Jobs Board | Find Your Next Opportunity or Post Job Openings | Covion Partners",
    description: "Discover amazing job opportunities or post your own job openings. Advanced search and filtering by location, type, experience level, and skills. Connect with top talent and innovative companies.",
    type: "website",
    url: "https://www.covionpartners.com/jobs-info",
    siteName: "Covion Partners",
    locale: "en_US",
    images: [
      {
        url: "https://www.covionpartners.com/og-jobs-board.jpg",
        width: 1200,
        height: 630,
        alt: "Covion Partners Jobs Board Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobs Board | Find Your Next Opportunity | Covion Partners",
    description: "Discover amazing job opportunities or post your own job openings. Advanced search and filtering by location, type, experience level, and skills.",
    images: ["https://www.covionpartners.com/og-jobs-board.jpg"],
    creator: "@covionpartners",
  },
  alternates: {
    canonical: "https://www.covionpartners.com/jobs-info",
  },
  category: "Job Board Software",
}

export default function JobsInfoPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Covion Partners Jobs Board",
    "applicationCategory": "JobSearchApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "ratingCount": "200"
    },
    "description": "Comprehensive job board platform for discovering career opportunities and posting job openings. Features advanced search, filtering by location, job type, experience level, and skills. Includes application management, company profiles, and project-based roles.",
    "featureList": [
      "Job listings grid with company logos and banners",
      "Advanced search by title, company, description, and skills",
      "Location-based filtering",
      "Job type filtering (Full Time, Part Time, Contract, Internship, Freelance)",
      "Experience level filtering (Entry, Junior, Mid, Senior, Lead, Executive)",
      "Remote job filtering",
      "Skills-based filtering with popular skills tags",
      "Job cards with salary information",
      "Application count tracking",
      "View count tracking",
      "Job detail pages with full descriptions",
      "Requirements and benefits sections",
      "Skills tags display",
      "Company/organization integration",
      "Company profile links",
      "Job posting functionality",
      "Application submission system",
      "Application management for employers",
      "Job editing capabilities",
      "Organization-based job listings",
      "Project roles and open positions",
      "Public user job posting (2 posts/month limit)",
      "Unlimited job posting for paid accounts",
      "Job status management",
      "Salary range display",
      "Currency support",
      "Job image/banner uploads",
      "Company logo integration",
      "Responsive design for mobile and desktop",
      "Real-time job updates",
      "Job expiration and status tracking",
      "Employer dashboard for managing postings",
      "Applicant tracking and review",
      "Similar jobs recommendations",
      "Job sharing capabilities"
    ],
    "screenshot": "https://www.covionpartners.com/jobs-board-screenshot.jpg"
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <JobsInfoContent />
    </>
  )
}


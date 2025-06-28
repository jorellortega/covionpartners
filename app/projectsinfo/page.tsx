import { Metadata } from "next"
import ProjectsInfoContent from "./ProjectsInfoContent"

export const metadata: Metadata = {
  title: "Project Management | Covion Partners",
  description: "Covion's Project Management suite empowers teams to plan, track, and deliver projects efficiently. Collaborate, manage resources, and keep stakeholders in the loop—all in one secure platform.",
  keywords: "project management, team collaboration, task tracking, project planning, team management, project delivery, collaboration tools, project tracking, milestone management, team coordination",
  openGraph: {
    title: "Project Management | Covion Partners",
    description: "Covion's Project Management suite empowers teams to plan, track, and deliver projects efficiently. Collaborate, manage resources, and keep stakeholders in the loop—all in one secure platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Management | Covion Partners",
    description: "Covion's Project Management suite empowers teams to plan, track, and deliver projects efficiently. Collaborate, manage resources, and keep stakeholders in the loop—all in one secure platform.",
  },
}

export default function ProjectsInfoPage() {
  return <ProjectsInfoContent />
} 
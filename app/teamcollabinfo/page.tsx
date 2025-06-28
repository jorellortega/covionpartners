import { Metadata } from "next"
import TeamCollabInfoContent from "./TeamCollabInfoContent"

export const metadata: Metadata = {
  title: "Team Collaboration | Covion Partners",
  description: "Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools. Enhance productivity, communication, and project success with Covion's team collaboration suite.",
  keywords: "team collaboration, real-time messaging, shared calendars, document sharing, role-based access, collaboration tools, teamwork, productivity, stakeholder communication, Covion Partners",
  openGraph: {
    title: "Team Collaboration | Covion Partners",
    description: "Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools. Enhance productivity, communication, and project success with Covion's team collaboration suite.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Team Collaboration | Covion Partners",
    description: "Work seamlessly with team members, partners, and stakeholders through integrated collaboration tools. Enhance productivity, communication, and project success with Covion's team collaboration suite.",
  },
}

export default function TeamCollabInfoPage() {
  return <TeamCollabInfoContent />
} 
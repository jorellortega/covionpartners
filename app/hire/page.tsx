"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User } from "lucide-react"

// Mock user data
const mockUsers = [
  {
    id: "1",
    name: "Alice Johnson",
    title: "Full Stack Developer",
    avatar: null,
    bio: "Experienced developer with a passion for building scalable web apps.",
    location: "New York, USA",
    skills: ["React", "Node.js", "TypeScript", "AWS"]
  },
  {
    id: "2",
    name: "Bob Smith",
    title: "Product Manager",
    avatar: null,
    bio: "Product leader with a background in SaaS and fintech.",
    location: "San Francisco, USA",
    skills: ["Agile", "Scrum", "Leadership", "Fintech"]
  },
  {
    id: "3",
    name: "Carol Lee",
    title: "UI/UX Designer",
    avatar: null,
    bio: "Designing delightful user experiences for startups and enterprises.",
    location: "London, UK",
    skills: ["Figma", "Sketch", "User Research", "Prototyping"]
  },
  {
    id: "4",
    name: "David Kim",
    title: "Data Scientist",
    avatar: null,
    bio: "Turning data into actionable insights for business growth.",
    location: "Toronto, Canada",
    skills: ["Python", "Machine Learning", "SQL", "Data Visualization"]
  }
]

const allLocations = [
  "New York, USA",
  "San Francisco, USA",
  "London, UK",
  "Toronto, Canada"
]

const allTitles = [
  "Full Stack Developer",
  "Product Manager",
  "UI/UX Designer",
  "Data Scientist"
]

const allSkills = [
  "React", "Node.js", "TypeScript", "AWS",
  "Agile", "Scrum", "Leadership", "Fintech",
  "Figma", "Sketch", "User Research", "Prototyping",
  "Python", "Machine Learning", "SQL", "Data Visualization"
]

export default function HirePage() {
  const [search, setSearch] = useState("")
  const [location, setLocation] = useState("")
  const [title, setTitle] = useState("")
  const [skill, setSkill] = useState("")
  const router = useRouter()

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.title.toLowerCase().includes(search.toLowerCase()) ||
      user.bio.toLowerCase().includes(search.toLowerCase())
    const matchesLocation = location ? user.location === location : true
    const matchesTitle = title ? user.title === title : true
    const matchesSkill = skill ? user.skills.includes(skill) : true
    return matchesSearch && matchesLocation && matchesTitle && matchesSkill
  })

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">Hire Talent & Collaborators</h1>
        <p className="text-gray-400 text-center mb-8">Search, filter, and discover professionals on the platform. Click a profile to view more details or connect.</p>
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Input
            placeholder="Search by name, title, or bio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-lg"
          />
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="rounded-md border border-gray-700 bg-gray-800/30 px-3 py-2 text-white"
          >
            <option value="">All Locations</option>
            {allLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="rounded-md border border-gray-700 bg-gray-800/30 px-3 py-2 text-white"
          >
            <option value="">All Roles</option>
            {allTitles.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={skill}
            onChange={e => setSkill(e.target.value)}
            className="rounded-md border border-gray-700 bg-gray-800/30 px-3 py-2 text-white"
          >
            <option value="">All Skills</option>
            {allSkills.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredUsers.length > 0 ? filteredUsers.map(user => (
            <Card key={user.id} className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-gray-800 hover:border-blue-500/40 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={56} height={56} className="rounded-full object-cover w-14 h-14" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <User className="w-7 h-7 text-blue-400" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <CardDescription className="text-blue-400">{user.title}</CardDescription>
                  <div className="text-xs text-gray-400 mt-1">{user.location}</div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-2 line-clamp-2">{user.bio}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {user.skills.map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={() => router.push(`/profile/${user.id}`)}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full text-center text-gray-400 py-12">
              No users found matching your search and filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
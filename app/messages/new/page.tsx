"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import NewMessageForm from "./NewMessageForm"

interface User {
  id: string
  name: string | null
  email: string | null
}

interface Project {
  id: string
  name: string
}

interface TeamMember {
  id: string
  user_id: string
  project_id: number
  role: string
  user: User
}

interface TeamProjectResponse {
  project: Project
}

interface ProjectOwnerResponse {
  owner_id: string
  owner: {
    id: string
    name: string | null
    email: string | null
  }
}

export default function NewMessagePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewMessageForm />
    </Suspense>
  )
} 
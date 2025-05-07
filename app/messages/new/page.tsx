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
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams();
  const replyToId = searchParams.get('reply_to');
  const projectIdParam = searchParams.get('project_id');
  const receiverIdParam = searchParams.get('receiver_id');
  const [projects, setProjects] = useState<Project[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    project_id: "",
    receiver_id: "",
    subject: "",
    content: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [parentMessage, setParentMessage] = useState<any>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentProject, setParentProject] = useState<any>(null);
  const [parentRecipient, setParentRecipient] = useState<any>(null);

  useEffect(() => {
    console.log('Fetching projects for user:', user?.id)
    if (user) {
      fetchProjects()
    }
    // If replying, fetch the original message
    if (replyToId && user) {
      (async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', replyToId)
          .single();
        if (!error && data) {
          setParentMessage(data);
          setParentId(data.id);
          setFormData(prev => ({
            ...prev,
            project_id: data.project_id || projectIdParam || "",
            receiver_id: user.id === data.sender_id ? data.receiver_id : data.sender_id || receiverIdParam || "",
            subject: data.subject?.startsWith('Re:') ? data.subject : `Re: ${data.subject}`
          }));
          // Fetch project info
          if (data.project_id) {
            const { data: projectData } = await supabase
              .from('projects')
              .select('id, name')
              .eq('id', data.project_id)
              .single();
            setParentProject(projectData);
          }
          // Fetch recipient info
          const recipientId = user.id === data.sender_id ? data.receiver_id : data.sender_id;
          const { data: recipientData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', recipientId)
            .single();
          setParentRecipient(recipientData);
        }
      })();
    } else if (projectIdParam || receiverIdParam) {
      setFormData(prev => ({
        ...prev,
        project_id: projectIdParam || prev.project_id,
        receiver_id: receiverIdParam || prev.receiver_id
      }));
    }
  }, [user, replyToId, projectIdParam, receiverIdParam])

  useEffect(() => {
    if (replyToId && parentProject && parentRecipient) {
      setFormData(prev => ({
        ...prev,
        project_id: parentProject.id,
        receiver_id: parentRecipient.id
      }))
    }
  }, [replyToId, parentProject, parentRecipient])

  useEffect(() => {
    if (formData.project_id && !replyToId) {
      fetchTeamMembers(formData.project_id)
    } else if (!formData.project_id) {
      setTeamMembers([])
    }
  }, [formData.project_id, replyToId])

  const fetchProjects = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      // First get projects where user is the owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('name')
      
      if (ownedError) throw ownedError

      // Then get projects where user is a team member
      const { data: teamMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', user.id)
      
      if (teamError) throw teamError
      
      let memberProjects: Project[] = []
      
      if (teamMemberships && teamMemberships.length > 0) {
        const projectIds = teamMemberships.map(tm => tm.project_id)
        
        const { data: joinedProjects, error: joinedError } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds)
          .order('name')
        
        if (joinedError) throw joinedError
        memberProjects = joinedProjects || []
      }
      
      // Combine owned and member projects, removing duplicates
      const allProjects = [...(ownedProjects || []), ...memberProjects]
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      )
      
      setProjects(uniqueProjects)
    } catch (err) {
      console.error('Error fetching projects:', err)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async (projectId: string) => {
    try {
      setLoading(true)
      console.log('Starting fetchTeamMembers using useTeamMembers logic for projectId:', projectId)
      setError(null)

      // 1. Fetch basic team member data from team_members table
      console.log('Fetching team_members data...')
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*') 
        .eq('project_id', projectId)
        .neq('user_id', user?.id) // Exclude current user
        .order('created_at', { ascending: false })

      console.log('Team members data query result:', { membersData, membersError })
      if (membersError) throw membersError
      if (!membersData) {
        setTeamMembers([])
        setLoading(false)
        return
      }

      // Extract user IDs
      const userIds = membersData
        .map((member) => member.user_id)
        .filter((id): id is string => !!id)

      console.log('Extracted User IDs:', userIds)
      let usersData: User[] = []

      // Also get the project owner ID
      console.log('Fetching project owner ID...')
      const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('owner_id')
          .eq('id', projectId)
          .single()

      console.log('Project owner ID query result:', { projectData, projectError })
      if (projectError) {
        console.warn('Could not fetch project owner:', projectError.message)
        // Continue even if owner fetch fails
      }
      
      const ownerId = projectData?.owner_id
      if (ownerId && ownerId !== user?.id && !userIds.includes(ownerId)) {
        userIds.push(ownerId)
        console.log('Added owner ID to fetch list:', ownerId)
      }

      if (userIds.length > 0) {
        // 2. Fetch corresponding users from the public users table
        console.log('Fetching user details for IDs:', userIds)
        const { data: fetchedUsers, error: usersError } = await supabase
          .from('users') 
          .select('id, name, email') 
          .in('id', userIds)

        console.log('User details query result:', { fetchedUsers, usersError })
        if (usersError) {
           console.warn("Could not fetch user details:", usersError.message)
        } else {
          usersData = fetchedUsers || []
        }
      }

      // 3. Combine the data
      console.log('Combining team member and user data...')
      const combinedData = membersData.map((member) => {
        const userDetail = usersData.find((u) => u.id === member.user_id)
        return {
          ...member,
          user: userDetail || { id: member.user_id, name: 'N/A', email: 'N/A' }
        }
      })

      // Add owner if they weren't in team_members and were fetched
      if (ownerId && ownerId !== user?.id && !membersData.some(m => m.user_id === ownerId)) {
          const ownerDetail = usersData.find(u => u.id === ownerId)
          if (ownerDetail) {
              console.log('Adding fetched owner to the list')
              combinedData.unshift({
                  id: '0-owner', // Special ID for owner not in team_members
                  user_id: ownerId,
                  project_id: parseInt(projectId),
                  role: 'Owner', // Assign role explicitly
                  user: ownerDetail
              })
          }
      }

      console.log('Final combined team members list:', combinedData)
      setTeamMembers(combinedData)

    } catch (error: any) {
      let errorMessage = 'Failed to fetch team members or user details';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`;
        console.error('Error in fetchTeamMembers:', error.message, '\nFull Error:', error);
      } else {
        try {
          const errorString = JSON.stringify(error);
          errorMessage += `: ${errorString}`;
          console.error('Error in fetchTeamMembers (stringified):', errorString);
        } catch (stringifyError) {
          console.error('Error in fetchTeamMembers (raw object):', error);
        }
      }
      setError(errorMessage) // Setting error state might be useful
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const fileExt = file.name.split('.').pop()
    const filePath = `messages-attachments/${user.id}/${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage.from('partnerfiles').upload(filePath, file)
    if (error) {
      toast.error('Failed to upload attachment')
      return
    }
    const { data: publicUrlData } = supabase.storage.from('partnerfiles').getPublicUrl(filePath)
    setAttachmentUrl(publicUrlData.publicUrl)
    toast.success('Attachment uploaded')
  }

  const handleAddLink = () => {
    let url = prompt('Enter a link (e.g. https://example.com or www.example.com)')
    if (url) {
      url = url.trim()
      if (!url.startsWith('http')) {
        url = 'https://' + url
      }
      setLinkUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.receiver_id || !formData.subject.trim() || !formData.content.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setSending(true)
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user?.id,
          receiver_id: formData.receiver_id,
          subject: formData.subject.trim(),
          content: formData.content.trim(),
          attachment_url: attachmentUrl,
          link_url: linkUrl,
          parent_id: parentId,
          project_id: formData.project_id
        }])

      if (error) throw error

      toast.success('Message sent successfully')
      router.push('/messages')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gray-950">
        <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-2 sm:mr-4"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h1 className="text-xl sm:text-3xl font-bold text-white">New Message</h1>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto py-4 sm:py-6 px-3 sm:px-6">
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Project:</label>
                  {replyToId && parentProject ? (
                    <div className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2">{parentProject.name}</div>
                  ) : (
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, project_id: value, receiver_id: "" }))
                      }}
                    >
                      <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">To:</label>
                  {replyToId && parentRecipient ? (
                    <div className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2">
                      {parentRecipient.name} <span className="text-xs text-gray-400">({parentRecipient.email})</span>
                    </div>
                  ) : (
                    <Select
                      value={formData.receiver_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, receiver_id: value }))}
                      disabled={!formData.project_id}
                    >
                      <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder={formData.project_id ? "Select recipient" : "Select a project first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.user.name || 'Unnamed User'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Subject:</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter subject"
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={!!replyToId}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">Message:</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Type your message here..."
                    className="min-h-[200px] bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    className="px-3 py-1 rounded border border-blue-500 text-blue-300 font-medium bg-transparent hover:bg-blue-500/10 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Attach File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 rounded border border-green-500 text-green-300 font-medium bg-transparent hover:bg-green-500/10 transition-colors"
                    onClick={handleAddLink}
                  >
                    Add Link
                  </button>
                  {attachmentUrl && (
                    <span className="ml-2 text-xs text-blue-400">Attachment added</span>
                  )}
                  {linkUrl && (
                    <span className="ml-2 text-xs text-green-400">Link added</span>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 text-white hover:bg-purple-700"
                    disabled={sending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </Suspense>
  )
} 
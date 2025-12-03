"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Key, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"

export default function JoinProjectPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [projectKey, setProjectKey] = useState("")
  const [joinError, setJoinError] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinProject = async () => {
    if (!projectKey.trim() || !user?.id) return;
    
    setIsJoining(true)
    setJoinError("")
    
    try {
      // Find the project with this key
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('project_key', projectKey.trim())
        .single()

      if (projectError || !projectData) {
        throw new Error('Invalid project key')
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('project_id', projectData.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        throw memberCheckError
      }

      if (existingMember) {
        if (existingMember.status === 'active') {
          throw new Error('You are already a member of this project')
        } else if (existingMember.status === 'pending') {
          throw new Error('Your request to join this project is pending approval')
        }
      }

      // Add user as team member
      const { error: joinError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectData.id,
          user_id: user.id,
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString()
        }])

      if (joinError) throw joinError

      // Clear the input
      setProjectKey("")

      // Show success message
      toast({
        title: "Success",
        description: `Successfully requested to join "${projectData.name}"! Redirecting...`
      })
      
      // Redirect to the project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectData.id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Error joining project:', error)
      setJoinError(error.message || 'Failed to join project')
      toast({
        title: "Error",
        description: error.message || "Failed to join project",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Main Card */}
        <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Join a Project</CardTitle>
                <CardDescription className="mt-1">
                  Enter a project key to request access and join the team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-key" className="text-white/90">
                Project Key
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="project-key"
                  placeholder="Enter project key (e.g., COV-ABC12)"
                  value={projectKey}
                  onChange={(e) => {
                    setProjectKey(e.target.value)
                    setJoinError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isJoining && projectKey.trim()) {
                      handleJoinProject()
                    }
                  }}
                  className="pl-10 bg-gray-800/30 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  disabled={isJoining}
                />
              </div>
              {joinError && (
                <div className="text-sm text-red-500 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {joinError}
                </div>
              )}
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white" 
              onClick={handleJoinProject}
              disabled={isJoining || !projectKey.trim()}
              size="lg"
            >
              {isJoining ? (
                <>
                  <LoadingSpinner size={20} className="mr-2" />
                  Requesting Access...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Request to Join
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                <strong className="text-gray-300">How it works:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-400 list-disc list-inside">
                <li>Get a project key from the project owner</li>
                <li>Enter the key above to request access</li>
                <li>Wait for the project owner to approve your request</li>
                <li>Once approved, you'll be added to the project team</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


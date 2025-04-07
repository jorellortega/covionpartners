"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Building2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    size: "",
    location: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Insert the organization into the database
      const { data, error } = await supabase
        .from('organizations')
        .insert([
          {
            ...formData,
            owner_id: user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Redirect to the organization page
      router.push('/organizations')
    } catch (error) {
      console.error('Error creating organization:', error)
      alert('Failed to create organization. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white mb-4"
            onClick={() => router.push('/organizations')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
          <h1 className="text-3xl font-bold text-white">Create Organization</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-6 h-6 mr-2 text-blue-400" />
              Organization Details
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter the details of your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter organization name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="leonardo-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter organization description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="leonardo-input min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={handleChange}
                  className="leonardo-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    placeholder="Enter industry"
                    value={formData.industry}
                    onChange={handleChange}
                    required
                    className="leonardo-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Input
                    id="size"
                    name="size"
                    placeholder="e.g. 1-10, 11-50, 51-200"
                    value={formData.size}
                    onChange={handleChange}
                    required
                    className="leonardo-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="leonardo-input"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 
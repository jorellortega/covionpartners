"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUpdates } from '@/hooks/useUpdates'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EditUpdatePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { updateUpdate } = useUpdates()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    description: '',
    status: 'new',
    date: new Date().toISOString().split('T')[0],
    category: '',
    full_content: '',
  })

  useEffect(() => {
    async function fetchUpdate() {
      if (!user || !['partner', 'admin', 'ceo'].includes(user.role)) {
        toast.error('You do not have permission to edit updates')
        router.push('/updates')
        return
      }

      try {
        const { data: update, error } = await supabase
          .from('updates')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        if (!update) throw new Error('Update not found')

        setFormData({
          id: update.id,
          title: update.title,
          description: update.description,
          status: update.status || 'new',
          date: update.date || new Date().toISOString().split('T')[0],
          category: update.category,
          full_content: update.full_content || '',
        })
      } catch (error) {
        console.error('Error fetching update:', error)
        toast.error('Failed to load update')
        router.push('/updates')
      } finally {
        setLoading(false)
      }
    }

    fetchUpdate()
  }, [params.id, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting update with data:', formData)
    const { data, error } = await updateUpdate(formData)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Update edited successfully')
      router.push('/updates')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/updates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Updates
          </Button>
          <h1 className="text-3xl font-bold">Edit Update</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Update Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter update title"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter update description"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter update category"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Full Content</label>
                <Input
                  value={formData.full_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_content: e.target.value }))}
                  placeholder="Enter full content"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/updates')}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
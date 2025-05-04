"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Globe,
  ArrowLeft,
  Send,
  HelpCircle,
  MessageCircle,
  Construction
} from 'lucide-react'

export default function ContactPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
    email: '',
    name: '',
    company: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        subject: formData.subject,
        message: formData.message,
        category: formData.category,
        email: user?.email || formData.email,
        user_id: user?.id || null,
        name: user?.name || formData.name,
        company: formData.company
      }
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      toast({
        title: "Message Sent",
        description: "We'll get back to you as soon as possible.",
      })
      setSuccessMessage("Your message has been sent. We'll reach back to you soon.")
      setFormData({
        subject: '',
        message: '',
        category: 'general',
        email: '',
        name: '',
        company: ''
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 relative">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-purple-400"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Contact Us</h1>
              <p className="text-gray-400 text-sm">Send us a message and we'll get back to you as soon as possible.</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                  Contact Us
                </CardTitle>
                <CardDescription>
                  Send us a message and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!user && (
                    <div>
                      <label className="text-sm font-medium text-gray-200 block mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="bg-gray-900 border-gray-700"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-200 block mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Your Name"
                      value={user?.name || formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="bg-gray-900 border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-200 block mb-2">
                      Company
                    </label>
                    <Input
                      type="text"
                      placeholder="Your Company (optional)"
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      className="bg-gray-900 border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-200 block mb-2">
                      Subject
                    </label>
                    <Input
                      placeholder="What can we help you with?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="bg-gray-900 border-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-200 block mb-2">
                      Message
                    </label>
                    <Textarea
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-gray-900 border-gray-700 min-h-[200px]"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
                {successMessage && (
                  <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500 text-green-400 text-center">
                    {successMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">covionpartners@gmail.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 
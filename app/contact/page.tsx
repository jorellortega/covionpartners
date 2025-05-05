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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <a 
                      href="https://instagram.com/covionpartners" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="currentColor" 
                        viewBox="0 0 24 24" 
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Instagram</p>
                    <a 
                      href="https://instagram.com/covionpartners" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-purple-300 transition-colors"
                    >
                      @covionpartners
                    </a>
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
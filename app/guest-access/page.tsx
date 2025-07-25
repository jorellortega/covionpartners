"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Key, Users, ArrowRight, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { GuestAccessRequest, GuestAccessResponse } from "@/types/guest-accounts"

export default function GuestAccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [guestData, setGuestData] = useState<GuestAccessResponse | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    display_name: '',
    email: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code.trim() || !formData.display_name.trim()) {
      toast.error('Please enter both code and display name')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/guest-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          display_name: formData.display_name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined
        } as GuestAccessRequest)
      })

      const data: GuestAccessResponse = await response.json()

      if (data.success && data.guest_account) {
        setGuestData(data)
        toast.success(`Welcome to ${data.organization?.name}!`)
        
        // Store guest session data
        localStorage.setItem('guest_session', JSON.stringify({
          guest_code: data.guest_account.guest_code,
          organization_id: data.organization?.id,
          display_name: data.guest_account.display_name
        }))
      } else {
        toast.error(data.error || 'Failed to access organization')
      }
    } catch (error) {
      console.error('Error accessing guest account:', error)
      toast.error('Failed to access organization')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (guestData?.organization?.id) {
      // Redirect to organization-specific guest dashboard
      router.push(`/guest-dashboard/${guestData.organization.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Guest Access
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Enter your guest code to access the organization
            </p>
          </CardHeader>
          
          <CardContent>
            {!guestData ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code" className="text-white">Guest Code</Label>
                  <Input
                    id="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white text-center text-lg font-mono tracking-wider"
                    placeholder="ABC123"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-character code provided by the organization
                  </p>
                </div>

                <div>
                  <Label htmlFor="display_name" className="text-white">Your Name</Label>
                  <Input
                    id="display_name"
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-white">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Accessing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Access Organization
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Welcome, {guestData.guest_account?.display_name}!
                  </h3>
                  <p className="text-gray-400">
                    You now have guest access to
                  </p>
                  <p className="text-lg font-semibold text-purple-400">
                    {guestData.organization?.name}
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Guest Code:</span>
                    <code className="bg-gray-700 px-2 py-1 rounded text-sm font-mono text-white">
                      {guestData.guest_account?.guest_code}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      Active
                    </Badge>
                  </div>
                  {guestData.guest_account?.expires_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Expires:</span>
                      <span className="text-white text-sm">
                        {new Date(guestData.guest_account.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Continue to Organization
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGuestData(null)
                      setFormData({ code: '', display_name: '', email: '', phone: '' })
                    }}
                    className="w-full border-gray-700 hover:bg-gray-800"
                  >
                    Access Different Organization
                  </Button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium">Guest Access Information</p>
                      <p className="text-xs mt-1">
                        Your guest session will remain active until you close your browser or the organization revokes access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="mt-6 space-y-3">
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-white mb-1">What is Guest Access?</h4>
                  <p className="text-sm text-gray-400">
                    Guest access allows you to view and interact with organization content without creating a full account. 
                    You can upload files, send messages, and view projects based on the permissions granted by the organization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-white mb-1">Need a Guest Code?</h4>
                  <p className="text-sm text-gray-400">
                    Contact the organization administrator to request a guest access code. 
                    The code is typically a 6-character combination of letters and numbers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
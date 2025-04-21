"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  Building2,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  ArrowRight,
  UserPlus,
  Calendar,
} from "lucide-react"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [isCreateGuestOpen, setIsCreateGuestOpen] = useState(false)
  const [guestDetails, setGuestDetails] = useState({
    email: "",
    name: "",
    expiryDays: "7", // Default expiry of 7 days
  })
  const [isCreating, setIsCreating] = useState(false)

  // Debug log
  console.log("Current user:", user)

  const handleCreateGuest = async () => {
    if (!guestDetails.email || !guestDetails.name || !guestDetails.expiryDays) {
      toast.error("Please fill in all fields")
      return
    }

    setIsCreating(true)
    try {
      // Generate a random password
      const tempPassword = Math.random().toString(36).slice(-8)
      
      // Create the user in Supabase
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: guestDetails.email,
        password: tempPassword,
        options: {
          data: {
            name: guestDetails.name,
            role: "guest",
            expiry_date: new Date(Date.now() + parseInt(guestDetails.expiryDays) * 24 * 60 * 60 * 1000).toISOString(),
          }
        }
      })

      if (userError) throw userError

      // Create user profile in your users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: userData.user?.id,
            email: guestDetails.email,
            name: guestDetails.name,
            role: "guest",
            expiry_date: new Date(Date.now() + parseInt(guestDetails.expiryDays) * 24 * 60 * 60 * 1000).toISOString(),
          }
        ])

      if (profileError) throw profileError

      toast.success("Guest account created successfully")
      setIsCreateGuestOpen(false)
      setGuestDetails({
        email: "",
        name: "",
        expiryDays: "7",
      })

      // Send email with credentials (you would implement this based on your email service)
      // For now, we'll just show the credentials in a toast
      toast.info(`Account credentials have been created:\nEmail: ${guestDetails.email}\nTemporary Password: ${tempPassword}`)

    } catch (error: any) {
      console.error('Error creating guest account:', error)
      toast.error(error.message || "Failed to create guest account")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Debug info */}
        <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-400">Debug Info:</p>
          <p className="text-sm text-gray-400">User Role: {user?.role || 'Not set'}</p>
          <p className="text-sm text-gray-400">User ID: {user?.id || 'Not set'}</p>
        </div>

        {/* Admin-only Organization Management Card */}
        {user?.role === "admin" && (
          <Card className="mb-8 border border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-purple-400">Admin Controls</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Manage enterprise organizations and their access levels
                  </p>
                  <Button 
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                    onClick={() => router.push('/admin/organizations')}
                  >
                    Organization Management
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <Building2 className="h-16 w-16 text-purple-400/20" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guest Account Management Card */}
        <Card className="mb-8 border border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-400">Guest Account Management</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Create temporary guest accounts with limited access
                </p>
              </div>
              <Dialog open={isCreateGuestOpen} onOpenChange={setIsCreateGuestOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Guest Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Guest Account</DialogTitle>
                    <DialogDescription>
                      Create a temporary guest account. The user will receive login credentials via email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="guestEmail">Email</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                        placeholder="guest@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestName">Name</Label>
                      <Input
                        id="guestName"
                        value={guestDetails.name}
                        onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
                        placeholder="Guest Name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryDays">Account Duration (days)</Label>
                      <Input
                        id="expiryDays"
                        type="number"
                        value={guestDetails.expiryDays}
                        onChange={(e) => setGuestDetails({ ...guestDetails, expiryDays: e.target.value })}
                        min="1"
                        max="30"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleCreateGuest}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Guest Accounts List - You can implement this later */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <p className="text-sm text-gray-400">
                Guest accounts will automatically expire after their set duration. You can manage existing guest accounts from the Users section.
          </p>
        </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-400">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-gray-400">+123 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
              <Briefcase className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-gray-400">+12 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Investment
              </CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.4M</div>
              <p className="text-xs text-gray-400">+$200K from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Growth Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-gray-400">+2.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3h</div>
              <p className="text-xs text-gray-400">-0.2h from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "New Organization Created",
                  details: "Tech Innovators Corp joined the platform",
                  time: "2 hours ago",
                },
                {
                  action: "New Project Added",
                  details: "Global Solutions Ltd added a new investment opportunity",
                  time: "4 hours ago",
                },
                {
                  action: "User Update",
                  details: "15 new users registered in the last 24 hours",
                  time: "1 day ago",
                },
                {
                  action: "Investment Made",
                  details: "Large investment processed for Project X",
                  time: "2 days ago",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0"
                >
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-400">{activity.details}</div>
                  </div>
                  <div className="text-sm text-gray-400">{activity.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


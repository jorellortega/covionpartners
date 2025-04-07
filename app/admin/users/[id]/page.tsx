"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Mail, Calendar, Clock, Shield, Ban, User, Building, CreditCard } from "lucide-react"

// User role badge component
function RoleBadge({ role }: { role: string }) {
  const getRoleStyles = () => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "partner":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "investor":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "viewer":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getRoleStyles()} border`} variant="outline">
      {role}
    </Badge>
  )
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = params.id

  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data
  useEffect(() => {
    // In a real app, this would be an API call to fetch the user
    // Simulating API call with mock data
    setTimeout(() => {
      // Mock user data based on ID
      const mockUser = {
        id: userId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: "Investor",
        status: "Active",
        bio: "Experienced investor with a focus on tech startups and sustainable energy projects. Has invested in over 20 startups in the last 5 years with a portfolio value of $2.5M.",
        joinDate: "2024-01-15",
        lastLogin: "2025-03-28",
        company: "Acme Investments",
        location: "San Francisco, CA",
        investments: [
          { id: "inv-001", project: "Green Energy Solutions", amount: 50000, date: "2024-02-15" },
          { id: "inv-002", project: "Tech Innovators", amount: 75000, date: "2024-03-10" },
        ],
        paymentMethods: [
          { id: "pm-001", type: "Credit Card", last4: "4242", expiry: "05/26" },
          { id: "pm-002", type: "Bank Account", last4: "9876", name: "Chase Business" },
        ],
        activity: [
          { id: "act-001", action: "Logged in", date: "2025-03-28T14:32:00Z" },
          { id: "act-002", action: "Updated profile", date: "2025-03-25T10:15:00Z" },
          { id: "act-003", action: "Made investment", date: "2025-03-20T09:45:00Z" },
          { id: "act-004", action: "Added payment method", date: "2025-03-15T16:20:00Z" },
        ],
      }

      setUser(mockUser)
      setIsLoading(false)
    }, 500)
  }, [userId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/admin/users"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Users
            </Link>
            <h1 className="text-3xl font-bold">User Profile</h1>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800/30 text-white"
              onClick={() => router.push(`/admin/users/edit/${userId}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
            <Button
              variant={user.status === "Active" ? "destructive" : "default"}
              onClick={() => {
                // In a real app, this would be an API call to suspend/activate the user
                alert(`${user.status === "Active" ? "Suspend" : "Activate"} ${user.firstName} ${user.lastName}?`)
              }}
            >
              <Ban className="w-4 h-4 mr-2" />
              {user.status === "Active" ? "Suspend User" : "Activate User"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <Card className="border-gray-800 bg-gray-900/50 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-2xl">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <RoleBadge role={user.role} />
                <Badge
                  variant="outline"
                  className={`mt-2 ${
                    user.status === "Active"
                      ? "bg-green-500/20 text-green-400 border-green-500/50"
                      : "bg-red-500/20 text-red-400 border-red-500/50"
                  } border`}
                >
                  {user.status}
                </Badge>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-800">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p>{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Joined</p>
                    <p>{new Date(user.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Last Login</p>
                    <p>{new Date(user.lastLogin).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Shield className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-400">Role</p>
                    <p>{user.role}</p>
                  </div>
                </div>

                {user.company && (
                  <div className="flex items-start">
                    <Building className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Company</p>
                      <p>{user.company}</p>
                    </div>
                  </div>
                )}

                {user.location && (
                  <div className="flex items-start">
                    <User className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p>{user.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="space-y-2 pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400">Bio</p>
                  <p className="text-sm">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs Card */}
          <Card className="border-gray-800 bg-gray-900/50 lg:col-span-2">
            <CardHeader>
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="investments">Investments</TabsTrigger>
                  <TabsTrigger value="payment">Payment Methods</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="space-y-4">
                  <CardTitle className="text-2xl">Recent Activity</CardTitle>
                  <div className="space-y-4">
                    {user.activity.map((activity: any) => (
                      <div key={activity.id} className="flex items-start border-b border-gray-800 pb-4 last:border-0">
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mr-4">
                          <Clock className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-400">{new Date(activity.date).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="investments" className="space-y-4">
                  <CardTitle className="text-2xl">Investments</CardTitle>
                  {user.investments.length === 0 ? (
                    <p className="text-gray-400">No investments found.</p>
                  ) : (
                    <div className="space-y-4">
                      {user.investments.map((investment: any) => (
                        <div key={investment.id} className="border border-gray-800 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{investment.project}</h3>
                              <p className="text-sm text-gray-400">{new Date(investment.date).toLocaleDateString()}</p>
                            </div>
                            <p className="font-bold">${investment.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="payment" className="space-y-4">
                  <CardTitle className="text-2xl">Payment Methods</CardTitle>
                  {user.paymentMethods.length === 0 ? (
                    <p className="text-gray-400">No payment methods found.</p>
                  ) : (
                    <div className="space-y-4">
                      {user.paymentMethods.map((method: any) => (
                        <div key={method.id} className="border border-gray-800 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mr-4">
                              <CreditCard className="w-6 h-6 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="font-medium">{method.type}</h3>
                              <p className="text-sm text-gray-400">
                                {method.type === "Credit Card"
                                  ? `•••• ${method.last4} (Expires: ${method.expiry})`
                                  : `${method.name} (•••• ${method.last4})`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}


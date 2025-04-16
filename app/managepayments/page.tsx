"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, CreditCard, Wallet, DollarSign, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

// Mock data for payment methods and transactions
const mockPaymentMethods = [
  {
    id: 1,
    type: "Credit Card",
    last4: "4242",
    expiry: "12/24",
    brand: "Visa",
    isDefault: true,
  },
  {
    id: 2,
    type: "Bank Account",
    last4: "1234",
    bankName: "Chase",
    accountType: "Checking",
    isDefault: false,
  },
]

const mockTransactions = [
  {
    id: 1,
    date: "2024-03-15",
    description: "Project Payment - Website Redesign",
    amount: 2500.00,
    status: "completed",
    type: "incoming",
  },
  {
    id: 2,
    date: "2024-03-10",
    description: "Monthly Subscription",
    amount: -49.99,
    status: "completed",
    type: "outgoing",
  },
  {
    id: 3,
    date: "2024-03-05",
    description: "Project Payment - Mobile App",
    amount: 3500.00,
    status: "pending",
    type: "incoming",
  },
]

export default function ManagePaymentsPage() {
  const [activeTab, setActiveTab] = useState("payment-methods")

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Manage Payments</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Payment Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-blue-400" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">$5,950.01</p>
              <p className="text-sm text-gray-400 mt-1">Last updated: Today</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ArrowRight className="w-5 h-5 mr-2 text-green-400" />
                Pending Incoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">$3,500.00</p>
              <p className="text-sm text-gray-400 mt-1">2 pending payments</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-purple-400" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">$6,000.00</p>
              <p className="text-sm text-gray-400 mt-1">March 2024</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="payment-methods" className="data-[state=active]:bg-gray-800">
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-800">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="payout-settings" className="data-[state=active]:bg-gray-800">
              Payout Settings
            </TabsTrigger>
          </TabsList>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Payment Methods</CardTitle>
                  <Button className="gradient-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Button>
                </div>
                <CardDescription>Manage your payment methods for billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-gray-900"
                    >
                      <div className="flex items-center">
                        <CreditCard className="w-8 h-8 text-blue-400 mr-4" />
                        <div>
                          <p className="font-medium text-white">
                            {method.type} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-400">
                            {method.type === "Credit Card"
                              ? `Expires ${method.expiry}`
                              : `${method.bankName} - ${method.accountType}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                        <Button variant="outline" className="border-gray-700">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>View your payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-gray-900"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "incoming"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {transaction.type === "incoming" ? (
                            <ArrowRight className="w-4 h-4" />
                          ) : (
                            <ArrowRight className="w-4 h-4 transform rotate-180" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{transaction.description}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`text-lg font-medium ${
                            transaction.type === "incoming" ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {transaction.type === "incoming" ? "+" : "-"}$
                          {Math.abs(transaction.amount).toFixed(2)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            transaction.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout Settings Tab */}
          <TabsContent value="payout-settings">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
                <CardDescription>Manage how you receive payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Wallet className="w-6 h-6 text-blue-400" />
                          <div>
                            <p className="font-medium text-white">Bank Account (Default)</p>
                            <p className="text-sm text-gray-400">Chase •••• 1234</p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-gray-700">
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payout Schedule</Label>
                    <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">Monthly</p>
                          <p className="text-sm text-gray-400">Payments processed on the 1st</p>
                        </div>
                        <Button variant="outline" className="border-gray-700">
                          Edit Schedule
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tax Information</Label>
                    <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">W-9 Form</p>
                          <p className="text-sm text-gray-400">Last updated: Jan 1, 2024</p>
                        </div>
                        <Button variant="outline" className="border-gray-700">
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 
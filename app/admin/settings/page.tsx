"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Save, Shield, Globe, DollarSign, Bell, Mail, Lock } from "lucide-react"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "COVION STUDIO Partner Portal",
    siteDescription: "Investment opportunities, projects, collaborations, and partnership management",
    contactEmail: "admin@covionstudio.com",
    supportPhone: "+1 (555) 123-4567",
    maintenanceMode: false,
  })

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordExpiry: "90",
    minPasswordLength: "12",
    loginAttempts: "5",
    sessionTimeout: "60",
  })

  // Financial settings state
  const [financialSettings, setFinancialSettings] = useState({
    withdrawalApprovalThreshold: "1000000",
    minWithdrawalAmount: "5000",
    maxWithdrawalAmount: "5000000",
    transactionFee: "0.5",
    paymentMethods: ["bank", "paypal", "card", "crypto"],
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newOpportunityAlerts: true,
    withdrawalNotifications: true,
    marketingEmails: false,
    systemUpdates: true,
  })

  // Handle general settings change
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGeneralSettings((prev) => ({ ...prev, [name]: value }))
  }

  // Handle security settings change
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSecuritySettings((prev) => ({ ...prev, [name]: value }))
  }

  // Handle financial settings change
  const handleFinancialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFinancialSettings((prev) => ({ ...prev, [name]: value }))
  }

  // Handle toggle change
  const handleToggleChange = (setting: string, value: boolean, settingType: string) => {
    if (settingType === "general") {
      setGeneralSettings((prev) => ({ ...prev, [setting]: value }))
    } else if (settingType === "notification") {
      setNotificationSettings((prev) => ({ ...prev, [setting]: value }))
    } else if (settingType === "security") {
      setSecuritySettings((prev) => ({ ...prev, [setting]: value }))
    }
  }

  // Handle payment method toggle
  const handlePaymentMethodToggle = (method: string) => {
    setFinancialSettings((prev) => {
      if (prev.paymentMethods.includes(method)) {
        return { ...prev, paymentMethods: prev.paymentMethods.filter((m) => m !== method) }
      } else {
        return { ...prev, paymentMethods: [...prev.paymentMethods, method] }
      }
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success message (in a real app)
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/admin"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold">System Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="leonardo-tabs">
              <TabsTrigger value="general" className="leonardo-tab">
                <Globe className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="leonardo-tab">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="financial" className="leonardo-tab">
                <DollarSign className="w-4 h-4 mr-2" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="notifications" className="leonardo-tab">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure basic platform settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={generalSettings.siteName}
                      onChange={handleGeneralChange}
                      className="leonardo-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      name="siteDescription"
                      value={generalSettings.siteDescription}
                      onChange={handleGeneralChange}
                      className="leonardo-input min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={generalSettings.contactEmail}
                        onChange={handleGeneralChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supportPhone">Support Phone</Label>
                      <Input
                        id="supportPhone"
                        name="supportPhone"
                        value={generalSettings.supportPhone}
                        onChange={handleGeneralChange}
                        className="leonardo-input"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="maintenanceMode"
                      checked={generalSettings.maintenanceMode}
                      onCheckedChange={(checked) => handleToggleChange("maintenanceMode", checked, "general")}
                    />
                    <Label htmlFor="maintenanceMode">Enable Maintenance Mode</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings Tab */}
            <TabsContent value="security">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure platform security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="twoFactorAuth"
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => handleToggleChange("twoFactorAuth", checked, "security")}
                    />
                    <Label htmlFor="twoFactorAuth">Require Two-Factor Authentication</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                      <Input
                        id="passwordExpiry"
                        name="passwordExpiry"
                        type="number"
                        value={securitySettings.passwordExpiry}
                        onChange={handleSecurityChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                      <Input
                        id="minPasswordLength"
                        name="minPasswordLength"
                        type="number"
                        value={securitySettings.minPasswordLength}
                        onChange={handleSecurityChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        name="loginAttempts"
                        type="number"
                        value={securitySettings.loginAttempts}
                        onChange={handleSecurityChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        name="sessionTimeout"
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={handleSecurityChange}
                        className="leonardo-input"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-blue-400" />
                      Password Requirements
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Minimum length: {securitySettings.minPasswordLength} characters
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        At least one lowercase letter
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        At least one number
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Settings Tab */}
            <TabsContent value="financial">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Financial Settings</CardTitle>
                  <CardDescription className="text-gray-400">Configure payment and financial settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="withdrawalApprovalThreshold">Withdrawal Approval Threshold ($)</Label>
                      <Input
                        id="withdrawalApprovalThreshold"
                        name="withdrawalApprovalThreshold"
                        type="number"
                        value={financialSettings.withdrawalApprovalThreshold}
                        onChange={handleFinancialChange}
                        className="leonardo-input"
                      />
                      <p className="text-xs text-gray-400">Withdrawals above this amount require admin approval</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transactionFee">Transaction Fee (%)</Label>
                      <Input
                        id="transactionFee"
                        name="transactionFee"
                        type="number"
                        step="0.01"
                        value={financialSettings.transactionFee}
                        onChange={handleFinancialChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minWithdrawalAmount">Minimum Withdrawal Amount ($)</Label>
                      <Input
                        id="minWithdrawalAmount"
                        name="minWithdrawalAmount"
                        type="number"
                        value={financialSettings.minWithdrawalAmount}
                        onChange={handleFinancialChange}
                        className="leonardo-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxWithdrawalAmount">Maximum Withdrawal Amount ($)</Label>
                      <Input
                        id="maxWithdrawalAmount"
                        name="maxWithdrawalAmount"
                        type="number"
                        value={financialSettings.maxWithdrawalAmount}
                        onChange={handleFinancialChange}
                        className="leonardo-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Enabled Payment Methods</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="bankTransfer"
                          checked={financialSettings.paymentMethods.includes("bank")}
                          onCheckedChange={(checked) => handlePaymentMethodToggle("bank")}
                        />
                        <Label htmlFor="bankTransfer">Bank Transfer (ACH)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="paypal"
                          checked={financialSettings.paymentMethods.includes("paypal")}
                          onCheckedChange={(checked) => handlePaymentMethodToggle("paypal")}
                        />
                        <Label htmlFor="paypal">PayPal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="card"
                          checked={financialSettings.paymentMethods.includes("card")}
                          onCheckedChange={(checked) => handlePaymentMethodToggle("card")}
                        />
                        <Label htmlFor="card">Credit/Debit Card</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="crypto"
                          checked={financialSettings.paymentMethods.includes("crypto")}
                          onCheckedChange={(checked) => handlePaymentMethodToggle("crypto")}
                        />
                        <Label htmlFor="crypto">Cryptocurrency</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings Tab */}
            <TabsContent value="notifications">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure system and user notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => handleToggleChange("emailNotifications", checked, "notification")}
                      />
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => handleToggleChange("smsNotifications", checked, "notification")}
                      />
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="newOpportunityAlerts"
                        checked={notificationSettings.newOpportunityAlerts}
                        onCheckedChange={(checked) =>
                          handleToggleChange("newOpportunityAlerts", checked, "notification")
                        }
                      />
                      <Label htmlFor="newOpportunityAlerts">New Opportunity Alerts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="withdrawalNotifications"
                        checked={notificationSettings.withdrawalNotifications}
                        onCheckedChange={(checked) =>
                          handleToggleChange("withdrawalNotifications", checked, "notification")
                        }
                      />
                      <Label htmlFor="withdrawalNotifications">Withdrawal Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="marketingEmails"
                        checked={notificationSettings.marketingEmails}
                        onCheckedChange={(checked) => handleToggleChange("marketingEmails", checked, "notification")}
                      />
                      <Label htmlFor="marketingEmails">Marketing Emails</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="systemUpdates"
                        checked={notificationSettings.systemUpdates}
                        onCheckedChange={(checked) => handleToggleChange("systemUpdates", checked, "notification")}
                      />
                      <Label htmlFor="systemUpdates">System Updates</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailTemplate">Email Template</Label>
                    <Select defaultValue="default">
                      <SelectTrigger className="leonardo-input">
                        <SelectValue placeholder="Select email template" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="default">Default Template</SelectItem>
                        <SelectItem value="minimal">Minimal Template</SelectItem>
                        <SelectItem value="branded">Branded Template</SelectItem>
                        <SelectItem value="custom">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-blue-400" />
                      Email Settings
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="senderName">Sender Name</Label>
                      <Input id="senderName" defaultValue="COVION STUDIO" className="leonardo-input" />
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="senderEmail">Sender Email</Label>
                      <Input
                        id="senderEmail"
                        defaultValue="notifications@covionstudio.com"
                        className="leonardo-input"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button type="submit" className="gradient-button" disabled={isSubmitting}>
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { ArrowLeft, Banknote, CreditCard, Settings2, Target } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useProjects } from "@/hooks/useProjects"

export default function FundingSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects()
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState("")
  const [bankInfo, setBankInfo] = useState({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    bankName: "",
  })
  const [fundingSettings, setFundingSettings] = useState({
    minimumDonation: "",
    autoWithdrawal: false,
    withdrawalFrequency: "monthly",
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      if (!selectedProject) {
        throw new Error("Please select a project")
      }
      // TODO: Implement save functionality
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated API call
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access funding settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        {/* Under Development Banner */}
        <div className="absolute left-0 right-0 top-0 z-20 flex justify-center">
          <div className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded-b-lg shadow-lg text-center text-base">
            🚧 This page is under development. Some features may not work yet.
          </div>
        </div>
        {/* Fade Overlay */}
        <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none rounded-lg" />
        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative z-30">
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
              <h1 className="text-2xl font-bold">Funding Settings</h1>
              <p className="text-gray-400">Manage your funding preferences and bank information</p>
            </div>
          </div>
        </div>

        {/* Project Selection Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              <CardTitle>Project Selection</CardTitle>
            </div>
            <CardDescription>Select the project you want to support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <select
                id="project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-800/30 px-3 py-2 text-white"
                disabled={projectsLoading}
              >
                <option value="">Select a project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {projectsLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <LoadingSpinner className="w-4 h-4" />
                  Loading projects...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Details Section - Only shown when a project is selected */}
        {selectedProject && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <CardTitle>Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const project = projects?.find(p => p.id === selectedProject)
                if (!project) return null

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-400">Project Name</Label>
                        <div className="text-white font-medium">{project.name}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-400">Status</Label>
                        <div className="text-white font-medium">{project.status}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-400">Support Goal</Label>
                        <div className="text-white font-medium">
                          ${project.funding_goal?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-400">Current Support</Label>
                        <div className="text-white font-medium">
                          ${project.current_funding?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Description</Label>
                      <div className="text-white">{project.description || 'No description available'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Deadline</Label>
                      <div className="text-white">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric"
                        }) : 'No deadline set'}
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${project.funding_goal && project.current_funding 
                              ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-purple-400 mt-1">
                        {project.funding_goal && project.current_funding 
                          ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                          : 0}% supported
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Bank Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-purple-400" />
              <CardTitle>Bank Information</CardTitle>
            </div>
            <CardDescription>Update your bank account details for receiving funds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  placeholder="Enter bank name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={bankInfo.accountName}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                  placeholder="Enter account name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={bankInfo.accountNumber}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={bankInfo.routingNumber}
                  onChange={(e) => setBankInfo({ ...bankInfo, routingNumber: e.target.value })}
                  placeholder="Enter routing number"
                  type="password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funding Preferences Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-purple-400" />
              <CardTitle>Funding Preferences</CardTitle>
            </div>
            <CardDescription>Configure your funding preferences and withdrawal settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumDonation">Minimum Support Amount</Label>
                <Input
                  id="minimumDonation"
                  value={fundingSettings.minimumDonation}
                  onChange={(e) => setFundingSettings({ ...fundingSettings, minimumDonation: e.target.value })}
                  placeholder="Enter minimum amount"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdrawalFrequency">Withdrawal Frequency</Label>
                <select
                  id="withdrawalFrequency"
                  value={fundingSettings.withdrawalFrequency}
                  onChange={(e) => setFundingSettings({ ...fundingSettings, withdrawalFrequency: e.target.value })}
                  className="w-full rounded-md border border-gray-700 bg-gray-800/30 px-3 py-2 text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoWithdrawal"
                checked={fundingSettings.autoWithdrawal}
                onChange={(e) => setFundingSettings({ ...fundingSettings, autoWithdrawal: e.target.checked })}
                className="rounded border-gray-700 text-purple-400 focus:ring-purple-400"
              />
              <Label htmlFor="autoWithdrawal">Enable Automatic Withdrawals</Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-500 text-white hover:bg-purple-600"
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </main>
    </div>
  )
} 
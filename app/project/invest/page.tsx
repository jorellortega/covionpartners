"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/ui/multiselect"

export default function ProjectInvestSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [settings, setSettings] = useState({
    funding_goal: "10000",
    min_investment: "100",
    max_investment: "5000",
    visibility: "public",
    allow_public: true,
    allow_investors: true,
    investment_start: "",
    investment_end: "",
    payment_methods: [],
    investment_type: "equity",
    pitch: "",
    terms: "",
    auto_approve: false,
    max_investors: "",
    waitlist: false,
    perks: "",
    country_restrictions: [],
    accredited_only: false,
    contact_email: user?.email || "",
    pitch_deck: null,
  })
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchProjects = async () => {
      setLoadingProjects(true)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('owner_id', user.id)
        if (error) throw error
        setProjects(data || [])
      } catch (err) {
        toast.error("Failed to load projects")
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [user])

  const handleSave = () => {
    // Here you would save the settings to the database
    toast.success("Investment settings saved (mock)")
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-2xl mx-auto py-8 px-4">
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle>Project Investment Settings</CardTitle>
            <CardDescription>
              Select a project and configure its investment options. These settings will appear on the public /invest page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="project">Project</Label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                  disabled={loadingProjects}
                >
                  <SelectTrigger id="project" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select your project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="funding_goal">Funding Goal ($)</Label>
                <Input
                  id="funding_goal"
                  type="number"
                  value={settings.funding_goal}
                  onChange={e => setSettings(s => ({ ...s, funding_goal: e.target.value }))}
                  min="0"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="min_investment">Min Investment ($)</Label>
                  <Input
                    id="min_investment"
                    type="number"
                    value={settings.min_investment}
                    onChange={e => setSettings(s => ({ ...s, min_investment: e.target.value }))}
                    min="0"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="max_investment">Max Investment ($)</Label>
                  <Input
                    id="max_investment"
                    type="number"
                    value={settings.max_investment}
                    onChange={e => setSettings(s => ({ ...s, max_investment: e.target.value }))}
                    min="0"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={settings.visibility}
                  onValueChange={val => setSettings(s => ({ ...s, visibility: val }))}
                >
                  <SelectTrigger id="visibility" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="investors">Investors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_public"
                    checked={settings.allow_public}
                    onChange={e => setSettings(s => ({ ...s, allow_public: e.target.checked }))}
                  />
                  <Label htmlFor="allow_public">Allow Public Investments</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_investors"
                    checked={settings.allow_investors}
                    onChange={e => setSettings(s => ({ ...s, allow_investors: e.target.checked }))}
                  />
                  <Label htmlFor="allow_investors">Allow Investor Investments</Label>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="investment_start">Investment Start Date</Label>
                  <Input
                    id="investment_start"
                    type="date"
                    value={settings.investment_start}
                    onChange={e => setSettings(s => ({ ...s, investment_start: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="investment_end">Investment End Date</Label>
                  <Input
                    id="investment_end"
                    type="date"
                    value={settings.investment_end}
                    onChange={e => setSettings(s => ({ ...s, investment_end: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Accepted Payment Methods</Label>
                <MultiSelect
                  options={["Bank Transfer", "Credit Card", "Crypto"]}
                  value={settings.payment_methods}
                  onChange={val => setSettings(s => ({ ...s, payment_methods: val }))}
                  placeholder="Select payment methods"
                />
              </div>
              <div>
                <Label htmlFor="investment_type">Investment Type</Label>
                <Select
                  value={settings.investment_type}
                  onValueChange={val => setSettings(s => ({ ...s, investment_type: val }))}
                >
                  <SelectTrigger id="investment_type" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="debt">Debt</SelectItem>
                    <SelectItem value="revenue_share">Revenue Share</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pitch">Project Pitch/Description</Label>
                <Textarea
                  id="pitch"
                  value={settings.pitch}
                  onChange={e => setSettings(s => ({ ...s, pitch: e.target.value }))}
                  placeholder="Short summary for investors"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="terms">Custom Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={settings.terms}
                  onChange={e => setSettings(s => ({ ...s, terms: e.target.value }))}
                  placeholder="Enter terms or upload a file below"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Input
                  type="file"
                  className="mt-2"
                  onChange={e => setSettings(s => ({ ...s, pitch_deck: e.target.files?.[0] || null }))}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto_approve"
                    checked={settings.auto_approve}
                    onChange={e => setSettings(s => ({ ...s, auto_approve: e.target.checked }))}
                  />
                  <Label htmlFor="auto_approve">Auto-approve Investments</Label>
                </div>
                <div className="flex-1">
                  <Label htmlFor="max_investors">Max Investors</Label>
                  <Input
                    id="max_investors"
                    type="number"
                    value={settings.max_investors}
                    onChange={e => setSettings(s => ({ ...s, max_investors: e.target.value }))}
                    min="0"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="waitlist"
                    checked={settings.waitlist}
                    onChange={e => setSettings(s => ({ ...s, waitlist: e.target.checked }))}
                  />
                  <Label htmlFor="waitlist">Enable Waitlist</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="perks">Investment Perks/Rewards</Label>
                <Textarea
                  id="perks"
                  value={settings.perks}
                  onChange={e => setSettings(s => ({ ...s, perks: e.target.value }))}
                  placeholder="Describe any perks or rewards for investors"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label>Country Restrictions</Label>
                <MultiSelect
                  options={["United States", "Canada", "United Kingdom", "Australia", "Other"]}
                  value={settings.country_restrictions}
                  onChange={val => setSettings(s => ({ ...s, country_restrictions: val }))}
                  placeholder="Select restricted countries"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="accredited_only"
                    checked={settings.accredited_only}
                    onChange={e => setSettings(s => ({ ...s, accredited_only: e.target.checked }))}
                  />
                  <Label htmlFor="accredited_only">Accredited Investors Only</Label>
                </div>
                <div className="flex-1">
                  <Label htmlFor="contact_email">Contact Email for Investors</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={e => setSettings(s => ({ ...s, contact_email: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} className="gradient-button">Save Settings</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 
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
    funding_goal: "",
    min_investment: "",
    max_investment: "",
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
    terms_file_url: null,
  })
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [saving, setSaving] = useState(false)

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

  // Load settings when project is selected
  useEffect(() => {
    if (!selectedProject || !user) return
    
    const loadSettings = async () => {
      setLoadingSettings(true)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            funding_goal,
            min_investment,
            max_investment,
            visibility,
            allow_public_investments,
            allow_investor_investments,
            investment_start,
            investment_end,
            payment_methods,
            investment_type,
            investment_pitch,
            investment_terms,
            auto_approve_investments,
            max_investors,
            enable_waitlist,
            investment_perks,
            country_restrictions,
            accredited_only,
            investment_contact_email
          `)
          .eq('id', selectedProject)
          .eq('owner_id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setSettings({
            funding_goal: data.funding_goal?.toString() || "",
            min_investment: data.min_investment?.toString() || "",
            max_investment: data.max_investment?.toString() || "",
            visibility: data.visibility || "public",
            allow_public: data.allow_public_investments ?? true,
            allow_investors: data.allow_investor_investments ?? true,
            investment_start: data.investment_start ? new Date(data.investment_start).toISOString().split('T')[0] : "",
            investment_end: data.investment_end ? new Date(data.investment_end).toISOString().split('T')[0] : "",
            payment_methods: data.payment_methods || [],
            investment_type: data.investment_type || "equity",
            pitch: data.investment_pitch || "",
            terms: data.investment_terms || "",
            auto_approve: data.auto_approve_investments || false,
            max_investors: data.max_investors?.toString() || "",
            waitlist: data.enable_waitlist || false,
            perks: data.investment_perks || "",
            country_restrictions: data.country_restrictions || [],
            accredited_only: data.accredited_only || false,
            contact_email: data.investment_contact_email || user.email || "",
            pitch_deck: null,
            terms_file_url: data.investment_terms_file_url || null,
          })
        }
      } catch (err) {
        console.error("Error loading settings:", err)
        toast.error("Failed to load project settings")
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
  }, [selectedProject, user])

  const handleSave = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first")
      return
    }

    if (!user) {
      toast.error("You must be logged in to save settings")
      return
    }

    setSaving(true)
    try {
      // Handle file upload for terms file if provided (do this first)
      let termsFileUrl = settings.terms_file_url || null
      if (settings.pitch_deck) {
        try {
          console.log("Uploading terms file:", settings.pitch_deck.name)
          const fileExt = settings.pitch_deck.name.split('.').pop()
          const storageFileName = `investment-terms/${selectedProject}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          
          // Upload file to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('partnerfiles')
            .upload(storageFileName, settings.pitch_deck)
          
          if (uploadError) {
            console.error("File upload error:", uploadError)
            throw new Error(`Failed to upload file: ${uploadError.message}`)
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('partnerfiles')
            .getPublicUrl(storageFileName)
          
          termsFileUrl = publicUrl
          console.log("Terms file uploaded successfully:", publicUrl)
          toast.success("Terms file uploaded successfully")
        } catch (fileError: any) {
          console.error("Error uploading terms file:", fileError)
          toast.error(`Failed to upload terms file: ${fileError.message}`)
          // Continue with saving other settings even if file upload fails
        }
      }

      // Prepare update data (after file upload)
      const updateData: any = {
        funding_goal: settings.funding_goal ? parseFloat(settings.funding_goal) : null,
        min_investment: settings.min_investment ? parseFloat(settings.min_investment) : null,
        max_investment: settings.max_investment ? parseFloat(settings.max_investment) : null,
        visibility: settings.visibility,
        allow_public_investments: settings.allow_public,
        allow_investor_investments: settings.allow_investors,
        investment_start: settings.investment_start || null,
        investment_end: settings.investment_end || null,
        payment_methods: settings.payment_methods || [],
        investment_type: settings.investment_type || "equity",
        investment_pitch: settings.pitch || null,
        investment_terms: settings.terms || null,
        auto_approve_investments: settings.auto_approve,
        max_investors: settings.max_investors ? parseInt(settings.max_investors) : null,
        enable_waitlist: settings.waitlist,
        investment_perks: settings.perks || null,
        country_restrictions: settings.country_restrictions || [],
        accredited_only: settings.accredited_only,
        investment_contact_email: settings.contact_email || null,
        investment_terms_file_url: termsFileUrl,
      }

      console.log("Saving investment settings:", { selectedProject, updateData, userId: user.id })

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', selectedProject)
        .eq('owner_id', user.id)
        .select()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error("No rows were updated. Please check that you are the project owner.")
      }

      console.log("Settings saved successfully:", data[0])
      toast.success("Investment settings saved successfully!")
      
      // Reload settings to confirm they were saved
      const { data: updatedData, error: reloadError } = await supabase
        .from('projects')
        .select(`
          funding_goal,
          min_investment,
          max_investment,
          visibility,
          allow_public_investments,
          allow_investor_investments,
          investment_start,
          investment_end,
          payment_methods,
          investment_type,
          investment_pitch,
          investment_terms,
          auto_approve_investments,
          max_investors,
          enable_waitlist,
            investment_perks,
            country_restrictions,
            accredited_only,
            investment_contact_email,
            investment_terms_file_url
          `)
          .eq('id', selectedProject)
          .single()

      if (!reloadError && updatedData) {
        console.log("Verified saved settings:", updatedData)
        // Update the settings state to reflect the saved file URL
        if (updatedData.investment_terms_file_url) {
          setSettings(prev => ({
            ...prev,
            terms_file_url: updatedData.investment_terms_file_url,
            pitch_deck: null, // Clear the file input after successful upload
          }))
        }
      }
    } catch (err: any) {
      console.error("Error saving settings:", err)
      const errorMessage = err.message || err.details || "Failed to save investment settings"
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
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
                  disabled={loadingProjects || loadingSettings}
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
                {loadingSettings && (
                  <p className="text-sm text-gray-400 mt-2">Loading settings...</p>
                )}
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
                <div className="mt-2 space-y-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={e => setSettings(s => ({ ...s, pitch_deck: e.target.files?.[0] || null }))}
                  />
                  {settings.terms_file_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Current file:</span>
                      <a 
                        href={settings.terms_file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        View terms file
                      </a>
                    </div>
                  )}
                </div>
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
                <Button 
                  onClick={handleSave} 
                  className="gradient-button"
                  disabled={saving || !selectedProject || loadingSettings}
                >
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 
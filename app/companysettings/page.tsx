"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function CompanySettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orgId = searchParams.get("org")
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    location: "",
    custom_link: ""
  })
  const [slug, setSlug] = useState("")

  useEffect(() => {
    if (!orgId) return
    const fetchOrg = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single()
      if (error || !data) {
        toast.error("Organization not found")
        router.push("/")
        return
      }
      setForm({
        name: data.name || "",
        description: data.description || "",
        website: data.website || "",
        industry: data.industry || "",
        location: data.location || "",
        custom_link: data.custom_link || ""
      })
      setLogoUrl(data.logo || "")
      setSlug(data.slug || "")
      setLoading(false)
    }
    fetchOrg()
  }, [orgId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `org-logos/${user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('partnerfiles').getPublicUrl(filePath)
      setLogoUrl(data.publicUrl)
      toast.success('Logo uploaded!')
    } catch (err) {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !orgId) {
      toast.error("Not authorized or missing organization.")
      return
    }
    setSaving(true)
    try {
      // Optionally update slug if name changes
      const newSlug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      const { error } = await supabase
        .from("organizations")
        .update({
          name: form.name,
          description: form.description,
          logo: logoUrl || null,
          website: form.website || null,
          industry: form.industry || null,
          location: form.location || null,
          custom_link: form.custom_link || null,
          slug: newSlug
        })
        .eq("id", orgId)
      if (error) throw error
      toast.success("Organization updated!")
      router.push(`/company/${newSlug}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update organization.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-400">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={saving || uploading} />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} required disabled={saving || uploading} />
              </div>
              <div>
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={saving || uploading}>
                    {uploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo preview" className="w-16 h-16 rounded object-contain border border-gray-700 bg-white" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                  disabled={saving || uploading}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" value={form.website} onChange={handleChange} placeholder="https://..." disabled={saving || uploading} />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Software, Finance" disabled={saving || uploading} />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. New York, NY" disabled={saving || uploading} />
              </div>
              <div>
                <Label htmlFor="custom_link">Custom Link/Handle</Label>
                <Input id="custom_link" name="custom_link" value={form.custom_link} onChange={handleChange} placeholder="Any custom link or handle" disabled={saving || uploading} />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" disabled={saving || uploading}>
                {saving ? "Saving..." : uploading ? "Uploading Logo..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
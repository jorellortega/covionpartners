"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function BuildBusinessPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
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
  const [orgCount, setOrgCount] = useState<number>(0)
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false)

  // Fetch organization count for public users
  useEffect(() => {
    if (!user || user.role !== 'public') return
    async function fetchOrgCount() {
      if (!user) return;
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
      if (!error && data) {
        setOrgCount(data.length)
      }
    }
    fetchOrgCount()
  }, [user])

  const reachedPublicLimit = user?.role === 'public' && orgCount >= 1

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
    if (!user) {
      toast.error("Please log in to create an organization.")
      router.push("/login")
      return
    }
    setLoading(true)
    try {
      // Generate slug from name
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: form.name,
          description: form.description,
          logo: logoUrl || null,
          website: form.website || null,
          industry: form.industry || null,
          location: form.location || null,
          custom_link: form.custom_link || null,
          owner_id: user.id,
          slug
        })
        .select()
        .single()
      if (error) throw error
      toast.success("Organization created!")
      router.push(`/company/${slug}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={loading || uploading} />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} required disabled={loading || uploading} />
              </div>
              <div>
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading || uploading}>
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
                  disabled={loading || uploading}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" value={form.website} onChange={handleChange} placeholder="https://..." disabled={loading || uploading} />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Software, Finance" disabled={loading || uploading} />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. New York, NY" disabled={loading || uploading} />
              </div>
              <div>
                <Label htmlFor="custom_link">Custom Link/Handle</Label>
                <Input id="custom_link" name="custom_link" value={form.custom_link} onChange={handleChange} placeholder="Any custom link or handle" disabled={loading || uploading} />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" disabled={loading || uploading || reachedPublicLimit}>
                {loading ? "Creating..." : uploading ? "Uploading Logo..." : "Create Organization"}
              </Button>
              {reachedPublicLimit && (
                <>
                  <button
                    type="button"
                    className="text-xs text-red-400 ml-2 align-middle font-semibold hover:underline focus:underline focus:outline-none"
                    onClick={() => setIsLimitDialogOpen(true)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Limit reached
                  </button>
                  <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Organization Creation Limit</DialogTitle>
                        <DialogDescription>
                          You have reached the maximum of 1 organization for public users.<br />
                          To create more organizations, please upgrade your account.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-4 mt-6">
                        <Button
                          variant="outline"
                          className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                          onClick={() => setIsLimitDialogOpen(false)}
                        >
                          Close
                        </Button>
                        <Button
                          className="gradient-button hover:bg-purple-700"
                          onClick={() => {
                            setIsLimitDialogOpen(false)
                            router.push('/account-types')
                          }}
                        >
                          Upgrade Account
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
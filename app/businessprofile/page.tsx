"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function BusinessProfilePage() {
  const [name, setName] = useState("Covion Studio (Mock)")
  const [desc, setDesc] = useState("A creative agency for digital solutions.")
  const [email, setEmail] = useState("info@covionstudio.com")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      router.push("/business/123")
    }, 1000)
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create or Edit Business Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Business Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={desc} onChange={e => setDesc(e.target.value)} required />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save & View Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
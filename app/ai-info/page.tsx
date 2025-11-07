"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Sparkles, Shield, Plus, Trash2, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { AISetting } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface PromptSection {
  id: string
  title: string
  content: string
}

const DEFAULT_SECTIONS: PromptSection[] = [
  { id: "role", title: "Role", content: "" },
  { id: "tone", title: "Tone", content: "" },
  { id: "knowledge", title: "Knowledge", content: "" },
  { id: "constraints", title: "Constraints", content: "" }
]

function parsePromptIntoSections(prompt: string | null | undefined): PromptSection[] {
  if (!prompt) {
    return DEFAULT_SECTIONS
  }

  const matches = prompt.split(/(?=^### )/m).map((chunk) => chunk.trim()).filter(Boolean)

  if (!matches.length) {
    const trimmed = prompt.trim()
    return DEFAULT_SECTIONS.map((section, index) => ({
      ...section,
      content: index === 0 ? trimmed : ""
    }))
  }

  return matches.map((chunk, index) => {
    const lines = chunk.split("\n")
    const heading = lines[0].replace(/^###\s*/, "").trim() || `Section ${index + 1}`
    const content = lines.slice(1).join("\n").trim()

    return {
      id: `${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
      title: heading,
      content
    }
  })
}

function combineSectionsIntoPrompt(sections: PromptSection[]): string {
  return sections
    .map((section) => {
      const title = section.title.trim() || "Section"
      const content = section.content.trim()
      return `### ${title}\n${content}`.trim()
    })
    .join("\n\n")
}

export default function AIInfoPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [sections, setSections] = useState<PromptSection[]>(DEFAULT_SECTIONS)
  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== "ceo")) {
      toast.error("CEO access required.")
      router.push("/dashboard")
    }
  }, [loading, user, router])

  useEffect(() => {
    const loadPrompt = async () => {
      if (!user || user.role !== "ceo") return
      setIsFetching(true)
      const { data, error } = await supabase
        .from("ai_settings")
        .select("setting_key, setting_value")
        .eq("setting_key", "system_prompt")
        .maybeSingle()

      if (error) {
        console.error("Failed to load system prompt:", error)
        toast.error("Unable to load system prompt")
        setSections(DEFAULT_SECTIONS)
      } else {
        setSections(parsePromptIntoSections((data as AISetting | null)?.setting_value))
      }

      setIsFetching(false)
    }

    loadPrompt()
  }, [supabase, user])

  const updateSectionTitle = (id: string, title: string) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, title } : section)))
  }

  const updateSectionContent = (id: string, content: string) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, content } : section)))
  }

  const addSection = () => {
    const id = `section-${crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`
    setSections((prev) => [...prev, { id, title: "New Section", content: "" }])
  }

  const removeSection = (id: string) => {
    setSections((prev) => (prev.length > 1 ? prev.filter((section) => section.id !== id) : prev))
  }

  const handleSave = async () => {
    if (!user || user.role !== "ceo") return
    setIsSaving(true)
    const fullPrompt = combineSectionsIntoPrompt(sections)

    const { error } = await supabase
      .from("ai_settings")
      .upsert({
        setting_key: "system_prompt",
        setting_value: fullPrompt,
        description: "The system prompt that defines how Covion Intelligence behaves.",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "setting_key"
      })

    if (error) {
      console.error("Failed to save system prompt:", error)
      toast.error("Failed to save prompt")
    } else {
      toast.success("Prompt updated")
    }

    setIsSaving(false)
  }

  const handleEnhance = async () => {
    if (isEnhancing) return
    setIsEnhancing(true)

    try {
      const fullPrompt = combineSectionsIntoPrompt(sections)
      const response = await fetch("/api/generate-ai-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Enhancement failed")
      }

      const data = await response.json()
      setSections(parsePromptIntoSections(data.prompt))
      toast.success("Prompt enhanced")
    } catch (error: any) {
      console.error("Prompt enhancement error:", error)
      toast.error(error?.message || "Failed to enhance prompt")
    } finally {
      setIsEnhancing(false)
    }
  }

  if (loading || !user || user.role !== "ceo") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking access…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Covion Intelligence Prompt</h1>
            <p className="text-gray-400">Structure how the assistant thinks, what it knows, and where it draws the line.</p>
          </div>
        </header>

        <Card className="border border-gray-800 bg-gray-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" /> Prompt Sections
            </CardTitle>
            <CardDescription className="text-gray-400">
              Edit each block to refine Covion Intelligence. Add sections to cover responsibilities, escalation paths, or compliance guardrails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isFetching ? (
              <div className="flex items-center gap-3 text-gray-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading prompt…</span>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={section.id} className="rounded-xl border border-gray-800 bg-gray-950/40 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Input
                        value={section.title}
                        onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                        placeholder={`Section ${index + 1} title`}
                        className="bg-gray-900 border-gray-800 text-white"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(section.id)}
                        className="text-gray-500 hover:text-red-400"
                        disabled={sections.length === 1}
                        aria-label="Remove section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={section.content}
                      onChange={(event) => updateSectionContent(section.id, event.target.value)}
                      placeholder="Describe guidance, guardrails, examples, or references."
                      rows={6}
                      className="bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="border-dashed border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"
                  onClick={addSection}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Section
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="border border-purple-500/40 text-purple-200 hover:bg-purple-500/20"
            onClick={handleEnhance}
            disabled={isFetching || isSaving || isEnhancing}
          >
            {isEnhancing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Enhance with AI
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
            onClick={handleSave}
            disabled={isFetching || isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Prompt
          </Button>
        </div>
      </div>
    </div>
  )
}

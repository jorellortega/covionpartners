"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Eye, EyeOff, Key, Loader2, RefreshCcw, Save, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { AISetting } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const MASKED_KEYS = ["api_key", "token", "secret"]

function isSensitiveKey(key: string) {
  return MASKED_KEYS.some((needle) => key.toLowerCase().includes(needle))
}

const OPENAI_MODELS = [
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4o",
  "gpt-4o-2024-05-13",
  "gpt-4.1-mini",
  "gpt-4.1",
  "gpt-3.5-turbo"
]


export default function AISettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClientComponentClient(), [])
  const [settings, setSettings] = useState<AISetting[]>([])
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [maskState, setMaskState] = useState<Record<string, boolean>>({})
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setHasSession(!!data.session)
      if (!data.session) {
        router.push("/login")
      }
    }

    checkSession()
  }, [supabase, router])

  useEffect(() => {
    if (hasSession === false) {
      return
    }

    const normalizedRole = user?.role?.toLowerCase()
    console.log('[AI Settings] Guard check', { loading, hasUser: !!user, role: user?.role, normalizedRole, hasSession })

    if (loading || hasSession === null) {
      return
    }

    if (!user) {
      return
    }

    if (normalizedRole !== "ceo") {
      toast.error("CEO access required.")
      router.push("/dashboard")
    }
  }, [loading, user, router, hasSession])

  useEffect(() => {
    const loadSettings = async () => {
      if (!user || user.role !== "ceo") return
      setIsLoadingSettings(true)
      const { data, error } = await supabase
        .from("ai_settings")
        .select("setting_key, setting_value, description, updated_at")
        .order("setting_key", { ascending: true })

      if (error) {
        console.error("Failed to load AI settings:", error)
        toast.error("Unable to load AI settings")
        setSettings([])
      } else {
        setSettings(data as AISetting[])
        const initialMask: Record<string, boolean> = {}
        for (const row of data as AISetting[]) {
          initialMask[row.setting_key] = isSensitiveKey(row.setting_key)
        }
        setMaskState(initialMask)
      }

      setIsLoadingSettings(false)
    }

    loadSettings()
  }, [supabase, user])

  const toggleMask = (key: string) => {
    setMaskState((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const updateValue = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.setting_key === key ? { ...setting, setting_value: value } : setting
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from("ai_settings")
          .update({
            setting_value: setting.setting_value,
            updated_at: new Date().toISOString()
          })
          .eq("setting_key", setting.setting_key)

        if (error) {
          throw new Error(`Failed to update ${setting.setting_key}`)
        }
      }

      toast.success("AI settings updated")
    } catch (error: any) {
      console.error("Failed to save AI settings:", error)
      toast.error(error?.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    if (!user || user.role !== "ceo") return
    setIsLoadingSettings(true)
    const { data, error } = await supabase
      .from("ai_settings")
      .select("setting_key, setting_value, description, updated_at")
      .order("setting_key", { ascending: true })

    if (error) {
      console.error("Failed to refresh AI settings:", error)
      toast.error("Unable to refresh settings")
    } else {
      setSettings(data as AISetting[])
    }

    setIsLoadingSettings(false)
  }

  const normalizedRole = user?.role?.toLowerCase()

  if (hasSession === null || loading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking access…</span>
        </div>
      </div>
    )
  }

  if (hasSession === false) {
    return null
  }

  if (normalizedRole !== "ceo") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-300">This page is restricted to CEO accounts.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Provider Settings</h1>
            <p className="text-gray-400">Manage API keys, models, and behavior controls for Covion Intelligence.</p>
          </div>
        </header>

        <Card className="border border-gray-800 bg-gray-900/60">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-cyan-400" /> AI Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Rotate API keys, update model targets, or adjust prompt controls used by the chat assistant.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white" onClick={handleRefresh} disabled={isLoadingSettings || isSaving}>
                {isLoadingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                Refresh
              </Button>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400" onClick={handleSave} disabled={isLoadingSettings || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save changes
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoadingSettings ? (
              <div className="flex items-center gap-3 text-gray-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading settings…</span>
              </div>
            ) : settings.length === 0 ? (
              <p className="text-gray-400">No AI settings found. Run the Supabase migration to create defaults.</p>
            ) : (
              settings.map((setting) => {
                const isSensitive = isSensitiveKey(setting.setting_key)
                const masked = isSensitive ? maskState[setting.setting_key] : false
                const useTextarea = !isSensitive && (setting.setting_value?.length || 0) > 120

                return (
                  <div key={setting.setting_key} className="rounded-xl border border-gray-800 bg-gray-950/40 p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white uppercase tracking-wide">{setting.setting_key}</p>
                        {setting.description && (
                          <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
                        )}
                      </div>
                      {isSensitive && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray-300 hover:text-white"
                          onClick={() => toggleMask(setting.setting_key)}
                        >
                          {masked ? (
                            <><Eye className="h-4 w-4 mr-1" /> Show</>
                          ) : (
                            <><EyeOff className="h-4 w-4 mr-1" /> Hide</>
                          )}
                        </Button>
                      )}
                    </div>
                    {setting.setting_key === "openai_model" ? (
                      <Select
                        value={setting.setting_value || ""}
                        onValueChange={(value) => updateValue(setting.setting_key, value)}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-800 text-gray-100">
                          <SelectValue placeholder="Select an OpenAI model" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border border-gray-800 text-gray-100">
                          {OPENAI_MODELS.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : useTextarea ? (
                      <Textarea
                        value={setting.setting_value || ""}
                        onChange={(event) => updateValue(setting.setting_key, event.target.value)}
                        rows={5}
                        className="bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500"
                      />
                    ) : (
                      <Input
                        type={masked ? "password" : "text"}
                        value={setting.setting_value || ""}
                        onChange={(event) => updateValue(setting.setting_key, event.target.value)}
                        className="bg-gray-900 border-gray-800 text-gray-100 placeholder:text-gray-500"
                        autoComplete={isSensitive ? "new-password" : "off"}
                        spellCheck={false}
                      />
                    )}
                    {setting.updated_at && (
                      <p className="text-xs text-gray-500">Last updated {new Date(setting.updated_at).toLocaleString()}</p>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

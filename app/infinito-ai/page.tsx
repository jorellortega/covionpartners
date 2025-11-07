"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Bot, Send } from "lucide-react"
import { Infinity } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { AIMessage } from "@/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

function escapeHtml(content: string) {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function formatLinks(content: string) {
  const escaped = escapeHtml(content)
  const withLinks = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">$1</a>')
  return withLinks.replace(/\n/g, "<br />")
}

const INITIAL_ASSISTANT_MESSAGE: AIMessage = {
  role: "assistant",
  content: "Hi! I\'m Covion Intelligence. Ask me about your projects, partners, and funding workflows, and I\'ll steer you toward the right tools.",
  timestamp: new Date().toISOString()
}

export default function InfinitoAIPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<AIMessage[]>([INITIAL_ASSISTANT_MESSAGE])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null)
  const supabase = useMemo(() => createClientComponentClient(), [])
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
    if (!loading && hasSession && !user) {
      router.push("/login")
    }
  }, [loading, user, router, hasSession])

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const messageContent = input.trim()
    setInput("")
    setError(null)

    const history = [...messages]
    const userMessage: AIMessage = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString()
    }

    setMessages([...history, userMessage])
    setIsSending(true)

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: history
        })
      })

      if (!response.ok) {
        const { error: apiError } = await response.json()
        throw new Error(apiError || "Failed to reach Covion Intelligence")
      }

      const data = await response.json()
      const assistantMessage: AIMessage = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString()
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      setError(err?.message || "Sorry, something went wrong.")
      setMessages((prev) => prev.slice(0, prev.length - 1))
    } finally {
      setIsSending(false)
    }
  }

  if (hasSession === null || loading || (hasSession && !user)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (!hasSession) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="flex flex-col gap-4 text-center mb-10">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Infinity className="w-7 h-7 text-white" />
          </div>
          <div>
            <a
              href="https://www.infinitoagi.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xl font-bold text-white inline-flex items-center justify-center gap-2 hover:text-cyan-300 transition-colors"
            >
              Infinito AI
              <span className="text-cyan-300">∞</span>
            </a>
            <p className="text-gray-400 mt-2">Chat with the Infinito AI assistant about deals, partners, projects, and funding tasks.</p>
          </div>
        </header>

        <Card className="bg-gray-900/60 border border-gray-800">
          <CardContent className="p-0">
            <div className="h-[540px] overflow-y-auto p-6 space-y-6">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}-${message.timestamp}`} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border ${
                      message.role === "assistant"
                        ? "bg-gray-800/80 border-gray-700 text-gray-100"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent text-white"
                    }`}
                  >
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatLinks(message.content) }}
                    />
                    {message.timestamp && (
                      <p className={`mt-2 text-xs ${message.role === "assistant" ? "text-gray-400" : "text-cyan-100/80"}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 border bg-gray-800/60 border-gray-700 text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.2s]"></span>
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce"></span>
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="text-sm">Infinito AI is thinking…</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            <div className="border-t border-gray-800 bg-gray-900/80 p-6 space-y-4">
              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about a project, funding route, or workflow..."
                  rows={3}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      handleSend()
                    }
                  }}
                  className="bg-gray-900 border border-gray-800 text-gray-100 placeholder:text-gray-500 focus-visible:ring-cyan-500"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSend}
                    disabled={isSending || input.trim().length === 0}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                  >
                    {isSending ? (
                      <span className="h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isSending ? "Thinking" : "Send"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

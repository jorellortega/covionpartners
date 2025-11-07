import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AIMessage, AISettingsMap } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for AI chat route.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1000

type ChatBody = {
  message: string
  conversationHistory?: AIMessage[]
}

const allowedRoles: AIMessage['role'][] = ['system', 'user', 'assistant']

function sanitizeHistory(history: unknown): AIMessage[] {
  if (!Array.isArray(history)) return []

  return history
    .map((entry): AIMessage | null => {
      if (!entry || typeof entry !== 'object') return null
      const role = (entry as AIMessage).role
      const content = (entry as AIMessage).content

      if (!allowedRoles.includes(role) || typeof content !== 'string') {
        return null
      }

      return {
        role,
        content: content.trim(),
        timestamp: (entry as AIMessage).timestamp
      }
    })
    .filter(Boolean) as AIMessage[]
}

function mapSettings(data: { setting_key: string; setting_value: string }[] | null): AISettingsMap {
  const map: AISettingsMap = {}
  if (!data) return map
  for (const setting of data) {
    map[setting.setting_key] = setting.setting_value ?? ''
  }
  return map
}

async function callOpenAI(messages: AIMessage[], settings: AISettingsMap) {
  const openaiKey = settings['openai_api_key']?.trim()
  const openaiModel = settings['openai_model']?.trim() || DEFAULT_OPENAI_MODEL

  if (!openaiKey) {
    return null
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: openaiModel,
      messages,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI API error:', response.status, errorText)
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const aiMessage = data?.choices?.[0]?.message?.content?.trim()

  if (!aiMessage) {
    throw new Error('OpenAI returned an empty response')
  }

  return {
    provider: 'openai' as const,
    message: aiMessage,
    usage: data?.usage ?? null
  }
}

async function callAnthropic(messages: AIMessage[], settings: AISettingsMap, systemPrompt?: string) {
  const anthropicKey = settings['anthropic_api_key']?.trim()
  const anthropicModel = settings['anthropic_model']?.trim() || DEFAULT_ANTHROPIC_MODEL

  if (!anthropicKey) {
    return null
  }

  const anthropicMessages = messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: [
        {
          type: 'text',
          text: msg.content
        }
      ]
    }))

  const body = {
    model: anthropicModel,
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    system: systemPrompt && systemPrompt.length > 0 ? systemPrompt : undefined,
    messages: anthropicMessages
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic API error:', response.status, errorText)
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const segments = Array.isArray(data?.content)
    ? data.content
        .filter((segment: any) => segment?.type === 'text' && typeof segment.text === 'string')
        .map((segment: any) => segment.text.trim())
    : []

  if (!segments.length) {
    throw new Error('Anthropic returned an empty response')
  }

  return {
    provider: 'anthropic' as const,
    message: segments.join('\n\n'),
    usage: data?.usage ?? null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatBody

    if (!body?.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const conversationHistory = sanitizeHistory(body.conversationHistory)

    const { data: settingsData, error: settingsError } = await supabase.rpc('get_ai_settings')

    if (settingsError) {
      console.error('Failed to load AI settings:', settingsError)
      return NextResponse.json({ error: 'Unable to load AI settings' }, { status: 500 })
    }

    const settings = mapSettings(settingsData)
    console.log('AI chat settings loaded', Object.keys(settings))
    const systemPrompt = settings['system_prompt']?.trim()

    const messages: AIMessage[] = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push(...conversationHistory)
    messages.push({ role: 'user', content: body.message.trim() })

    let responsePayload = await callOpenAI(messages, settings)

    if (!responsePayload) {
      console.log('OpenAI not configured, falling back to Anthropic')
      responsePayload = await callAnthropic(messages, settings, systemPrompt)
    }

    if (!responsePayload) {
      console.error('AI chat route: no providers configured or both failed')
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })
    }

    console.log('AI chat provider response', responsePayload.provider)

    return NextResponse.json({
      message: responsePayload.message.replace(/\*\*(.*?)\*\*/g, '$1'),
      usage: responsePayload.usage,
      provider: responsePayload.provider
    })
  } catch (error: any) {
    console.error('AI chat route error:', error)
    return NextResponse.json({
      error: 'Failed to generate AI response',
      details: error?.message ?? 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for enhance-comment route.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const DEFAULT_MAX_TOKENS = 1000
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022'

type AISettingsMap = Record<string, string>

function mapSettings(data: { setting_key: string; setting_value: string }[] | null): AISettingsMap {
  const map: AISettingsMap = {}
  data?.forEach((setting) => {
    map[setting.setting_key] = setting.setting_value ?? ''
  })
  return map
}

async function callOpenAI(message: string, settings: AISettingsMap) {
  const openaiKey = settings['openai_api_key']?.trim()
  const openaiModel = settings['openai_model']?.trim() || DEFAULT_OPENAI_MODEL

  if (!openaiKey) {
    return null
  }

  const enhancementPrompt = `You are helping to enhance a project comment for Covion Partners, a business and investment platform. The comment should be professional, clear, and constructive.

Original comment:
---
${message}
---

Please enhance this comment to:
1. Improve clarity and professionalism
2. Make it more constructive and actionable
3. Maintain the original intent and tone
4. Keep it concise and relevant to project collaboration

Return only the enhanced comment, without any additional explanation or formatting.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: openaiModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at enhancing professional communication for business collaboration platforms. You help improve clarity, tone, and professionalism while preserving the original intent.'
        },
        {
          role: 'user',
          content: enhancementPrompt
        }
      ],
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI comment enhancement error:', errorText)
    throw new Error('OpenAI comment enhancement failed')
  }

  const data = await response.json()
  const enhancedMessage = data?.choices?.[0]?.message?.content?.trim()

  if (!enhancedMessage) {
    throw new Error('OpenAI returned an empty comment enhancement response')
  }

  return {
    provider: 'openai' as const,
    message: enhancedMessage,
    usage: data?.usage ?? null
  }
}

async function callAnthropic(message: string, settings: AISettingsMap) {
  const anthropicKey = settings['anthropic_api_key']?.trim()
  const anthropicModel = settings['anthropic_model']?.trim() || DEFAULT_ANTHROPIC_MODEL

  if (!anthropicKey) {
    return null
  }

  const enhancementPrompt = `You are helping to enhance a project comment for Covion Partners, a business and investment platform. The comment should be professional, clear, and constructive.

Original comment:
---
${message}
---

Please enhance this comment to:
1. Improve clarity and professionalism
2. Make it more constructive and actionable
3. Maintain the original intent and tone
4. Keep it concise and relevant to project collaboration

Return only the enhanced comment, without any additional explanation or formatting.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: anthropicModel,
      max_tokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
      system: 'You are an expert at enhancing professional communication for business collaboration platforms. You help improve clarity, tone, and professionalism while preserving the original intent.',
      messages: [
        {
          role: 'user',
          content: enhancementPrompt
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic comment enhancement error:', response.status, errorText)
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const segments = Array.isArray(data?.content)
    ? data.content
        .filter((segment: any) => segment?.type === 'text' && typeof segment.text === 'string')
        .map((segment: any) => segment.text.trim())
    : []

  if (!segments.length) {
    throw new Error('Anthropic returned an empty comment enhancement response')
  }

  return {
    provider: 'anthropic' as const,
    message: segments.join(' '),
    usage: data?.usage ?? null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = body?.message?.trim()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const { data: settingsData, error: settingsError } = await supabase.rpc('get_ai_settings')

    if (settingsError) {
      console.error('Failed to load AI settings:', settingsError)
      return NextResponse.json({ error: 'Unable to load AI settings' }, { status: 500 })
    }

    const settings = mapSettings(settingsData)
    console.log('AI comment enhancement settings loaded', Object.keys(settings))

    let responsePayload = await callOpenAI(message, settings)

    if (!responsePayload) {
      console.log('OpenAI not configured, falling back to Anthropic')
      responsePayload = await callAnthropic(message, settings)
    }

    if (!responsePayload) {
      console.error('Comment enhancement: no providers configured or both failed')
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })
    }

    console.log('Comment enhancement provider response', responsePayload.provider)

    return NextResponse.json({
      message: responsePayload.message.replace(/\*\*(.*?)\*\*/g, '$1'),
      usage: responsePayload.usage,
      provider: responsePayload.provider
    })
  } catch (error: any) {
    console.error('Comment enhancement route error:', error)
    return NextResponse.json(
      {
        error: 'Failed to enhance comment',
        details: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    )
  }
}


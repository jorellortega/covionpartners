import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AISettingsMap } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for AI prompt generation route.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 2000

function mapSettings(data: { setting_key: string; setting_value: string }[] | null): AISettingsMap {
  const map: AISettingsMap = {}
  if (!data) return map
  for (const setting of data) {
    map[setting.setting_key] = setting.setting_value ?? ''
  }
  return map
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string }
    const currentPrompt = body?.prompt?.trim()

    if (!currentPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const { data: settingsData, error: settingsError } = await supabase.rpc('get_ai_settings')

    if (settingsError) {
      console.error('Failed to load AI settings:', settingsError)
      return NextResponse.json({ error: 'Unable to load AI settings' }, { status: 500 })
    }

    const settings = mapSettings(settingsData)
    const openaiKey = settings['openai_api_key']?.trim()
    const openaiModel = settings['openai_model']?.trim() || DEFAULT_OPENAI_MODEL

    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI provider is not configured' }, { status: 503 })
    }

    const enhancementPrompt = `You are helping to enhance a system prompt for the Covion Intelligence assistant used by Covion Partners.\n\nCurrent prompt:\n---\n${currentPrompt}\n---\n\nPlease rewrite or extend this prompt to improve clarity, coverage of responsibilities, risk guardrails, and tone. Preserve any existing Markdown headings where it makes sense, and return only the improved prompt.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: openaiModel,
        messages: [
          { role: 'system', content: 'You are an expert at drafting comprehensive, actionable system prompts for AI assistants that operate in business and investment contexts. Maintain structure, clarity, and explicit guardrails.' },
          { role: 'user', content: enhancementPrompt }
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI prompt enhancement error:', errorText)
      throw new Error('OpenAI prompt enhancement failed')
    }

    const data = await response.json()
    const improvedPrompt = data?.choices?.[0]?.message?.content?.trim()

    if (!improvedPrompt) {
      throw new Error('OpenAI returned an empty prompt enhancement response')
    }

    return NextResponse.json({ prompt: improvedPrompt })
  } catch (error: any) {
    console.error('Prompt enhancement route error:', error)
    return NextResponse.json({
      error: 'Failed to enhance prompt',
      details: error?.message ?? 'Unknown error'
    }, { status: 500 })
  }
}

CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow CEO to view ai_settings"
  ON public.ai_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'ceo'
    )
  );

CREATE POLICY "Allow CEO to manage ai_settings"
  ON public.ai_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'ceo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'ceo'
    )
  );

CREATE TRIGGER set_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.get_ai_settings()
RETURNS TABLE(setting_key TEXT, setting_value TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.setting_key, s.setting_value
  FROM public.ai_settings AS s
  WHERE s.setting_key IN (
    'openai_api_key',
    'openai_model',
    'anthropic_api_key',
    'anthropic_model',
    'system_prompt'
  );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_ai_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_settings() TO service_role;

INSERT INTO public.ai_settings (setting_key, setting_value, description)
VALUES
  ('openai_api_key', '', 'OpenAI API key used for the Covion AI assistant.'),
  ('openai_model', 'gpt-4o-mini', 'Default OpenAI model for the Covion AI assistant.'),
  ('anthropic_api_key', '', 'Anthropic API key for optional fallback use.'),
  ('anthropic_model', 'claude-3-5-sonnet-20241022', 'Default Anthropic model when configured.'),
  ('system_prompt',
    $$### Role
You are Covion Intelligence, the AI assistant for Covion Partners. Guide founders, partners, and investors through the platform with proactive, partnership-first support.

### Tone
Stay concise, confident, and optimistic. Mirror the user's urgency and clarify when additional context is required.

### Knowledge
Focus on Covion products, deal flow, project operations, funding tools, and partner enablement. Reference only verified data.

### Constraints
Never fabricate access to private data or make financial guarantees. Flag ambiguous questions and propose next steps.$$,
    'The system prompt that defines how Covion Intelligence behaves.')
ON CONFLICT (setting_key) DO NOTHING;

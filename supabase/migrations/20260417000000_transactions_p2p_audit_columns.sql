-- P2P send-payment audit: match app/api/payments/create inserts
-- Apply in Supabase SQL editor if migrations are not auto-deployed.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

CREATE INDEX IF NOT EXISTS idx_transactions_recipient_id ON public.transactions (recipient_id);

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON public.transactions (stripe_payment_intent_id);

COMMENT ON COLUMN public.transactions.recipient_id IS 'P2P payment counterparty (receiver user id). user_id is the payer.';

COMMENT ON COLUMN public.transactions.stripe_payment_intent_id IS 'Stripe PaymentIntent id when charge succeeded.';

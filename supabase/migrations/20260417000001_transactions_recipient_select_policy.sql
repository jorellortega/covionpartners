-- Partners can read transaction rows where they are the payee (profit share, P2P, etc.)
DROP POLICY IF EXISTS "Users can view transactions where they are recipient" ON public.transactions;

CREATE POLICY "Users can view transactions where they are recipient"
  ON public.transactions
  FOR SELECT
  USING (recipient_id IS NOT NULL AND auth.uid() = recipient_id);

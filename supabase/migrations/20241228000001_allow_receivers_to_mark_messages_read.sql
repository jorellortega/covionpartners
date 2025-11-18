-- Allow receivers to update the read status of messages they received
-- This policy allows receivers to mark messages as read
-- Drop the policy if it exists first to avoid conflicts
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON messages;

CREATE POLICY "Receivers can mark messages as read"
    ON messages FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);


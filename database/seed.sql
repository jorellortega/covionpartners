-- Seed for cvnpartners_user_balances
INSERT INTO cvnpartners_user_balances (
  user_id, balance, currency, pending_balance, locked_balance, status, last_updated
) VALUES (
  'c81c3d21-d383-44b2-96b5-a475f82114ef', 10000.00, 'USD', 0, 0, 'active', CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  currency = EXCLUDED.currency,
  pending_balance = EXCLUDED.pending_balance,
  locked_balance = EXCLUDED.locked_balance,
  status = EXCLUDED.status,
  last_updated = EXCLUDED.last_updated; 
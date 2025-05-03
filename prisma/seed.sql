-- First, ensure the user exists
INSERT INTO users (id, email, full_name) 
VALUES ('e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'user@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- Then ensure the project exists
INSERT INTO projects (id, name) 
VALUES ('a59d30e1-3fe1-485f-96c3-a0c82e1fb4db', 'Test Project')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (id, amount, type, status, user_id, project_id, created_at)
VALUES
  -- Project Payments (Completed)
  ('d6a3f1b0-2e1a-4b7f-9d8c-3f5e7a9b2c1d', 350000.00, 'deposit', 'completed', 
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db', 
   NOW() - INTERVAL '1 day'),
   
  ('f8c2e4d6-7a9b-4c5f-8e3d-2b1a9c7f6e4d', 250000.00, 'deposit', 'completed',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '2 days'),

  -- Monthly Subscription (Outgoing)
  ('a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a', 49999.99, 'withdrawal', 'completed',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', NULL,
   NOW() - INTERVAL '3 days'),

  -- Pending Project Payment
  ('b2c3d4e5-f6a7-4b5c-8d9e-4f3e2d1c0b9a', 325000.00, 'deposit', 'pending',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '12 hours'),

  -- Investment Transaction
  ('c3d4e5f6-a7b8-4c5d-9e0f-5e4d3c2b1a0f', 15000.00, 'investment', 'completed',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '4 days'),

  -- Processing Payment
  ('d4e5f6a7-b8c9-4d5e-0f1a-6e5d4c3b2a1e', 175000.00, 'deposit', 'pending',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '6 hours'),

  -- Failed Payment
  ('e5f6a7b8-c9d0-4e5f-1a2b-7e6d5c4b3a2d', 120000.00, 'deposit', 'failed',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '5 days'),

  -- Payout Transaction
  ('f6a7b8c9-d0e1-4f5a-2b3c-8e7d6c5b4a3e', 200000.00, 'payout', 'completed',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '1 hour'),

  -- Cancelled Payment
  ('a7b8c9d0-e1f2-4a5b-3c4d-9e8d7c6b5a4f', 90000.00, 'deposit', 'failed',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '7 days'),

  -- Very Recent Transaction
  ('b8c9d0e1-f2a3-4b5c-4d5e-0f9e8d7c6b5a', 275000.00, 'deposit', 'completed',
   'e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e', 'a59d30e1-3fe1-485f-96c3-a0c82e1fb4db',
   NOW() - INTERVAL '30 minutes');

-- Note: You'll need to replace the project_ids and profile_ids with actual IDs from your database
-- You can run this SQL directly in your Supabase SQL editor 
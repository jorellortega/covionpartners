-- Add Stripe-related columns to users table
ALTER TABLE users
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN subscription_status TEXT,
ADD COLUMN subscription_id TEXT,
ADD COLUMN subscription_tier TEXT; 
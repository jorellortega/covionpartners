-- Create subscriptions table for full subscription management
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- e.g., 'stripe', 'manual', etc.
    provider_subscription_id TEXT, -- e.g., Stripe subscription ID
    plan VARCHAR(50) NOT NULL,     -- e.g., 'free_basic', 'free_plus', 'pro', 'enterprise'
    role VARCHAR(50) NOT NULL,     -- e.g., 'basic', 'plus', 'pro', 'enterprise'
    status VARCHAR(50) NOT NULL,   -- e.g., 'active', 'canceled', 'trialing', 'past_due'
    promo_code TEXT,               -- Optional promo code applied
    promo_expires_at TIMESTAMP WITH TIME ZONE, -- When promo ends
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_id ON subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_promo_code ON subscriptions(promo_code);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
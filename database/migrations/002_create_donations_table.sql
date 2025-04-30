-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES users(id), -- Can be NULL for anonymous donations
    recipient_id UUID NOT NULL REFERENCES users(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    transaction_id UUID REFERENCES transactions(id),
    amount DECIMAL(15,2) NOT NULL,
    processing_fee DECIMAL(15,2) NOT NULL,
    platform_fee DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_method_id UUID REFERENCES payment_methods(id),
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_donation_amount CHECK (amount > 0),
    CONSTRAINT positive_processing_fee CHECK (processing_fee >= 0),
    CONSTRAINT positive_platform_fee CHECK (platform_fee >= 0),
    CONSTRAINT positive_total_amount CHECK (total_amount > 0)
);

-- Create indexes
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_recipient_id ON donations(recipient_id);
CREATE INDEX idx_donations_project_id ON donations(project_id);
CREATE INDEX idx_donations_transaction_id ON donations(transaction_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
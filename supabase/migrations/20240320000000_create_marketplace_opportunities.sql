-- Create marketplace_opportunities table
CREATE TABLE marketplace_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(12,2),
    required_skills TEXT[],
    estimated_duration TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    category TEXT,
    location TEXT,
    experience_level TEXT,
    project_type TEXT,
    is_featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0
);

-- Create RLS policies
ALTER TABLE marketplace_opportunities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view marketplace opportunities
CREATE POLICY "Allow public read access to marketplace opportunities"
    ON marketplace_opportunities FOR SELECT
    USING (true);

-- Allow authenticated users to create opportunities
CREATE POLICY "Allow authenticated users to create marketplace opportunities"
    ON marketplace_opportunities FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Allow creators to update their own opportunities
CREATE POLICY "Allow creators to update their own marketplace opportunities"
    ON marketplace_opportunities FOR UPDATE
    USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_marketplace_opportunities_updated_at
    BEFORE UPDATE ON marketplace_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_marketplace_opportunities_status ON marketplace_opportunities(status);
CREATE INDEX idx_marketplace_opportunities_category ON marketplace_opportunities(category);
CREATE INDEX idx_marketplace_opportunities_created_at ON marketplace_opportunities(created_at); 
-- Create deals table
CREATE TABLE deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
    deal_type TEXT NOT NULL CHECK (deal_type IN ('investment', 'partnership', 'collaboration', 'acquisition', 'custom')),
    custom_type TEXT,
    requirements JSONB,
    terms JSONB,
    timeline JSONB,
    budget DECIMAL(12,2),
    equity_share DECIMAL(5,2),
    roi_expectation DECIMAL(5,2),
    deadline TIMESTAMP WITH TIME ZONE,
    confidentiality_level TEXT NOT NULL CHECK (confidentiality_level IN ('public', 'private', 'confidential')) DEFAULT 'private',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deal_participants table
CREATE TABLE deal_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    role TEXT,
    custom_role TEXT,
    investment_amount DECIMAL(12,2),
    equity_share DECIMAL(5,2),
    responsibilities TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deal_id, user_id)
);

-- Create deal_comments table
CREATE TABLE deal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deal_attachments table
CREATE TABLE deal_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deal_milestones table
CREATE TABLE deal_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_deals_initiator_id ON deals(initiator_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deal_participants_deal_id ON deal_participants(deal_id);
CREATE INDEX idx_deal_participants_user_id ON deal_participants(user_id);
CREATE INDEX idx_deal_comments_deal_id ON deal_comments(deal_id);
CREATE INDEX idx_deal_attachments_deal_id ON deal_attachments(deal_id);
CREATE INDEX idx_deal_milestones_deal_id ON deal_milestones(deal_id);

-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for deals table
CREATE POLICY "Users can view their own deals" ON deals
    FOR SELECT USING (
        initiator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM deal_participants
            WHERE deal_participants.deal_id = deals.id
            AND deal_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create deals" ON deals
    FOR INSERT WITH CHECK (initiator_id = auth.uid());

CREATE POLICY "Initiators can update their deals" ON deals
    FOR UPDATE USING (initiator_id = auth.uid());

-- Create policies for deal_participants table
CREATE POLICY "Users can view their own deal participants" ON deal_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_participants.deal_id
            AND deals.initiator_id = auth.uid()
        )
    );

CREATE POLICY "Initiators can add participants" ON deal_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_participants.deal_id
            AND deals.initiator_id = auth.uid()
        )
    );

CREATE POLICY "Participants can update their own status" ON deal_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Create policies for deal_comments table
CREATE POLICY "Users can view comments on their deals" ON deal_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_comments.deal_id
            AND (
                deals.initiator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM deal_participants
                    WHERE deal_participants.deal_id = deals.id
                    AND deal_participants.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create comments on their deals" ON deal_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_comments.deal_id
            AND (
                deals.initiator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM deal_participants
                    WHERE deal_participants.deal_id = deals.id
                    AND deal_participants.user_id = auth.uid()
                )
            )
        )
    );

-- Create policies for deal_attachments table
CREATE POLICY "Users can view attachments on their deals" ON deal_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_attachments.deal_id
            AND (
                deals.initiator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM deal_participants
                    WHERE deal_participants.deal_id = deals.id
                    AND deal_participants.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can add attachments to their deals" ON deal_attachments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_attachments.deal_id
            AND (
                deals.initiator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM deal_participants
                    WHERE deal_participants.deal_id = deals.id
                    AND deal_participants.user_id = auth.uid()
                )
            )
        )
    );

-- Create policies for deal_milestones table
CREATE POLICY "Users can view milestones on their deals" ON deal_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_milestones.deal_id
            AND (
                deals.initiator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM deal_participants
                    WHERE deal_participants.deal_id = deals.id
                    AND deal_participants.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Initiators can manage milestones" ON deal_milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM deals
            WHERE deals.id = deal_milestones.deal_id
            AND deals.initiator_id = auth.uid()
        )
    ); 
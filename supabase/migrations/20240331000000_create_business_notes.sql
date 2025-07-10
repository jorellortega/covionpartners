-- Create business_notes table
CREATE TABLE IF NOT EXISTS business_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_business_notes_organization_id ON business_notes(organization_id);
CREATE INDEX idx_business_notes_user_id ON business_notes(user_id);
CREATE INDEX idx_business_notes_created_at ON business_notes(created_at);

-- Enable RLS on business_notes table
ALTER TABLE business_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for business_notes table
CREATE POLICY "Users can view notes for organizations they own or are members of"
ON business_notes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = business_notes.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM team_members
                WHERE team_members.organization_id = organizations.id
                AND team_members.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can insert notes for organizations they own or are members of"
ON business_notes
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = business_notes.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM team_members
                WHERE team_members.organization_id = organizations.id
                AND team_members.user_id = auth.uid()
            )
        )
    )
    AND user_id = auth.uid()
);

CREATE POLICY "Users can update notes they created"
ON business_notes
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete notes they created"
ON business_notes
FOR DELETE
USING (user_id = auth.uid()); 
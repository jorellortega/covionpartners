-- Create partner_notes table for organization owners to share notes with partners
-- Supports rich content: links, images, videos, and links to public projects (sub-projects)

CREATE TABLE IF NOT EXISTS partner_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_invitation_id UUID NOT NULL REFERENCES partner_invitations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Rich content (markdown or HTML)
    content_type TEXT DEFAULT 'markdown' CHECK (content_type IN ('markdown', 'html', 'plain')),
    linked_project_ids UUID[], -- Array of public project IDs (sub-projects) to link
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of {type: 'image'|'video'|'file', url: string, name: string}
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_notes_invitation_id ON partner_notes(partner_invitation_id);
CREATE INDEX IF NOT EXISTS idx_partner_notes_project_id ON partner_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_partner_notes_created_by ON partner_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_partner_notes_created_at ON partner_notes(created_at DESC);

-- Enable RLS
ALTER TABLE partner_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organization owners can manage notes for their partner invitations
CREATE POLICY "Organization owners can select partner notes"
    ON partner_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_notes.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert partner notes"
    ON partner_notes
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_notes.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update partner notes"
    ON partner_notes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_notes.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_notes.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete partner notes"
    ON partner_notes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_notes.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

-- Partners can view notes for their accepted invitations
CREATE POLICY "Partners can view their notes"
    ON partner_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partner_access
            WHERE partner_access.partner_invitation_id = partner_notes.partner_invitation_id
            AND partner_access.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partner_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_partner_notes_updated_at
    BEFORE UPDATE ON partner_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_notes_updated_at();


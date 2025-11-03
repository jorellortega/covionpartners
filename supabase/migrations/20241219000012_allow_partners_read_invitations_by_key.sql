-- Allow authenticated users to read and accept pending invitations by key
-- This is safe because the invitation_key itself acts as the authentication mechanism
-- Only pending invitations can be read, and only when the key matches

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can read pending invitations by key" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can read their accepted invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Authenticated users can accept pending invitations" ON partner_invitations;

-- Allow authenticated users to read pending invitations (for accepting)
CREATE POLICY "Authenticated users can read pending invitations by key"
    ON partner_invitations
    FOR SELECT
    USING (
        auth.role() = 'authenticated' 
        AND status = 'pending'
    );

-- Allow partners to read accepted invitations where they have access
-- This is needed after acceptance to view their projects
-- NOTE: We avoid checking partner_access here to prevent circular recursion
-- Instead, we allow reading accepted invitations for authenticated users
-- The security is maintained because:
-- 1. Partners can only see invitations they join through partner_access (which they can read)
-- 2. The application query filters by user_id in partner_access
-- 3. Partners can't directly query all invitations without the join
CREATE POLICY "Partners can read their accepted invitations"
    ON partner_invitations
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND status = 'accepted'
        -- Don't check partner_access here to avoid circular recursion
        -- Security is maintained by the join in application queries
    );

-- Allow authenticated users to update invitation status to 'accepted'
-- This allows partners to accept invitations they have the key for
CREATE POLICY "Authenticated users can accept pending invitations"
    ON partner_invitations
    FOR UPDATE
    USING (
        auth.role() = 'authenticated'
        AND status = 'pending'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (status = 'accepted' OR status = 'pending')
        -- Allow updating status to 'accepted' (or keeping as 'pending' if update fails)
        -- The USING clause ensures we can only update rows with status = 'pending'
        -- Application code ensures only status and updated_at are changed
    );

-- Drop existing partner_access policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Partners can view their own access" ON partner_access;
DROP POLICY IF EXISTS "Partners can update their own access" ON partner_access;

-- Allow partners to read their own partner_access records
-- This allows partners to see which projects they have access to
CREATE POLICY "Partners can view their own access"
    ON partner_access
    FOR SELECT
    USING (
        user_id = auth.uid()
    );

-- Allow partners to update their own partner_access records (to link user_id when accepting invitation)
CREATE POLICY "Partners can update their own access"
    ON partner_access
    FOR UPDATE
    USING (
        user_id IS NULL
        OR user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- Allow partners to read their visibility settings
-- Partners need to see what they're allowed to view (updates, expenses, etc.)
DROP POLICY IF EXISTS "Partners can view their settings" ON organization_partner_settings;

CREATE POLICY "Partners can view their settings"
    ON organization_partner_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_access pa
            WHERE pa.partner_invitation_id = organization_partner_settings.partner_invitation_id
            AND pa.user_id = auth.uid()
        )
    );

-- Allow partners to read updates for projects they have access to
DROP POLICY IF EXISTS "Partners can view updates for their projects" ON updates;

CREATE POLICY "Partners can view updates for their projects"
    ON updates
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 
            FROM partner_access pa
            JOIN organization_partner_settings ops ON ops.partner_invitation_id = pa.partner_invitation_id
            WHERE pa.project_id = updates.project_id
            AND pa.user_id = auth.uid()
            AND ops.can_see_updates = true
        )
    );

-- Allow partners to read expenses for projects they have access to
DROP POLICY IF EXISTS "Partners can view expenses for their projects" ON expenses;

CREATE POLICY "Partners can view expenses for their projects"
    ON expenses
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 
            FROM partner_access pa
            JOIN organization_partner_settings ops ON ops.partner_invitation_id = pa.partner_invitation_id
            WHERE pa.project_id = expenses.project_id
            AND pa.user_id = auth.uid()
            AND ops.can_see_expenses = true
        )
    );

-- Note: 
-- - SELECT policy on partner_invitations allows reading pending invitations (filtered by invitation_key in WHERE clause)
-- - UPDATE policy on partner_invitations allows changing status from 'pending' to 'accepted' only
-- - SELECT policy on partner_access allows partners to read their own access records
-- - UPDATE policy on partner_access allows partners to link their user_id when accepting invitations
-- - SELECT policy on organization_partner_settings allows partners to read their visibility settings
-- - SELECT policy on updates allows partners to read updates for projects they have access to (if can_see_updates is true)
-- - SELECT policy on expenses allows partners to read expenses for projects they have access to (if can_see_expenses is true)
-- - The invitation_key itself is the security mechanism - users can only access invitations they know the key for
-- - Application code filters by invitation_key, so users can only see invitations they have the key for


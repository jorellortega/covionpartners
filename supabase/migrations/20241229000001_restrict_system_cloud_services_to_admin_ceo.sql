-- Restrict system cloud service management to admin and CEO roles only
-- This migration updates RLS policies to ensure only admins and CEOs can manage system connections

-- Drop existing policies for system connections
DROP POLICY IF EXISTS "Users can insert their own cloud services" ON cloud_services;
DROP POLICY IF EXISTS "Users can update their own cloud services" ON cloud_services;
DROP POLICY IF EXISTS "Users can delete their own cloud services" ON cloud_services;

-- Users can insert their own user connections OR system connections (if admin/CEO)
CREATE POLICY "Users can insert their own cloud services" ON cloud_services
    FOR INSERT WITH CHECK (
        -- User can insert their own user connections
        (connection_type = 'user' AND auth.uid() = user_id)
        OR
        -- Only admin/CEO can insert system connections
        (
            connection_type = 'system' 
            AND user_id IS NULL
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'ceo')
            )
        )
    );

-- Users can update their own connections, and system connections can be updated by admin/CEO only
CREATE POLICY "Users can update their own cloud services" ON cloud_services
    FOR UPDATE USING (
        -- User can update their own user connections
        (connection_type = 'user' AND auth.uid() = user_id)
        OR
        -- Only admin/CEO can update system connections
        (
            connection_type = 'system'
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'ceo')
            )
        )
    );

-- Users can delete their own connections, and system connections can be deleted by admin/CEO only
CREATE POLICY "Users can delete their own cloud services" ON cloud_services
    FOR DELETE USING (
        -- User can delete their own user connections
        (connection_type = 'user' AND auth.uid() = user_id)
        OR
        -- Only admin/CEO can delete system connections
        (
            connection_type = 'system'
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE users.id = auth.uid()
                AND users.role IN ('admin', 'ceo')
            )
        )
    );


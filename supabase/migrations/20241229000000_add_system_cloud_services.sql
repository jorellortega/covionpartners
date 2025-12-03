-- Migration to support system-wide cloud service connections
-- This allows the platform to have a default Dropbox account for all users
-- while users can still connect their own accounts for additional storage

-- Add connection_type column to distinguish system vs user connections
ALTER TABLE cloud_services 
ADD COLUMN IF NOT EXISTS connection_type VARCHAR(20) DEFAULT 'user' CHECK (connection_type IN ('system', 'user'));

-- Make user_id nullable for system connections
ALTER TABLE cloud_services 
ALTER COLUMN user_id DROP NOT NULL;

-- Update unique constraint to allow system connections (user_id can be NULL for system)
-- Drop the old constraint first if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cloud_services_user_id_service_id_key'
    ) THEN
        ALTER TABLE cloud_services DROP CONSTRAINT cloud_services_user_id_service_id_key;
    END IF;
END $$;

-- Create partial unique indexes that allow:
-- - One system connection per service (user_id IS NULL, connection_type = 'system')
-- - One user connection per user per service (user_id IS NOT NULL, connection_type = 'user')
CREATE UNIQUE INDEX IF NOT EXISTS cloud_services_unique_user_service 
ON cloud_services(user_id, service_id) 
WHERE user_id IS NOT NULL AND connection_type = 'user';

CREATE UNIQUE INDEX IF NOT EXISTS cloud_services_unique_system_service 
ON cloud_services(service_id) 
WHERE connection_type = 'system' AND user_id IS NULL;

-- Add index for system connections
CREATE INDEX IF NOT EXISTS idx_cloud_services_connection_type ON cloud_services(connection_type);
CREATE INDEX IF NOT EXISTS idx_cloud_services_system ON cloud_services(service_id) WHERE connection_type = 'system';

-- Update RLS policies to allow system connections to be viewable by all authenticated users
-- (but only admins can manage them)
DROP POLICY IF EXISTS "Users can view their own cloud services" ON cloud_services;
DROP POLICY IF EXISTS "Users can view system cloud services" ON cloud_services;
DROP POLICY IF EXISTS "Users can insert their own cloud services" ON cloud_services;
DROP POLICY IF EXISTS "Users can update their own cloud services" ON cloud_services;
DROP POLICY IF EXISTS "Users can delete their own cloud services" ON cloud_services;

-- Users can view their own connections and system connections
CREATE POLICY "Users can view their own cloud services" ON cloud_services
    FOR SELECT USING (
        (connection_type = 'user' AND auth.uid() = user_id)
        OR
        (connection_type = 'system')
    );

-- Users can insert their own user connections
CREATE POLICY "Users can insert their own cloud services" ON cloud_services
    FOR INSERT WITH CHECK (
        (connection_type = 'user' AND auth.uid() = user_id)
        OR
        (connection_type = 'system' AND user_id IS NULL)
    );

-- Users can update their own connections, and system connections can be updated by any authenticated user
-- (Admin check should be done in application code)
CREATE POLICY "Users can update their own cloud services" ON cloud_services
    FOR UPDATE USING (
        (connection_type = 'user' AND auth.uid() = user_id)
        OR
        (connection_type = 'system')
    );

-- Users can delete their own connections, and system connections can be deleted by any authenticated user
-- (Admin check should be done in application code)
CREATE POLICY "Users can delete their own cloud services" ON cloud_services
    FOR DELETE USING (
        (connection_type = 'user' AND auth.uid() = user_id)
        OR
        (connection_type = 'system')
    );

-- Add comment
COMMENT ON COLUMN cloud_services.connection_type IS 'Type of connection: system (platform-wide) or user (individual user account)';
COMMENT ON COLUMN cloud_services.user_id IS 'User ID for user connections, NULL for system connections';


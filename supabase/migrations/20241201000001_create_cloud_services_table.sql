-- Create cloud_services table to store user cloud service connections
CREATE TABLE IF NOT EXISTS cloud_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id VARCHAR(50) NOT NULL, -- 'google-drive', 'dropbox', 'onedrive', 'box'
    service_name VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    account_info JSONB, -- Store user's account info (name, email, etc.)
    scopes TEXT[], -- OAuth scopes granted
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one connection per user per service
    UNIQUE(user_id, service_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cloud_services_user_id ON cloud_services(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_services_service_id ON cloud_services(service_id);
CREATE INDEX IF NOT EXISTS idx_cloud_services_active ON cloud_services(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_cloud_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cloud_services_updated_at
    BEFORE UPDATE ON cloud_services
    FOR EACH ROW
    EXECUTE FUNCTION update_cloud_services_updated_at();

-- Enable RLS
ALTER TABLE cloud_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cloud services" ON cloud_services
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cloud services" ON cloud_services
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cloud services" ON cloud_services
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cloud services" ON cloud_services
    FOR DELETE USING (auth.uid() = user_id);

-- Create cloud_service_files table to track synced files
CREATE TABLE IF NOT EXISTS cloud_service_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cloud_service_id UUID NOT NULL REFERENCES cloud_services(id) ON DELETE CASCADE,
    file_id VARCHAR(255) NOT NULL, -- External file ID from the cloud service
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_hash VARCHAR(255), -- For change detection
    is_folder BOOLEAN DEFAULT false,
    parent_folder_id VARCHAR(255), -- Reference to parent folder
    last_modified TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'pending', 'error'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one file record per cloud service file
    UNIQUE(cloud_service_id, file_id)
);

-- Create indexes for cloud_service_files
CREATE INDEX IF NOT EXISTS idx_cloud_service_files_service_id ON cloud_service_files(cloud_service_id);
CREATE INDEX IF NOT EXISTS idx_cloud_service_files_file_id ON cloud_service_files(file_id);
CREATE INDEX IF NOT EXISTS idx_cloud_service_files_sync_status ON cloud_service_files(sync_status);
CREATE INDEX IF NOT EXISTS idx_cloud_service_files_parent_folder ON cloud_service_files(parent_folder_id);

-- Create updated_at trigger for cloud_service_files
CREATE TRIGGER trigger_update_cloud_service_files_updated_at
    BEFORE UPDATE ON cloud_service_files
    FOR EACH ROW
    EXECUTE FUNCTION update_cloud_services_updated_at();

-- Enable RLS for cloud_service_files
ALTER TABLE cloud_service_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cloud_service_files
CREATE POLICY "Users can view their cloud service files" ON cloud_service_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cloud_services 
            WHERE cloud_services.id = cloud_service_files.cloud_service_id 
            AND cloud_services.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their cloud service files" ON cloud_service_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cloud_services 
            WHERE cloud_services.id = cloud_service_files.cloud_service_id 
            AND cloud_services.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their cloud service files" ON cloud_service_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cloud_services 
            WHERE cloud_services.id = cloud_service_files.cloud_service_id 
            AND cloud_services.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their cloud service files" ON cloud_service_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM cloud_services 
            WHERE cloud_services.id = cloud_service_files.cloud_service_id 
            AND cloud_services.user_id = auth.uid()
        )
    );

-- Create cloud_service_sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS cloud_service_sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cloud_service_id UUID NOT NULL REFERENCES cloud_services(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'manual'
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    files_processed INTEGER DEFAULT 0,
    files_added INTEGER DEFAULT 0,
    files_updated INTEGER DEFAULT 0,
    files_deleted INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for sync logs
CREATE INDEX IF NOT EXISTS idx_cloud_service_sync_logs_service_id ON cloud_service_sync_logs(cloud_service_id);
CREATE INDEX IF NOT EXISTS idx_cloud_service_sync_logs_status ON cloud_service_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_cloud_service_sync_logs_started_at ON cloud_service_sync_logs(started_at);

-- Enable RLS for sync logs
ALTER TABLE cloud_service_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sync logs
CREATE POLICY "Users can view their cloud service sync logs" ON cloud_service_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cloud_services 
            WHERE cloud_services.id = cloud_service_sync_logs.cloud_service_id 
            AND cloud_services.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their cloud service sync logs" ON cloud_service_sync_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cloud_services 
            WHERE cloud_services.id = cloud_service_sync_logs.cloud_service_id 
            AND cloud_services.user_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE cloud_services IS 'Stores user connections to cloud storage services';
COMMENT ON TABLE cloud_service_files IS 'Tracks files synced from cloud storage services';
COMMENT ON TABLE cloud_service_sync_logs IS 'Logs sync operations for cloud services';

COMMENT ON COLUMN cloud_services.service_id IS 'Identifier for the cloud service (google-drive, dropbox, etc.)';
COMMENT ON COLUMN cloud_services.account_info IS 'JSON object containing user account information from the cloud service';
COMMENT ON COLUMN cloud_services.scopes IS 'Array of OAuth scopes granted for this connection';
COMMENT ON COLUMN cloud_service_files.file_hash IS 'Hash of file content for change detection';
COMMENT ON COLUMN cloud_service_files.sync_status IS 'Current sync status of the file';

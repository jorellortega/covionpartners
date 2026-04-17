# Cloud Services Implementation Summary

## Overview

This document provides a complete summary of how cloud services integration was implemented in this codebase, including all technical specifications needed to replicate it on another website.

## Architecture

The system supports **two types of cloud service connections**:

1. **User Connections** (`connection_type = 'user'`)
   - Individual users connect their personal cloud storage accounts
   - Stored with `user_id` in the database
   - Users have full control over their connections

2. **System Connections** (`connection_type = 'system'`)
   - Platform-wide default storage (e.g., system Dropbox)
   - Stored with `user_id = NULL` in the database
   - Only admins/CEOs can manage system connections
   - Used as fallback when users don't have personal connections
   - Folder structure: `/Covion Partners/Users/{userId}/...`

### Storage Priority Logic

When a user needs cloud storage:
1. **First**: Check for user's personal connection → Use if available
2. **Fallback**: Use system connection → Create user folder structure if needed

## Supported Services

- **Google Drive** (`google-drive`)
- **Dropbox** (`dropbox`) - Primary implementation
- **OneDrive** (`onedrive`)
- **Box** (`box`)

## Database Schema

### Table: `cloud_services`

```sql
CREATE TABLE cloud_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system connections
    service_id VARCHAR(50) NOT NULL, -- 'google-drive', 'dropbox', 'onedrive', 'box'
    service_name VARCHAR(100) NOT NULL,
    connection_type VARCHAR(20) DEFAULT 'user' CHECK (connection_type IN ('system', 'user')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    account_info JSONB, -- User account info (name, email, etc.)
    scopes TEXT[], -- OAuth scopes granted
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraints via partial indexes
    -- One user connection per user per service
    -- One system connection per service
);
```

### Table: `cloud_service_files`

Tracks synced files from cloud services:

```sql
CREATE TABLE cloud_service_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloud_service_id UUID REFERENCES cloud_services(id) ON DELETE CASCADE,
    file_id VARCHAR(255) NOT NULL, -- External file ID from cloud service
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_hash VARCHAR(255), -- For change detection
    is_folder BOOLEAN DEFAULT false,
    parent_folder_id VARCHAR(255),
    last_modified TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'pending', 'error'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(cloud_service_id, file_id)
);
```

### Table: `cloud_service_sync_logs`

Tracks sync operations:

```sql
CREATE TABLE cloud_service_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloud_service_id UUID REFERENCES cloud_services(id) ON DELETE CASCADE,
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
```

## Row Level Security (RLS) Policies

### Viewing Connections
- Users can view their own user connections
- All authenticated users can view system connections (read-only)

### Managing Connections
- Users can insert/update/delete their own user connections
- Only admins/CEOs can insert/update/delete system connections
- System connections require role check: `users.role IN ('admin', 'ceo')`

## OAuth Flow

### 1. Initiate Connection (`POST /api/cloud-services/connect/[serviceId]`)

**Process:**
1. Authenticate user via Supabase
2. Check for existing connection (update or create)
3. Generate state parameter: `${userId}:${serviceId}:${timestamp}`
4. Build OAuth URL with:
   - `client_id`
   - `redirect_uri`
   - `response_type=code`
   - `scope`
   - `state`
   - `access_type=offline` (for refresh tokens)
   - `prompt=consent`
5. Return OAuth URL to frontend
6. Frontend redirects user to OAuth provider

### 2. OAuth Callback (`GET /api/cloud-services/callback/[serviceId]`)

**Process:**
1. Extract `code` and `state` from URL params
2. Parse state to get `userId` and `serviceId`
3. Verify authenticated user matches state `userId`
4. Exchange authorization code for access token (service-specific)
5. Fetch user account info from cloud service
6. Update/insert connection in database with:
   - `access_token`
   - `refresh_token` (if provided)
   - `account_info`
   - `is_active = true`
7. Redirect to `/cloud-services?success=connected`

### OAuth Configuration

Each service has specific OAuth settings:

```typescript
const OAUTH_CONFIG = {
  'google-drive': {
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: `${NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/google-drive`,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  'dropbox': {
    clientId: process.env.DROPBOX_CLIENT_ID,
    redirectUri: `${NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/dropbox`,
    scope: 'files.metadata.write files.content.write files.content.read account_info.read',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
  },
  'onedrive': {
    clientId: process.env.ONEDRIVE_CLIENT_ID,
    redirectUri: `${NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/onedrive`,
    scope: 'Files.Read User.Read',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  },
  'box': {
    clientId: process.env.BOX_CLIENT_ID,
    redirectUri: `${NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/box`,
    scope: 'root_readonly',
    authUrl: 'https://account.box.com/api/oauth2/authorize',
  },
};
```

## API Endpoints

### User Endpoints

#### `GET /api/cloud-services/connections`
- Returns all active connections for the authenticated user
- Includes system connections (read-only visibility)

#### `POST /api/cloud-services/connect/[serviceId]`
- Initiates OAuth flow for a service
- Returns `{ authUrl: string }` for redirect

#### `GET /api/cloud-services/callback/[serviceId]`
- Handles OAuth callback
- Exchanges code for tokens
- Saves connection to database
- Redirects to `/cloud-services?success=connected`

#### `DELETE /api/cloud-services/disconnect/[serviceId]`
- Revokes OAuth token (if supported)
- Deactivates connection
- Cleans up associated files and sync logs

#### `GET /api/cloud-services/[serviceId]/files`
- Lists files synced from the service

#### `GET /api/cloud-services/[serviceId]/sync-logs`
- Returns sync operation history

#### `POST /api/cloud-services/[serviceId]/sync`
- Triggers manual sync operation

### Admin Endpoints (System Connections)

#### `GET /api/admin/cloud-services/system-dropbox`
- Returns system Dropbox connection status
- Requires admin/CEO role

#### `POST /api/admin/cloud-services/system-dropbox/connect`
- Initiates OAuth flow for system Dropbox
- Requires admin/CEO role

#### `POST /api/admin/cloud-services/system-dropbox`
- Saves system Dropbox connection (called by callback)
- Requires admin/CEO role

#### `DELETE /api/admin/cloud-services/system-dropbox`
- Disconnects system Dropbox
- Requires admin/CEO role

### Test/Utility Endpoints

#### `POST /api/test-cloud/upload`
- Uploads file to system Dropbox
- Uses chunked upload for large files (>4MB)

#### `GET /api/test-cloud/list`
- Lists files/folders in system Dropbox

#### `GET /api/test-cloud/download`
- Downloads file from system Dropbox

#### `POST /api/test-cloud/create-folder`
- Creates folder in system Dropbox

#### `DELETE /api/test-cloud/delete`
- Deletes file/folder from system Dropbox

#### `GET /api/test-cloud/get-upload-url`
- Gets temporary upload URL

#### `GET /api/test-cloud/check-connection`
- Checks system Dropbox connection status

## Core Library Functions

### `lib/cloud-storage.ts`

#### `getCloudStorageConnection(userId, serviceId)`
- **Priority**: User connection → System connection
- Returns best available connection for a user

#### `getSystemCloudStorageConnection(serviceId)`
- Returns system connection only
- Used for platform-wide operations

#### `getUserCloudStorageConnection(userId, serviceId)`
- Returns user's personal connection only

#### `getSystemDropboxUserFolder(userId)`
- Returns: `/Covion Partners/Users/{userId}`

#### `getSystemDropboxProjectFolder(projectId)`
- Returns: `/Covion Partners/Projects/{projectId}`

#### `getSystemDropboxUserProjectFolder(userId, projectId)`
- Returns: `/Covion Partners/Users/{userId}/Projects/{projectId}`

#### `createDropboxFolder(accessToken, path)`
- Creates folder in Dropbox
- Handles existing folder conflicts (409 status)

#### `ensureUserFolderStructure(systemConnection, userId)`
- Creates base folder structure:
  - `/Covion Partners`
  - `/Covion Partners/Users`
  - `/Covion Partners/Users/{userId}`

## File Operations (Dropbox Implementation)

### Upload

**Small files (≤4MB):**
- Direct upload to `https://content.dropboxapi.com/2/files/upload`
- Headers:
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/octet-stream`
  - `Dropbox-API-Arg: { path, mode, autorename, mute }`

**Large files (>4MB):**
- Chunked upload using upload sessions:
  1. Start session: `POST /files/upload_session/start`
  2. Append chunks: `POST /files/upload_session/append_v2`
  3. Finish session: `POST /files/upload_session/finish`
- Chunk size: 4MB

### List Files

```typescript
POST https://api.dropboxapi.com/2/files/list_folder
Headers: {
  Authorization: `Bearer ${access_token}`,
  Content-Type: 'application/json'
}
Body: {
  path: string,
  recursive: boolean
}
```

### Download

```typescript
POST https://content.dropboxapi.com/2/files/download
Headers: {
  Authorization: `Bearer ${access_token}`,
  Dropbox-API-Arg: JSON.stringify({ path })
}
```

### Delete

```typescript
POST https://api.dropboxapi.com/2/files/delete_v2
Headers: {
  Authorization: `Bearer ${access_token}`,
  Content-Type: 'application/json'
}
Body: {
  path: string
}
```

## Environment Variables

Required environment variables:

```bash
# Google Drive OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Dropbox OAuth
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret

# OneDrive OAuth
ONEDRIVE_CLIENT_ID=your_onedrive_client_id
ONEDRIVE_CLIENT_SECRET=your_onedrive_client_secret

# Box OAuth
BOX_CLIENT_ID=your_box_client_id
BOX_CLIENT_SECRET=your_box_client_secret

# Site URL for OAuth redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or production URL
```

## OAuth App Setup

### Google Drive
1. Google Cloud Console → Create project
2. Enable Google Drive API
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `{SITE_URL}/api/cloud-services/callback/google-drive`

### Dropbox
1. Dropbox App Console → Create app
2. Choose "Scoped access" + "Full Dropbox"
3. Add redirect URI: `{SITE_URL}/api/cloud-services/callback/dropbox`

### OneDrive
1. Azure Portal → App registrations
2. Create new registration
3. Add redirect URI: `{SITE_URL}/api/cloud-services/callback/onedrive`
4. Generate client secret

### Box
1. Box Developer Console → Create app
2. Choose "Custom App" + "OAuth 2.0 with JWT"
3. Add redirect URI: `{SITE_URL}/api/cloud-services/callback/box`

## Frontend Implementation

### Main Page: `/cloud-services`

**Features:**
- Display all available services
- Show connection status (connected/not connected)
- Display account info for connected services
- Connect/disconnect buttons
- Manage button to view service details

**Key Functions:**
- `loadConnectedServices()` - Fetches user connections
- `handleConnect(serviceId)` - Initiates OAuth flow
- `handleDisconnect(serviceId)` - Disconnects service
- `handleManage(serviceId)` - Navigates to service detail page

### Service Detail Page: `/cloud-services/[serviceId]`

- View account information
- Monitor sync activity
- Browse synced files
- Trigger manual sync

## Security Features

1. **OAuth 2.0 State Parameter**
   - Format: `${userId}:${serviceId}:${timestamp}`
   - Validated on callback to prevent CSRF

2. **User Verification**
   - Callback verifies authenticated user matches state `userId`

3. **Token Storage**
   - Access tokens stored in database (encrypted by Supabase)
   - Refresh tokens stored for long-lived access

4. **RLS Policies**
   - Users can only manage their own connections
   - System connections restricted to admin/CEO roles

5. **Token Revocation**
   - On disconnect, attempts to revoke OAuth token
   - Service-specific revocation endpoints

## Database Migrations

Three migrations in order:

1. **`20241201000001_create_cloud_services_table.sql`**
   - Creates base tables and RLS policies

2. **`20241229000000_add_system_cloud_services.sql`**
   - Adds `connection_type` column
   - Makes `user_id` nullable
   - Updates unique constraints
   - Updates RLS policies for system connections

3. **`20241229000001_restrict_system_cloud_services_to_admin_ceo.sql`**
   - Restricts system connection management to admin/CEO roles

## File Structure

```
app/
├── cloud-services/
│   ├── page.tsx                    # Main services page
│   └── [serviceId]/
│       └── page.tsx                # Service detail page
├── api/
│   ├── cloud-services/
│   │   ├── connections/route.ts    # GET user connections
│   │   ├── connect/
│   │   │   └── [serviceId]/route.ts  # POST initiate OAuth
│   │   ├── disconnect/
│   │   │   └── [serviceId]/route.ts  # DELETE disconnect
│   │   ├── callback/
│   │   │   ├── dropbox/route.ts
│   │   │   ├── google-drive/route.ts
│   │   │   ├── onedrive/route.ts
│   │   │   └── box/route.ts
│   │   └── [serviceId]/
│   │       ├── files/route.ts
│   │       ├── sync/route.ts
│   │       └── sync-logs/route.ts
│   ├── admin/
│   │   └── cloud-services/
│   │       └── system-dropbox/
│   │           ├── route.ts        # GET/POST/DELETE system connection
│   │           ├── connect/route.ts  # POST initiate OAuth
│   │           └── callback/route.ts # GET OAuth callback
│   └── test-cloud/                 # Test/utility endpoints
│       ├── upload/route.ts
│       ├── list/route.ts
│       ├── download/route.ts
│       ├── create-folder/route.ts
│       ├── delete/route.ts
│       ├── get-upload-url/route.ts
│       └── check-connection/route.ts
lib/
└── cloud-storage.ts                # Core utility functions
supabase/migrations/
├── 20241201000001_create_cloud_services_table.sql
├── 20241229000000_add_system_cloud_services.sql
└── 20241229000001_restrict_system_cloud_services_to_admin_ceo.sql
```

## Implementation Checklist

To replicate this on another website:

### 1. Database Setup
- [ ] Run migration `20241201000001_create_cloud_services_table.sql`
- [ ] Run migration `20241229000000_add_system_cloud_services.sql`
- [ ] Run migration `20241229000001_restrict_system_cloud_services_to_admin_ceo.sql`
- [ ] Verify RLS policies are active

### 2. Environment Variables
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Set `DROPBOX_CLIENT_ID` and `DROPBOX_CLIENT_SECRET`
- [ ] Set `ONEDRIVE_CLIENT_ID` and `ONEDRIVE_CLIENT_SECRET`
- [ ] Set `BOX_CLIENT_ID` and `BOX_CLIENT_SECRET`
- [ ] Set `NEXT_PUBLIC_SITE_URL`

### 3. OAuth App Configuration
- [ ] Create Google Drive OAuth app
- [ ] Create Dropbox OAuth app
- [ ] Create OneDrive OAuth app
- [ ] Create Box OAuth app
- [ ] Configure redirect URIs for each service

### 4. Code Implementation
- [ ] Copy `lib/cloud-storage.ts`
- [ ] Create API routes for user connections
- [ ] Create API routes for OAuth callbacks
- [ ] Create admin API routes for system connections
- [ ] Create frontend pages (`/cloud-services`)
- [ ] Implement file upload/download operations

### 5. Testing
- [ ] Test user connection flow
- [ ] Test system connection flow (as admin)
- [ ] Test file upload to Dropbox
- [ ] Test file listing
- [ ] Test file download
- [ ] Test disconnect and token revocation
- [ ] Verify RLS policies work correctly

## Key Implementation Details

### State Parameter Security
The state parameter format `${userId}:${serviceId}:${timestamp}` ensures:
- User ID is embedded for verification
- Service ID prevents cross-service attacks
- Timestamp prevents replay attacks

### Token Refresh
Currently, refresh tokens are stored but automatic refresh logic should be implemented:
- Check `token_expires_at` before using token
- Call service-specific refresh endpoint if expired
- Update database with new tokens

### Error Handling
- OAuth errors redirect with `?error=oauth_error`
- Missing parameters redirect with `?error=missing_parameters`
- Invalid state redirects with `?error=invalid_state`
- Token exchange failures redirect with `?error=token_exchange_failed`

### Folder Structure (System Dropbox)
```
/Covion Partners/
  ├── Users/
  │   ├── {userId1}/
  │   │   ├── Projects/
  │   │   │   └── {projectId}/
  │   │   ├── Documents/
  │   │   └── Uploads/
  │   └── {userId2}/
  └── Projects/
      └── {projectId}/
```

## Notes

- The system is designed with Dropbox as the primary implementation
- Other services (Google Drive, OneDrive, Box) have OAuth callbacks but may need additional file operation implementations
- System connections use a fallback pattern: user connection takes priority over system connection
- All file operations use the Dropbox API v2
- Large file uploads use chunked upload sessions for reliability


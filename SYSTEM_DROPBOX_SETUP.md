# System Dropbox Setup Guide

This document explains how to set up and use the system-wide Dropbox connection for the Covion Partners platform.

## Overview

The platform supports two types of Dropbox connections:

1. **System Dropbox** (Platform-wide)
   - Single Dropbox account managed by platform admins
   - Provides default storage for all users
   - Used when users don't have their own Dropbox connected
   - Folder structure: `/Covion Partners/Users/{userId}/...`

2. **User Dropbox** (Individual)
   - Users can connect their own Dropbox accounts
   - Provides additional storage beyond system limits
   - Takes priority over system Dropbox when available
   - Users can manage their own connections via `/cloud-services`

## Folder Structure in System Dropbox

When using the system Dropbox, files are organized as follows:

```
/Covion Partners/
  ├── Users/
  │   ├── {userId1}/
  │   │   ├── Projects/
  │   │   │   ├── {projectId1}/
  │   │   │   └── {projectId2}/
  │   │   ├── Documents/
  │   │   └── Uploads/
  │   ├── {userId2}/
  │   │   └── ...
  │   └── ...
  └── Projects/
      ├── {projectId1}/
      └── {projectId2}/
```

### Folder Paths

- **User folder**: `/Covion Partners/Users/{userId}`
- **User project folder**: `/Covion Partners/Users/{userId}/Projects/{projectId}`
- **Project folder**: `/Covion Partners/Projects/{projectId}`

## Setting Up System Dropbox

### Step 1: Create Dropbox App

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose:
   - **API**: Scoped access
   - **Access type**: Full Dropbox (to create folders and manage files)
   - **Name**: "Covion Partners System Storage" (or your preferred name)
4. Note your **App Key** (Client ID) and **App Secret** (Client Secret)

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
DROPBOX_CLIENT_ID=your_app_key_here
DROPBOX_CLIENT_SECRET=your_app_secret_here
```

### Step 3: Connect System Dropbox (Admin Only)

1. Navigate to `/admin/cloud-services` (admin interface)
2. Click "Connect System Dropbox"
3. Authorize the app in Dropbox
4. The connection will be saved as a system-wide connection

### Step 4: Verify Connection

The system will automatically:
- Create the base folder structure (`/Covion Partners/Users/`)
- Create user-specific folders when needed
- Use system Dropbox as fallback when users don't have their own connection

## API Endpoints

### Admin Endpoints

- `GET /api/admin/cloud-services/system-dropbox` - Get system Dropbox connection status
- `POST /api/admin/cloud-services/system-dropbox/connect` - Initiate OAuth flow
- `POST /api/admin/cloud-services/system-dropbox` - Save connection (used by callback)
- `DELETE /api/admin/cloud-services/system-dropbox` - Disconnect system Dropbox

### User Endpoints

- `GET /api/cloud-services/connections` - Get user's connections (includes system connection visibility)
- `POST /api/cloud-services/connect/dropbox` - Connect user's personal Dropbox
- `GET /api/cloud-services/callback/dropbox` - OAuth callback for user connections

## Usage in Code

### Get Best Available Connection

```typescript
import { getCloudStorageConnection } from '@/lib/cloud-storage';

// Automatically uses user's connection if available, otherwise system connection
const connection = await getCloudStorageConnection(userId, 'dropbox');
```

### Get System Connection Only

```typescript
import { getSystemCloudStorageConnection } from '@/lib/cloud-storage';

const systemConnection = await getSystemCloudStorageConnection('dropbox');
```

### Get User's Personal Connection

```typescript
import { getUserCloudStorageConnection } from '@/lib/cloud-storage';

const userConnection = await getUserCloudStorageConnection(userId, 'dropbox');
```

### Create User Folder Structure

```typescript
import { ensureUserFolderStructure } from '@/lib/cloud-storage';

const systemConnection = await getSystemCloudStorageConnection('dropbox');
if (systemConnection) {
  await ensureUserFolderStructure(systemConnection, userId);
}
```

## Storage Priority

When a user uploads a file:

1. **Check for user's personal Dropbox connection**
   - If connected → Use user's Dropbox
   - If not connected → Continue to step 2

2. **Use system Dropbox connection**
   - Create user folder if needed: `/Covion Partners/Users/{userId}`
   - Store file in appropriate location

## Security Considerations

- System Dropbox connection is read-only for regular users (via RLS)
- Only admins can manage the system connection
- User connections are private to each user
- All connections use OAuth 2.0 with secure token storage

## Troubleshooting

### System Dropbox Not Working

1. Check environment variables are set correctly
2. Verify the connection exists: `GET /api/admin/cloud-services/system-dropbox`
3. Check Dropbox app permissions in Dropbox console
4. Verify folder structure is being created

### Users Can't See System Storage

- System connections are visible to all authenticated users (read-only)
- Check RLS policies are correctly applied
- Verify `connection_type = 'system'` in database

### Folder Creation Fails

- Ensure Dropbox app has "Full Dropbox" access (not "App folder")
- Check access token is valid
- Verify folder path doesn't contain invalid characters

## Next Steps

1. Create admin UI at `/admin/cloud-services` to manage system connection
2. Implement file upload logic that uses `getCloudStorageConnection()`
3. Add storage quota management
4. Implement file sync between system and user Dropbox accounts


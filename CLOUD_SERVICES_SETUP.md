# Cloud Services Integration Setup

This document explains how to set up OAuth integrations for cloud storage services in the Covion Partners application.

## Overview

The cloud services integration allows users to connect their cloud storage accounts (Google Drive, Dropbox, OneDrive, Box) to seamlessly sync and manage files across platforms.

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Google Drive OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Dropbox OAuth
DROPBOX_CLIENT_ID=your_dropbox_client_id_here
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret_here

# OneDrive OAuth
ONEDRIVE_CLIENT_ID=your_onedrive_client_id_here
ONEDRIVE_CLIENT_SECRET=your_onedrive_client_secret_here

# Box OAuth
BOX_CLIENT_ID=your_box_client_id_here
BOX_CLIENT_SECRET=your_box_client_secret_here

# Site URL for OAuth redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## OAuth App Setup Instructions

### Google Drive

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/cloud-services/callback/google-drive` (development)
   - `https://yourdomain.com/api/cloud-services/callback/google-drive` (production)
6. Copy the Client ID and Client Secret to your environment variables

### Dropbox

1. Go to the [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app
3. Choose "Scoped access" and "Full Dropbox" or "App folder"
4. Add redirect URI:
   - `http://localhost:3000/api/cloud-services/callback/dropbox` (development)
   - `https://yourdomain.com/api/cloud-services/callback/dropbox` (production)
5. Copy the App key and App secret to your environment variables

### OneDrive

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Create a new registration
4. Add redirect URI:
   - `http://localhost:3000/api/cloud-services/callback/onedrive` (development)
   - `https://yourdomain.com/api/cloud-services/callback/onedrive` (production)
5. Generate a client secret
6. Copy the Application (client) ID and client secret to your environment variables

### Box

1. Go to the [Box Developer Console](https://app.box.com/developers/console)
2. Create a new app
3. Choose "Custom App" and "OAuth 2.0 with JWT"
4. Add redirect URI:
   - `http://localhost:3000/api/cloud-services/callback/box` (development)
   - `https://yourdomain.com/api/cloud-services/callback/box` (production)
5. Copy the Client ID and Client Secret to your environment variables

## Database Setup

Run the migration to create the required tables:

```bash
# Apply the cloud services migration
supabase db push
```

## Features

### Main Cloud Services Page (`/cloud-services`)

- View all available cloud services
- Connect/disconnect services
- See connection status and account information
- Access service management pages

### Service Management Pages (`/cloud-services/[serviceId]`)

- View account information and permissions
- Monitor sync activity and logs
- Browse synced files
- Trigger manual sync operations

### API Endpoints

- `GET /api/cloud-services/connections` - Get user's connected services
- `POST /api/cloud-services/connect/[serviceId]` - Initiate OAuth flow
- `DELETE /api/cloud-services/disconnect/[serviceId]` - Disconnect service
- `GET /api/cloud-services/[serviceId]/sync-logs` - Get sync history
- `GET /api/cloud-services/[serviceId]/files` - Get synced files
- `POST /api/cloud-services/[serviceId]/sync` - Trigger manual sync

## Security Features

- OAuth 2.0 authentication with secure token storage
- Row Level Security (RLS) policies for data isolation
- Token refresh handling for long-lived access
- Secure token revocation on disconnect
- State parameter validation for OAuth flows

## File Sync Capabilities

- Automatic file discovery and indexing
- Change detection using file hashes
- Incremental sync support
- Error handling and retry logic
- Sync status tracking and logging

## Usage

1. Users navigate to `/cloud-services`
2. Click "Connect" on their desired service
3. Complete OAuth flow in popup/redirect
4. Service is automatically connected and ready for use
5. Files can be synced manually or automatically
6. Users can manage connections and view sync status

## Troubleshooting

### Common Issues

1. **OAuth redirect mismatch**: Ensure redirect URIs match exactly in OAuth app settings
2. **Token expiration**: Implement refresh token logic for long-lived access
3. **Rate limiting**: Add proper rate limiting and retry logic for API calls
4. **File sync errors**: Check file permissions and API quotas

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=cloud-services:*
```

## Future Enhancements

- Real-time file sync with webhooks
- File preview and editing capabilities
- Bulk file operations
- Advanced sync filters and rules
- Team sharing and collaboration features

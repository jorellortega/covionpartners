# Guest Account System

## Overview

The Guest Account System allows organizations to create temporary access codes for external users without requiring them to create full accounts. Guests can access organization resources based on permissions set by the organization administrators.

## Features

### For Organizations
- **Create Guest Codes**: Generate unique 6-character codes for guest access
- **Manage Permissions**: Set granular permissions for what guests can do
- **Track Usage**: Monitor how many times each code has been used
- **Status Management**: Control guest account status (active, paused, frozen, dropped)
- **Expiration Dates**: Set automatic expiration for guest codes
- **Activity Logging**: Track all guest activities and interactions

### For Guests
- **Easy Access**: Enter a code and name to access organization
- **No Registration**: No email/password required
- **Limited Permissions**: Access only what the organization allows
- **Session Management**: Access remains active until browser is closed or revoked

## Database Schema

### Tables Created

1. **`guest_accounts`** - Stores individual guest user information
2. **`organization_guest_codes`** - Stores organization-created access codes
3. **`guest_activities`** - Logs all guest activities and interactions

### Key Fields

#### Guest Accounts
- `guest_code`: Unique 6-character access code
- `display_name`: Guest's display name
- `status`: Account status (active, paused, frozen, dropped)
- `permissions`: JSON object defining what guest can do
- `expires_at`: Optional expiration date
- `last_activity`: Timestamp of last activity

#### Organization Guest Codes
- `code`: The 6-character access code
- `name`: Human-readable name for the code
- `max_uses`: Maximum number of times code can be used (-1 for unlimited)
- `current_uses`: Current usage count
- `is_active`: Whether code is currently active
- `permissions`: Default permissions for guests using this code

## API Endpoints

### Guest Access
- `POST /api/guest-access` - Access organization with guest code
- `GET /api/guest-access` - Validate guest access

### Guest Management
- `GET /api/guest-accounts` - List guest accounts for organization
- `POST /api/guest-accounts` - Create new guest account
- `PUT /api/guest-accounts` - Update guest account
- `DELETE /api/guest-accounts` - Delete guest account

### Guest Codes
- `GET /api/guest-codes` - List guest codes for organization
- `POST /api/guest-codes` - Create new guest code
- `PUT /api/guest-codes` - Update guest code
- `DELETE /api/guest-codes` - Delete guest code

## Permissions System

Guests can have the following permissions:

```typescript
interface GuestPermissions {
  can_upload?: boolean;           // Upload files
  can_message?: boolean;          // Send messages
  can_view_projects?: boolean;    // View projects
  can_view_files?: boolean;       // View files
  can_comment?: boolean;          // Add comments
  can_download?: boolean;         // Download files
  max_upload_size?: number;       // Maximum file upload size (bytes)
  max_daily_uploads?: number;     // Daily upload limit
  max_daily_messages?: number;    // Daily message limit
  allowed_file_types?: string[];  // Allowed file extensions
  restricted_projects?: string[]; // Project IDs that are restricted
  allowed_projects?: string[];    // Project IDs that are allowed
}
```

## Usage Flow

### For Organization Administrators

1. **Access Guest Management**
   - Navigate to `/guest-management`
   - Select your organization

2. **Create Guest Code**
   - Click "Create Guest Code"
   - Set code name and description
   - Configure permissions and limits
   - Set expiration date (optional)

3. **Share Code**
   - Copy the generated 6-character code
   - Share with external users via email, messaging, etc.

4. **Monitor Usage**
   - View guest accounts and their status
   - Track activity logs
   - Manage guest permissions and status

### For Guests

1. **Access Organization**
   - Navigate to `/guest-access`
   - Enter the 6-character guest code
   - Provide your name and optional contact info

2. **Use Organization Resources**
   - Access allowed projects and files
   - Upload files (if permitted)
   - Send messages (if permitted)
   - Download content (if permitted)

3. **Session Management**
   - Access remains active until browser is closed
   - Organization can revoke access at any time
   - Automatic expiration based on code settings

## Security Features

- **Unique Codes**: 6-character alphanumeric codes with collision detection
- **Usage Limits**: Configurable maximum uses per code
- **Expiration**: Automatic expiration dates for codes and accounts
- **Activity Logging**: Complete audit trail of guest activities
- **Status Control**: Multiple status levels for fine-grained control
- **Permission Granularity**: Detailed permission system for different actions

## Integration Points

The guest account system integrates with:

- **File Upload System**: Respects guest upload permissions and limits
- **Messaging System**: Allows guests to send messages based on permissions
- **Project Access**: Controls which projects guests can view
- **Activity Tracking**: Logs all guest interactions for audit purposes

## Future Enhancements

Potential improvements for the guest account system:

1. **Bulk Code Generation**: Create multiple codes at once
2. **Advanced Analytics**: Detailed usage analytics and reporting
3. **Email Notifications**: Notify admins of guest activities
4. **Temporary Links**: Generate shareable links instead of codes
5. **Guest Profiles**: Allow guests to create basic profiles
6. **Integration APIs**: Webhook support for external integrations

## Migration Notes

The system automatically creates default guest codes for existing organizations when the migration runs. These codes can be customized or replaced as needed.

## Support

For questions or issues with the guest account system, refer to the API documentation or contact the development team. 
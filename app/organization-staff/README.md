# Organization Staff Management

This page allows organization owners and admins to manage team members within their organizations with different roles and permissions.

## Features

### Role-Based Access Control
- **Owner**: Full control over the organization (cannot be edited/deleted)
- **Admin**: Can manage organization and members
- **Manager**: Can manage projects and teams
- **Member**: Full access to projects
- **Viewer**: Read-only access

### Staff Management
- Add new staff members by email address
- Edit existing staff member roles and status
- Remove staff members (with proper permissions)
- Search and filter staff members
- View staff member details including avatar, name, email, and role

### Security
- Only organization owners and admins can manage staff
- Users cannot edit or delete themselves
- Proper role-based permissions for editing and deleting
- API endpoints with authentication and authorization checks

## Usage

### Adding Staff Members
1. Select your organization from the dropdown
2. Click "Add Staff Member"
3. Enter the user's email address
4. Select the appropriate role
5. Choose the status (Active, Pending, or Inactive)
6. Click "Add Staff Member"

### Editing Staff Members
1. Find the staff member in the list
2. Click the edit (pencil) icon
3. Modify the role and/or status
4. Click "Update Staff Member"

### Removing Staff Members
1. Find the staff member in the list
2. Click the delete (trash) icon
3. Confirm the removal

### Searching Staff
- Use the search bar to find staff members by name or email
- Results are filtered in real-time

## API Endpoints

### GET /api/organizations/staff
- Fetches organization staff members
- Query parameters: `organizationId`, `search` (optional)

### POST /api/organizations/staff
- Adds a new staff member
- Body: `{ organizationId, email, role, status }`

### PUT /api/organizations/staff
- Updates an existing staff member
- Body: `{ memberId, role, status }`

### DELETE /api/organizations/staff
- Removes a staff member
- Query parameter: `memberId`

## Database Schema

The feature uses the existing `team_members` table with the `organization_id` field to associate team members with organizations:

```sql
team_members (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  joined_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Permissions Matrix

| Role | Can Add | Can Edit | Can Delete | Can View |
|------|---------|----------|------------|----------|
| Owner | ✅ | ✅ (except self) | ✅ (except self) | ✅ |
| Admin | ✅ | ✅ (managers, members, viewers) | ✅ (managers, members, viewers) | ✅ |
| Manager | ❌ | ❌ | ❌ | ✅ |
| Member | ❌ | ❌ | ❌ | ✅ |
| Viewer | ❌ | ❌ | ❌ | ✅ |

## Styling

The page uses the existing design system with:
- Leonardo card styling
- Dark theme with cyan accents
- Responsive design
- Icon-based role indicators
- Status badges
- Avatar components for user profiles 
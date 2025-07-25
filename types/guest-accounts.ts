export interface GuestAccount {
  id: string;
  organization_id: string;
  guest_code: string;
  display_name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'paused' | 'frozen' | 'dropped';
  permissions: GuestPermissions;
  last_activity?: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationGuestCode {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  max_uses: number; // -1 means unlimited
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  permissions: GuestPermissions;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuestActivity {
  id: string;
  guest_account_id: string;
  activity_type: string;
  resource_type?: string;
  resource_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface GuestPermissions {
  can_upload?: boolean;
  can_message?: boolean;
  can_view_projects?: boolean;
  can_view_files?: boolean;
  can_comment?: boolean;
  can_download?: boolean;
  max_upload_size?: number; // in bytes
  max_daily_uploads?: number;
  max_daily_messages?: number;
  allowed_file_types?: string[];
  restricted_projects?: string[]; // project IDs that are restricted
  allowed_projects?: string[]; // project IDs that are allowed (if empty, all allowed)
}

export interface CreateGuestCodeRequest {
  organization_id: string;
  name: string;
  description?: string;
  max_uses?: number;
  expires_at?: string;
  permissions?: GuestPermissions;
}

export interface UpdateGuestCodeRequest {
  name?: string;
  description?: string;
  max_uses?: number;
  is_active?: boolean;
  expires_at?: string;
  permissions?: GuestPermissions;
}

export interface CreateGuestAccountRequest {
  organization_id: string;
  guest_code: string;
  display_name: string;
  email?: string;
  phone?: string;
  permissions?: GuestPermissions;
  expires_at?: string;
}

export interface UpdateGuestAccountRequest {
  display_name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'paused' | 'frozen' | 'dropped';
  permissions?: GuestPermissions;
  expires_at?: string;
}

export interface GuestAccessRequest {
  code: string;
  display_name: string;
  email?: string;
  phone?: string;
}

export interface GuestAccessResponse {
  success: boolean;
  guest_account?: GuestAccount;
  organization?: {
    id: string;
    name: string;
  };
  error?: string;
}

export interface GuestStats {
  total_guests: number;
  active_guests: number;
  paused_guests: number;
  frozen_guests: number;
  dropped_guests: number;
  total_activities: number;
  recent_activities: GuestActivity[];
}

export interface GuestCodeStats {
  total_codes: number;
  active_codes: number;
  total_uses: number;
  codes: OrganizationGuestCode[];
} 
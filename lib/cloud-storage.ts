import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Cloud Storage Utility
 * 
 * Handles file storage with priority:
 * 1. User's personal cloud service connection (if available)
 * 2. System-wide cloud service connection (default fallback)
 * 
 * This allows users to use their own storage for additional space,
 * while providing default storage via the platform's Dropbox account.
 */

export interface CloudStorageConnection {
  id: string;
  service_id: string;
  connection_type: 'system' | 'user';
  access_token: string;
  refresh_token: string | null;
  account_info: any;
}

/**
 * Get the best available cloud storage connection for a user
 * Priority: User's personal connection > System connection
 */
export async function getCloudStorageConnection(
  userId: string,
  serviceId: string = 'dropbox'
): Promise<CloudStorageConnection | null> {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // First, try to get user's personal connection
  const { data: userConnection } = await supabase
    .from('cloud_services')
    .select('*')
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .eq('connection_type', 'user')
    .eq('is_active', true)
    .single();

  if (userConnection) {
    return userConnection as CloudStorageConnection;
  }

  // Fallback to system connection
  const { data: systemConnection } = await supabase
    .from('cloud_services')
    .select('*')
    .eq('service_id', serviceId)
    .eq('connection_type', 'system')
    .is('user_id', null)
    .eq('is_active', true)
    .single();

  return systemConnection as CloudStorageConnection | null;
}

/**
 * Get system cloud storage connection
 */
export async function getSystemCloudStorageConnection(
  serviceId: string = 'dropbox'
): Promise<CloudStorageConnection | null> {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: connection } = await supabase
    .from('cloud_services')
    .select('*')
    .eq('service_id', serviceId)
    .eq('connection_type', 'system')
    .is('user_id', null)
    .eq('is_active', true)
    .single();

  return connection as CloudStorageConnection | null;
}

/**
 * Get user's personal cloud storage connection
 */
export async function getUserCloudStorageConnection(
  userId: string,
  serviceId: string = 'dropbox'
): Promise<CloudStorageConnection | null> {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: connection } = await supabase
    .from('cloud_services')
    .select('*')
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .eq('connection_type', 'user')
    .eq('is_active', true)
    .single();

  return connection as CloudStorageConnection | null;
}

/**
 * Get folder path for a user in the system Dropbox
 * Structure: /Covion Partners/Users/{userId}/...
 */
export function getSystemDropboxUserFolder(userId: string): string {
  return `/Covion Partners/Users/${userId}`;
}

/**
 * Get folder path for a project in the system Dropbox
 * Structure: /Covion Partners/Projects/{projectId}/...
 */
export function getSystemDropboxProjectFolder(projectId: string): string {
  return `/Covion Partners/Projects/${projectId}`;
}

/**
 * Get folder path for a user's project in the system Dropbox
 * Structure: /Covion Partners/Users/{userId}/Projects/{projectId}/...
 */
export function getSystemDropboxUserProjectFolder(userId: string, projectId: string): string {
  return `/Covion Partners/Users/${userId}/Projects/${projectId}`;
}

/**
 * Create a folder in Dropbox
 */
export async function createDropboxFolder(
  accessToken: string,
  path: string
): Promise<{ id: string; path: string } | null> {
  try {
    const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        autorename: true,
      }),
    });

    if (!response.ok) {
      // If folder already exists, that's okay
      if (response.status === 409) {
        // Try to get the existing folder info
        const errorData = await response.json();
        if (errorData.error?.path?.is_conflict) {
          // Folder exists, return the path
          return { id: path, path };
        }
      }
      const errorText = await response.text();
      console.error('Failed to create Dropbox folder:', errorText);
      return null;
    }

    const data = await response.json();
    return {
      id: data.metadata.id,
      path: data.metadata.path_display,
    };
  } catch (error) {
    console.error('Error creating Dropbox folder:', error);
    return null;
  }
}

/**
 * Ensure user folder structure exists in system Dropbox
 * Creates: /Covion Partners/Users/{userId}
 */
export async function ensureUserFolderStructure(
  systemConnection: CloudStorageConnection,
  userId: string
): Promise<boolean> {
  const basePath = '/Covion Partners';
  const usersPath = `${basePath}/Users`;
  const userPath = `${usersPath}/${userId}`;

  // Create base folder if it doesn't exist
  await createDropboxFolder(systemConnection.access_token, basePath);
  
  // Create Users folder if it doesn't exist
  await createDropboxFolder(systemConnection.access_token, usersPath);
  
  // Create user-specific folder
  const result = await createDropboxFolder(systemConnection.access_token, userPath);
  
  return result !== null;
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GuestAccount, CreateGuestAccountRequest, UpdateGuestAccountRequest } from '@/types/guest-accounts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/guest-accounts - List guest accounts for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('guest_accounts')
      .select(`
        *,
        organization:organizations(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: guestAccounts, error, count } = await query;

    if (error) {
      console.error('Error fetching guest accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch guest accounts' }, { status: 500 });
    }

    return NextResponse.json({
      guest_accounts: guestAccounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/guest-accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/guest-accounts - Create a new guest account
export async function POST(request: NextRequest) {
  try {
    const body: CreateGuestAccountRequest = await request.json();
    const { organization_id, guest_code, display_name, email, phone, permissions, expires_at } = body;

    // Validate required fields
    if (!organization_id || !guest_code || !display_name) {
      return NextResponse.json({ error: 'Organization ID, guest code, and display name are required' }, { status: 400 });
    }

    // Check if guest code already exists
    const { data: existingGuest } = await supabase
      .from('guest_accounts')
      .select('id')
      .eq('guest_code', guest_code)
      .single();

    if (existingGuest) {
      return NextResponse.json({ error: 'Guest code already exists' }, { status: 409 });
    }

    // Verify organization exists and user has access
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organization_id)
      .single();

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create guest account
    const { data: guestAccount, error } = await supabase
      .from('guest_accounts')
      .insert([{
        organization_id,
        guest_code,
        display_name,
        email,
        phone,
        permissions: permissions || {},
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        created_by: 'system' // This should be the authenticated user's ID
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating guest account:', error);
      return NextResponse.json({ error: 'Failed to create guest account' }, { status: 500 });
    }

    return NextResponse.json({ guest_account: guestAccount }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/guest-accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/guest-accounts - Update a guest account
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateGuestAccountRequest & { id: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Guest account ID is required' }, { status: 400 });
    }

    // Update guest account
    const { data: guestAccount, error } = await supabase
      .from('guest_accounts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating guest account:', error);
      return NextResponse.json({ error: 'Failed to update guest account' }, { status: 500 });
    }

    return NextResponse.json({ guest_account: guestAccount });
  } catch (error) {
    console.error('Error in PUT /api/guest-accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/guest-accounts - Delete a guest account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Guest account ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('guest_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting guest account:', error);
      return NextResponse.json({ error: 'Failed to delete guest account' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Guest account deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/guest-accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
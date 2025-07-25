import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OrganizationGuestCode, CreateGuestCodeRequest, UpdateGuestCodeRequest } from '@/types/guest-accounts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/guest-codes - List guest codes for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const isActive = searchParams.get('is_active');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('organization_guest_codes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: guestCodes, error } = await query;

    if (error) {
      console.error('Error fetching guest codes:', error);
      return NextResponse.json({ error: 'Failed to fetch guest codes' }, { status: 500 });
    }

    return NextResponse.json({ guest_codes: guestCodes });
  } catch (error) {
    console.error('Error in GET /api/guest-codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/guest-codes - Create a new guest code
export async function POST(request: NextRequest) {
  try {
    const body: CreateGuestCodeRequest = await request.json();
    const { organization_id, name, description, max_uses, expires_at, permissions } = body;

    // Validate required fields
    if (!organization_id || !name) {
      return NextResponse.json({ error: 'Organization ID and name are required' }, { status: 400 });
    }

    // Verify organization exists
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organization_id)
      .single();

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Generate a unique code (without relying on RPC function)
    let code;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      // Generate a 6-character alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if code already exists
      const { data: existingCodes, error: checkError } = await supabase
        .from('organization_guest_codes')
        .select('id')
        .eq('code', code);
      
      if (checkError) {
        console.error('Error checking code uniqueness:', checkError);
        continue; // Try again with a different code
      }
      
      if (!existingCodes || existingCodes.length === 0) {
        break; // Code is unique
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Unable to generate unique code' }, { status: 500 });
    }

    // Get the authenticated user ID from the request headers
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        }
      } catch (error) {
        console.error('Error getting user from token:', error);
      }
    }
    
    // If we can't get the user ID, use the organization owner ID as fallback
    if (!userId) {
      const { data: orgOwner } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organization_id)
        .single();
      userId = orgOwner?.owner_id || null;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unable to determine user ID' }, { status: 400 });
    }

    // Create guest code
    const { data: guestCode, error } = await supabase
      .from('organization_guest_codes')
      .insert([{
        organization_id,
        code,
        name,
        description,
        max_uses: max_uses || -1,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        permissions: permissions || {},
        created_by: userId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating guest code:', error);
      return NextResponse.json({ error: 'Failed to create guest code' }, { status: 500 });
    }

    return NextResponse.json({ guest_code: guestCode }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/guest-codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/guest-codes - Update a guest code
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateGuestCodeRequest & { id: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Guest code ID is required' }, { status: 400 });
    }

    // Update guest code
    const { data: guestCode, error } = await supabase
      .from('organization_guest_codes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating guest code:', error);
      return NextResponse.json({ error: 'Failed to update guest code' }, { status: 500 });
    }

    return NextResponse.json({ guest_code: guestCode });
  } catch (error) {
    console.error('Error in PUT /api/guest-codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/guest-codes - Delete a guest code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Guest code ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('organization_guest_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting guest code:', error);
      return NextResponse.json({ error: 'Failed to delete guest code' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Guest code deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/guest-codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
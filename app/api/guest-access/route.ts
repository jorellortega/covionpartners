import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GuestAccessRequest, GuestAccessResponse } from '@/types/guest-accounts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/guest-access - Access organization with guest code
export async function POST(request: NextRequest) {
  try {
    const body: GuestAccessRequest = await request.json();
    const { code, display_name, email, phone } = body;

    // Validate required fields
    if (!code || !display_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Code and display name are required' 
      }, { status: 400 });
    }

    // Find the guest code
    const { data: guestCode, error: codeError } = await supabase
      .from('organization_guest_codes')
      .select(`
        *,
        organization:organizations(id, name)
      `)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !guestCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or inactive guest code' 
      }, { status: 404 });
    }

    // Check if code has expired
    if (guestCode.expires_at && new Date(guestCode.expires_at) < new Date()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Guest code has expired' 
      }, { status: 410 });
    }

    // Check if max uses exceeded
    if (guestCode.max_uses > 0 && guestCode.current_uses >= guestCode.max_uses) {
      return NextResponse.json({ 
        success: false, 
        error: 'Guest code usage limit exceeded' 
      }, { status: 429 });
    }

    // Check if guest account already exists for this code
    const { data: existingGuest } = await supabase
      .from('guest_accounts')
      .select('*')
      .eq('guest_code', code.toUpperCase())
      .single();

    let guestAccount;

    if (existingGuest) {
      // Update existing guest account
      const { data: updatedGuest, error: updateError } = await supabase
        .from('guest_accounts')
        .update({
          display_name,
          email,
          phone,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGuest.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating guest account:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to update guest account' 
        }, { status: 500 });
      }

      guestAccount = updatedGuest;
    } else {
      // Create new guest account
      const { data: newGuest, error: createError } = await supabase
        .from('guest_accounts')
        .insert([{
          organization_id: guestCode.organization_id,
          guest_code: code.toUpperCase(),
          display_name,
          email,
          phone,
          permissions: guestCode.permissions,
          created_by: guestCode.created_by
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating guest account:', createError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create guest account' 
        }, { status: 500 });
      }

      guestAccount = newGuest;

      // Increment usage count
      await supabase
        .from('organization_guest_codes')
        .update({ 
          current_uses: guestCode.current_uses + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', guestCode.id);
    }

    // Log the access activity
    await supabase.rpc('log_guest_activity', {
      guest_code_param: code.toUpperCase(),
      activity_type_param: 'access',
      resource_type_param: 'organization',
      resource_id_param: guestCode.organization_id,
      metadata_param: { action: 'login', display_name, email, phone }
    });

    const response: GuestAccessResponse = {
      success: true,
      guest_account: guestAccount,
      organization: {
        id: guestCode.organization.id,
        name: guestCode.organization.name
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/guest-access:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET /api/guest-access - Validate guest access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Guest code is required' 
      }, { status: 400 });
    }

    // Check if guest account exists and is active
    const { data: guestAccount, error } = await supabase
      .from('guest_accounts')
      .select(`
        *,
        organization:organizations(id, name)
      `)
      .eq('guest_code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (error || !guestAccount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or inactive guest account' 
      }, { status: 404 });
    }

    // Check if account has expired
    if (guestAccount.expires_at && new Date(guestAccount.expires_at) < new Date()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Guest account has expired' 
      }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      guest_account: guestAccount,
      organization: {
        id: guestAccount.organization.id,
        name: guestAccount.organization.name
      }
    });
  } catch (error) {
    console.error('Error in GET /api/guest-access:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 
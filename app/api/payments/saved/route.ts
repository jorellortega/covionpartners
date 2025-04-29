import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return NextResponse.json({ error: 'Session error', details: sessionError }, { status: 401 });
  }
  if (!session) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  const user = session.user;
  if (!user) {
    return NextResponse.json({ error: 'No user in session' }, { status: 401 });
  }

  // Fetch payment methods for this user
  const { data: paymentMethods, error: dbError } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: 'Failed to fetch payment methods', details: dbError }, { status: 500 });
  }

  // Map to frontend-friendly format
  const result = (paymentMethods || []).map(pm => ({
    id: pm.stripe_payment_method_id || pm.id,
    card: {
      brand: pm.card_brand || pm.details?.card?.brand,
      last4: pm.card_last4 || pm.details?.card?.last4,
      exp_month: pm.card_exp_month || pm.details?.card?.exp_month,
      exp_year: pm.card_exp_year || pm.details?.card?.exp_year,
    },
    is_default: pm.is_default,
    type: pm.type,
    status: pm.status,
    created_at: pm.created_at,
  }));

  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return NextResponse.json({ error: 'Session error', details: sessionError }, { status: 401 });
  }
  if (!session) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  const user = session.user;
  if (!user) {
    return NextResponse.json({ error: 'No user in session' }, { status: 401 });
  }

  // Get payment method ID from query string
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing payment method id' }, { status: 400 });
  }

  // Try to update by stripe_payment_method_id first
  let { error: dbError, data } = await supabase
    .from('payment_methods')
    .update({ status: 'inactive' })
    .match({ user_id: user.id, stripe_payment_method_id: id })
    .select('id');

  let count = data ? data.length : 0;

  // If no rows were updated, try by id
  if (!dbError && count === 0) {
    const result2 = await supabase
      .from('payment_methods')
      .update({ status: 'inactive' })
      .match({ user_id: user.id, id: id })
      .select('id');
    dbError = result2.error;
    count = result2.data ? result2.data.length : 0;
  }

  if (dbError) {
    return NextResponse.json({ error: 'Failed to delete payment method', details: dbError }, { status: 500 });
  }
  if (count === 0) {
    return NextResponse.json({ error: 'No payment method found for this user and id' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
} 
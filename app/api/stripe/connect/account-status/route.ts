import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('users')
    .select('stripe_connect_account_id, stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!data?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe Connect account found' }, { status: 400 })
  }

  const account = await stripe.accounts.retrieve(data.stripe_connect_account_id)
  let externalAccount = null;
  if (account.external_accounts && account.external_accounts.data.length > 0) {
    // Only show the first external account for now
    const ext = account.external_accounts.data[0];
    if (ext.object === 'bank_account') {
      externalAccount = {
        bank_name: ext.bank_name,
        last4: ext.last4,
        account_holder_name: ext.account_holder_name,
        account_type: ext.account_type,
        fingerprint: ext.fingerprint,
        id: ext.id,
        object: ext.object,
        status: ext.status,
        country: ext.country,
        currency: ext.currency
      };
    } else {
      // fallback for other types (e.g. card)
      externalAccount = {
        last4: ext.last4,
        fingerprint: ext.fingerprint,
        id: ext.id,
        object: ext.object,
        status: ext.status,
        country: ext.country,
        currency: ext.currency
      };
    }
  }
  return NextResponse.json({
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements: account.requirements,
    stripe_connect_account_id: data.stripe_connect_account_id,
    stripe_customer_id: data.stripe_customer_id,
    external_account: externalAccount
  })
} 
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

function humanizeBalanceTransactionType(t: Stripe.BalanceTransaction.Type): string {
  const map: Partial<Record<Stripe.BalanceTransaction.Type, string>> = {
    charge: 'Payment received',
    payment: 'Payment',
    transfer: 'Transfer in',
    payout: 'Payout to bank',
    adjustment: 'Adjustment',
    refund: 'Refund',
    payment_refund: 'Payment refund',
    stripe_fee: 'Stripe fee',
    application_fee: 'Application fee',
  }
  return map[t] ?? t.replace(/_/g, ' ')
}

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_connect_account_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const customerId = userData.stripe_customer_id;
  const connectId = userData.stripe_connect_account_id;
  const hasCustomer = Boolean(customerId);
  const hasConnect = Boolean(connectId);

  if (!hasCustomer && !hasConnect) {
    return NextResponse.json({ transactions: [], info: 'no_stripe_customer' as const });
  }

  try {
    type UnifiedTx = {
      id: string
      type: string
      amount: number
      currency: string
      status: string
      date: string
      description: string
      source: 'stripe' | 'stripe_connect'
      stripePaymentIntentStatus?: Stripe.PaymentIntent.Status
    };

    const customerPart: UnifiedTx[] = [];

    if (hasCustomer) {
      const invoices = await stripe.invoices.list({
        customer: customerId!,
        limit: 100,
      });
      const charges = await stripe.charges.list({
        customer: customerId!,
        limit: 100,
      });
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId!,
        limit: 100,
      });

      const invoiceTxs = invoices.data
        .filter(inv => inv.status === 'paid' && inv.amount_paid > 0)
        .map(inv => ({
          id: inv.id!,
          type: 'invoice',
          amount: inv.amount_paid / 100,
          currency: inv.currency,
          status: inv.status ?? 'paid',
          date: new Date((inv.status_transitions?.paid_at || inv.created) * 1000).toISOString(),
          description: inv.lines?.data?.[0]?.description || 'Subscription Invoice',
          source: 'stripe' as const,
        }));

      const chargeTxs = charges.data.map(ch => ({
        id: ch.id,
        type: 'charge',
        amount: ch.amount / 100 * (ch.refunded ? -1 : 1),
        currency: ch.currency,
        status: ch.status,
        date: new Date(ch.created * 1000).toISOString(),
        description: ch.description || 'Stripe Charge',
        source: 'stripe' as const,
      }));

      const chargePaymentIntentIds = new Set(
        charges.data
          .map((ch) => {
            const pi = ch.payment_intent
            return typeof pi === 'string' ? pi : pi?.id
          })
          .filter((id): id is string => Boolean(id))
      );

      function displayStatusForPaymentIntent(stripeStatus: Stripe.PaymentIntent.Status): string {
        if (stripeStatus === 'succeeded') return 'completed'
        if (stripeStatus === 'processing') return 'processing'
        if (stripeStatus === 'canceled') return 'canceled'
        if (stripeStatus === 'requires_action') return 'needs_authentication'
        if (
          stripeStatus === 'requires_payment_method' ||
          stripeStatus === 'requires_confirmation' ||
          stripeStatus === 'requires_capture'
        ) {
          return 'incomplete'
        }
        return stripeStatus
      }

      const paymentIntentTxs = paymentIntents.data
        .filter((pi) => {
          if (pi.status === 'succeeded' && chargePaymentIntentIds.has(pi.id)) return false
          return true
        })
        .map((pi) => ({
          id: pi.id,
          type: 'payment_intent',
          amount: pi.amount / 100,
          currency: pi.currency,
          status: displayStatusForPaymentIntent(pi.status),
          stripePaymentIntentStatus: pi.status,
          date: new Date(pi.created * 1000).toISOString(),
          description: pi.description || `Payment intent (${pi.status})`,
          source: 'stripe' as const,
        }));

      customerPart.push(
        ...invoiceTxs,
        ...chargeTxs.filter(ch =>
          !invoices.data.some(inv => (inv as { charge?: string | null }).charge === ch.id)
        ),
        ...paymentIntentTxs,
      );
    }

    const connectPart: UnifiedTx[] = [];

    if (hasConnect) {
      const balanceTxns = await stripe.balanceTransactions.list(
        { limit: 100 },
        { stripeAccount: connectId! }
      );

      const nowUnix = Math.floor(Date.now() / 1000);

      for (const bt of balanceTxns.data) {
        const usd = bt.amount / 100;
        const isPending = bt.status === 'pending' || bt.available_on > nowUnix;
        const isCredit = usd >= 0;
        connectPart.push({
          id: `bt_${bt.id}`,
          type: isCredit ? 'connect_incoming' : 'refund',
          amount: Math.abs(usd),
          currency: bt.currency,
          status: isPending ? 'pending' : 'completed',
          date: new Date(bt.created * 1000).toISOString(),
          description:
            bt.description?.trim() ||
            `${humanizeBalanceTransactionType(bt.type)}${bt.type === 'transfer' ? ' (partner payout)' : ''}`,
          source: 'stripe_connect',
        });
      }
    }

    const allTxs = [...customerPart, ...connectPart].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (allTxs.length === 0) {
      if (!hasCustomer && hasConnect) {
        return NextResponse.json({ transactions: [], info: 'connect_only_empty' as const });
      }
      if (hasCustomer && !hasConnect) {
        return NextResponse.json({ transactions: [], info: 'stripe_customer_empty' as const });
      }
      return NextResponse.json({ transactions: [], info: 'no_activity' as const });
    }

    return NextResponse.json({ transactions: allTxs });
  } catch (err) {
    console.error('Stripe fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch Stripe transactions' }, { status: 500 });
  }
}

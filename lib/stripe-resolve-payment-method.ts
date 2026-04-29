import type Stripe from 'stripe'

/**
 * Pick a saved chargeable PaymentMethod for a Stripe Customer:
 * invoice default, else first card, else first US bank account.
 */
export async function resolvePaymentMethodIdForCustomer(
  stripe: Stripe,
  customerId: string
): Promise<{ id: string; type: Stripe.PaymentMethod.Type } | null> {
  const customer = await stripe.customers.retrieve(customerId, {
    expand: ['invoice_settings.default_payment_method'],
  })
  if (typeof customer === 'string' || customer.deleted) return null
  const d = customer.invoice_settings?.default_payment_method
  if (d && typeof d !== 'string') {
    const pm = d as Stripe.PaymentMethod
    return { id: pm.id, type: pm.type }
  }
  if (typeof d === 'string') {
    const pm = await stripe.paymentMethods.retrieve(d)
    return { id: pm.id, type: pm.type }
  }
  const cards = await stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 })
  if (cards.data[0]) return { id: cards.data[0].id, type: 'card' }
  const banks = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'us_bank_account',
    limit: 1,
  })
  if (banks.data[0]) return { id: banks.data[0].id, type: 'us_bank_account' }
  return null
}

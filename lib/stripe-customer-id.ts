/** Rejects empty/placeholder DB values; Stripe Customer ids always start with `cus_`. */
export function isValidStripeCustomerId(id: string | null | undefined): id is string {
  if (id == null) return false
  const t = id.trim()
  if (!t) return false
  if (/^(null|undefined)$/i.test(t)) return false
  return t.startsWith('cus_')
}

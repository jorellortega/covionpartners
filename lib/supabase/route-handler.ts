import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Supabase client for App Router Route Handlers.
 *
 * `createRouteHandlerClient` calls `cookies()` synchronously and expects a
 * `ReadonlyRequestCookies` with `.get()`. In Next.js 15, `cookies()` is async,
 * so we await once and pass a function that returns the resolved store.
 */
export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies()
  return createRouteHandlerClient({
    cookies: () => cookieStore,
  })
}

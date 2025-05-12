import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Remove Supabase session check and redirect for /feed
  return res
}

export const config = {
  matcher: [], // No routes are protected by middleware now
} 
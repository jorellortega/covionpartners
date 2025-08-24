import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ message: 'Failed to fetch projects', error }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

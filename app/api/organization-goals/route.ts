import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 })
  }

  try {
            const { data, error } = await supabase
          .from('organization_goals')
          .select(`
            *,
            projects!project_id(id, name, description)
          `)
          .eq('organization_id', organizationId)
          .order('target_date', { ascending: true })

    if (error) {
      return NextResponse.json({ message: 'Failed to fetch goals', error }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching organization goals:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log('POST /api/organization-goals called')
  
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.log('Session error:', sessionError)
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 400 }
      )
    }

    const { title, description, target_date, priority, category, project_id, organization_id } = await request.json()

    console.log('Received goal data:', { title, description, target_date, priority, category, project_id, organization_id })

    if (!title || !organization_id) {
      return NextResponse.json(
        { message: 'Title and organization ID are required' },
        { status: 400 }
      )
    }

    // Verify user has permission to create goals in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', organization_id)
      .eq('user_id', session.user.id)
      .single()

    console.log('User access check for goals:', { userAccess, accessError, userId: session.user.id, orgId: organization_id })

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organization_id)
        .single()

      console.log('Owner check for goals:', { orgOwner, ownerError, isOwner: orgOwner?.owner_id === session.user.id })

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const insertData = {
      title,
      description,
      target_date: target_date || null,
      priority: priority || 'medium',
      category: category || 'strategic',
      project_id: project_id === 'no-project' ? null : project_id,
      organization_id,
      status: 'active'
    }

    console.log('Attempting to insert goal with data:', insertData)

    const { data, error } = await supabase
      .from('organization_goals')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('Error creating organization goal:', error)
      return NextResponse.json(
        { message: 'Failed to create goal', error: error.message, details: error.details },
        { status: 500 }
      )
    }

    console.log('Goal created successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error in organization goal creation:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { message: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Get the goal to check organization
    const { data: existingGoal, error: fetchError } = await supabase
      .from('organization_goals')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { message: 'Goal not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to update goals in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', existingGoal.organization_id)
      .eq('user_id', session.user.id)
      .single()

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', existingGoal.organization_id)
        .single()

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('organization_goals')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization goal:', error)
      return NextResponse.json(
        { message: 'Failed to update goal' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in organization goal update:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // Get the goal to check organization
    const { data: existingGoal, error: fetchError } = await supabase
      .from('organization_goals')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { message: 'Goal not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to delete goals in this organization
    const { data: userAccess, error: accessError } = await supabase
      .from('organization_staff')
      .select('access_level')
      .eq('organization_id', existingGoal.organization_id)
      .eq('user_id', session.user.id)
      .single()

    if (accessError || !userAccess || userAccess.access_level < 4) {
      // Check if user is organization owner
      const { data: orgOwner, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', existingGoal.organization_id)
        .single()

      if (ownerError || orgOwner?.owner_id !== session.user.id) {
        return NextResponse.json(
          { message: 'Unauthorized - Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('organization_goals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting organization goal:', error)
      return NextResponse.json(
        { message: 'Failed to delete goal' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error in organization goal deletion:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

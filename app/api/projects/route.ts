import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  console.log('[DEBUG] GET /api/projects - organizationId:', organizationId)

  if (!organizationId) {
    console.log('[DEBUG] GET /api/projects - Missing organizationId')
    return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 })
  }

  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[DEBUG] GET /api/projects - Auth error or no user:', authError)
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    console.log('[DEBUG] GET /api/projects - User ID:', user.id)

    // Method 1: Fetch projects directly linked to organization
    const { data: orgProjects, error: orgError } = await supabase
      .from('projects')
      .select('id, name, description, organization_id, owner_id')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (orgError) {
      console.error('[DEBUG] GET /api/projects - Error fetching org projects:', orgError)
    } else {
      console.log('[DEBUG] GET /api/projects - Org projects found:', orgProjects?.length || 0)
      console.log('[DEBUG] GET /api/projects - Org projects:', orgProjects?.map(p => ({ id: p.id, name: p.name, org_id: p.organization_id })))
    }

    // Method 2: Fetch projects where user is owner (might have organization_id or not)
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('id, name, description, organization_id, owner_id')
      .eq('owner_id', user.id)
      .order('name', { ascending: true })

    if (ownedError) {
      console.error('[DEBUG] GET /api/projects - Error fetching owned projects:', ownedError)
    } else {
      console.log('[DEBUG] GET /api/projects - Owned projects found:', ownedProjects?.length || 0)
      console.log('[DEBUG] GET /api/projects - Owned projects:', ownedProjects?.map(p => ({ id: p.id, name: p.name, org_id: p.organization_id })))
    }

    // Method 3: Fetch projects where user is a team member
    const { data: teamMemberships, error: teamError } = await supabase
      .from('team_members')
      .select('project_id')
      .eq('user_id', user.id)

    if (teamError) {
      console.error('[DEBUG] GET /api/projects - Error fetching team memberships:', teamError)
    } else {
      console.log('[DEBUG] GET /api/projects - Team memberships found:', teamMemberships?.length || 0)
    }

    let memberProjects: any[] = []
    if (teamMemberships && teamMemberships.length > 0) {
      const projectIds = teamMemberships.map(tm => tm.project_id)
      console.log('[DEBUG] GET /api/projects - Team project IDs:', projectIds)

      const { data: teamProjectsData, error: teamProjectsError } = await supabase
        .from('projects')
        .select('id, name, description, organization_id, owner_id')
        .in('id', projectIds)
        .order('name', { ascending: true })

      if (teamProjectsError) {
        console.error('[DEBUG] GET /api/projects - Error fetching team projects:', teamProjectsError)
      } else {
        memberProjects = teamProjectsData || []
        console.log('[DEBUG] GET /api/projects - Team projects found:', memberProjects.length)
        console.log('[DEBUG] GET /api/projects - Team projects:', memberProjects.map(p => ({ id: p.id, name: p.name, org_id: p.organization_id })))
      }
    }

    // Combine all projects and remove duplicates
    const allProjects = [
      ...(orgProjects || []),
      ...(ownedProjects || []),
      ...memberProjects
    ]

    // Deduplicate by project ID
    const uniqueProjects = allProjects.filter((project, index, self) =>
      index === self.findIndex(p => p.id === project.id)
    )

    console.log('[DEBUG] GET /api/projects - Total unique projects:', uniqueProjects.length)
    console.log('[DEBUG] GET /api/projects - Final projects:', uniqueProjects.map(p => ({ id: p.id, name: p.name, org_id: p.organization_id })))

    // Return only id, name, description for consistency
    const result = uniqueProjects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[DEBUG] GET /api/projects - Unexpected error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

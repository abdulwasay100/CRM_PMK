import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, createLead, getLeads, convertLead, autoAssignLeadsToGroups, autoCreateGroupsFromLeads, createNotification } from '@/lib/database'

export async function GET() {
  await initializeDatabase()
  const leads = await getLeads()
  
  const response = NextResponse.json({ leads })
  
  // Add caching headers for faster loading
  response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59')
  
  return response
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase()
    const body = await req.json()
    if (!body.full_name) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
    }
    const result = await createLead(body)
    // If created with status Converted, also insert into converted_leads
    try {
      if ((body.lead_status || '').toLowerCase() === 'converted') {
        await convertLead(Number(result.id))
      }
    } catch {}
    
    // Auto-create groups based on new lead data and assign leads
    try {
      const groupsCreated = await autoCreateGroupsFromLeads()
      await autoAssignLeadsToGroups()
      
      // Create notification for auto-group creation if groups were created
      if (groupsCreated > 0) {
        await createNotification({
          type: 'reports',
          title: `Auto-Groups Created`,
          message: `${groupsCreated} new groups were automatically created based on lead data`,
          meta: {
            groupsCreated: groupsCreated,
            leadId: result.id,
            leadName: body.full_name
          }
        })
      }
    } catch {}
    
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}



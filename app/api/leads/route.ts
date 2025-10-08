import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, createLead, getLeads, convertLead } from '@/lib/database'

export async function GET() {
  await initializeDatabase()
  const leads = await getLeads()
  return NextResponse.json({ leads })
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
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}



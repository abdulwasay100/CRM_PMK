import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, convertLead } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase()
    const { leadId } = await req.json()
    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    const res = await convertLead(Number(leadId))
    if (!res.success) return NextResponse.json(res, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to convert lead' }, { status: 500 })
  }
}



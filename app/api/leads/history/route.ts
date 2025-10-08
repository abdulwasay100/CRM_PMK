import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, addLeadHistory, getLeadHistory } from '@/lib/database'

export async function GET(req: NextRequest) {
  await initializeDatabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const rows = await getLeadHistory(Number(id))
  return NextResponse.json({ history: rows })
}

export async function POST(req: NextRequest) {
  await initializeDatabase()
  const { leadId, action, details } = await req.json()
  if (!leadId || !action) return NextResponse.json({ error: 'leadId and action required' }, { status: 400 })
  const res = await addLeadHistory(Number(leadId), String(action), details ? String(details) : undefined)
  return NextResponse.json({ id: res.id }, { status: 201 })
}



import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, updateLead, deleteLead } from '@/lib/database'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await initializeDatabase()
  const id = Number(params.id)
  const body = await req.json()
  const res = await updateLead(id, body)
  return NextResponse.json({ success: true, ...res })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await initializeDatabase()
  const id = Number(params.id)
  const res = await deleteLead(id)
  return NextResponse.json({ success: true, ...res })
}



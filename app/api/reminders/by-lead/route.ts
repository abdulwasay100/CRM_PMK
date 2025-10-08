import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getRemindersByLead } from '@/lib/database'

export async function GET(req: NextRequest) {
  await initializeDatabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const reminders = await getRemindersByLead(Number(id))
  return NextResponse.json({ reminders })
}



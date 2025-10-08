import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, createReminder, getReminders } from '@/lib/database'

export async function GET() {
  await initializeDatabase()
  const reminders = await getReminders()
  return NextResponse.json({ reminders })
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase()
    const body = await req.json()
    if (!body.lead_id || !body.lead_name || !body.type || !body.due_date) {
      return NextResponse.json({ error: 'lead_id, lead_name, type, due_date required' }, { status: 400 })
    }
    const result = await createReminder(body)
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
  }
}



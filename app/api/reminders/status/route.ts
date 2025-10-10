import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, updateReminderStatus, createNotification, getReminderById } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase()
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    const res = await updateReminderStatus(Number(id), status)
    try {
      const r = await getReminderById(Number(id))
      if (r) {
        await createNotification({
          type: 'reminder_status',
          title: `Reminder ${status}: ${r.lead_name}`,
          message: `${r.type} — ${status}`,
          meta: { reminderId: r.id, leadId: r.lead_id, status }
        })
      }
    } catch {}
    return NextResponse.json({ success: true, ...res })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}



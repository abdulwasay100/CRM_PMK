import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, updateReminderStatus } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase()
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    const res = await updateReminderStatus(Number(id), status)
    return NextResponse.json({ success: true, ...res })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getNotifications, createNotification, markNotificationRead, scanLeadThresholdNotifications, scanDueSoonReminderNotifications } from '@/lib/database'

export async function GET() {
  await initializeDatabase()
  const notifications = await getNotifications(100)
  return NextResponse.json({ notifications })
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase()
    const body = await req.json()
    const result = await createNotification(body)
    return NextResponse.json({ id: result.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initializeDatabase()
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const result = await markNotificationRead(Number(id))
    return NextResponse.json({ affectedRows: result.affectedRows })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    await initializeDatabase()
    await scanLeadThresholdNotifications()
    await scanDueSoonReminderNotifications()
    const notifications = await getNotifications(100)
    return NextResponse.json({ notifications })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to scan notifications' }, { status: 500 })
  }
}



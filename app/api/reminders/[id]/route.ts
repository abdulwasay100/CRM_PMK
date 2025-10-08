import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, deleteReminder } from '@/lib/database'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await initializeDatabase()
  const id = Number(params.id)
  const res = await deleteReminder(id)
  return NextResponse.json({ success: true, ...res })
}



import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getConvertedByLead } from '@/lib/database'

export async function GET(req: NextRequest) {
  await initializeDatabase()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const rows = await getConvertedByLead(Number(id))
  return NextResponse.json({ converted: rows })
}



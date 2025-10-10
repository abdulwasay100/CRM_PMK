import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, status, due_date, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    // Update the reminder in the database
    const result = await db.execute(
      `UPDATE reminders 
       SET type = ?, status = ?, due_date = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [type, status, due_date, notes, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder updated successfully',
      affectedRows: result.affectedRows 
    });

  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getAllGroups, createGroup, updateGroup, deleteGroup, autoAssignLeadsToGroups, autoCreateGroupsFromLeads } from '@/lib/database';

// GET /api/groups - Get all groups
export async function GET(req: NextRequest) {
  try {
    await initializeDatabase();
    const groups = await getAllGroups();
    
    const response = NextResponse.json({ groups });
    
    // Add caching headers for faster loading
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');
    
    return response;
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups - Create new group
export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = await req.json();
    const { name, group_type, criteria, lead_ids } = body;

    if (!name || !group_type || !criteria) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newGroup = await createGroup({
      name,
      group_type,
      criteria,
      lead_ids: lead_ids || []
    });

    // Auto-assign leads to groups after creating new group
    await autoAssignLeadsToGroups();

    return NextResponse.json({ group: newGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

// PUT /api/groups - Update group
export async function PUT(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const result = await updateGroup(id, updateData);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Auto-assign leads to groups after updating
    await autoAssignLeadsToGroups();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/groups - Delete group
export async function DELETE(req: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const result = await deleteGroup(parseInt(id));

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}

// PATCH /api/groups - Auto-assign leads to groups
export async function PATCH(req: NextRequest) {
  try {
    await initializeDatabase();
    const groupsCreated = await autoCreateGroupsFromLeads();
    await autoAssignLeadsToGroups();
    return NextResponse.json({ success: true, groupsCreated });
  } catch (error) {
    console.error('Error auto-assigning leads:', error);
    return NextResponse.json({ error: 'Failed to auto-assign leads' }, { status: 500 });
  }
}

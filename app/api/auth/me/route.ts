import { NextRequest, NextResponse } from 'next/server';
import { findUserById, initializeDatabase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const authCookie = request.cookies.get('auth-token');
    const id = authCookie ? Number(authCookie.value) : NaN;
    if (!authCookie || Number.isNaN(id)) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const user = await findUserById(id);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({ authenticated: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}



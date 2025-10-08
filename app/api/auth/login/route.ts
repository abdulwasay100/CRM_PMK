import { NextRequest, NextResponse } from 'next/server';
import { validateUser, initializeDatabase } from '@/lib/database';

// Login API
export async function POST(request: NextRequest) {
  try {
    // Initialize database on first request
    await initializeDatabase();
    
    const { username, password } = await request.json();

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate user credentials from MySQL
    const user = await validateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create response with user data (without password)
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: { id: user.id, username: user.username }
      },
      { status: 200 }
    );

    // Store user info in cookie for frontend (URL-encoded for safety)
    response.cookies.set('user-info', encodeURIComponent(JSON.stringify({ 
      id: user.id, 
      username: user.username 
    })), {
      httpOnly: false, // Allow frontend to read
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Set session cookie (simple implementation)
    response.cookies.set('auth-token', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

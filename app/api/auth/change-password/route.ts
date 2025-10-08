import { NextRequest, NextResponse } from 'next/server';
import { validateUser, updateUserPassword, initializeDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Initialize database on first request
    await initializeDatabase();
    
    const { username, currentPassword, newPassword } = await request.json();

    // Debug logging
    console.log('Password change API called:', { username, currentPassword: '***', newPassword: '***' });

    // Validate input
    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Username, current password, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify current password
    console.log('Validating user:', username);
    const user = await validateUser(username, currentPassword);
    console.log('User validation result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password in MySQL
    const result = await updateUserPassword(username, newPassword);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Password changed successfully',
      success: true 
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

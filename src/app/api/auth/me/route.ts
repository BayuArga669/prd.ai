import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

interface UserProfileRow {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired session.' },
        { status: 401 }
      );
    }

    // Retrieve fresh user info from database
    const users = await query<UserProfileRow[]>(
      'SELECT id, email, name, avatar_url FROM users WHERE id = ? LIMIT 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User no longer exists.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: users[0],
    });
  } catch (error: unknown) {
    console.error('Auth verification error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error occurred.', details: message },
      { status: 500 }
    );
  }
}

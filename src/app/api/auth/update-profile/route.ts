import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, signToken } from '@/lib/auth';
import { query } from '@/lib/db';

interface UpdateResult {
  affectedRows: number;
}

export async function POST(request: Request) {
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

    const { name, avatarUrl } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required.' },
        { status: 400 }
      );
    }

    // Update user info in DB
    await query<UpdateResult>(
      'UPDATE users SET name = ?, avatar_url = ? WHERE id = ?',
      [name, avatarUrl || null, decoded.userId]
    );

    // Re-sign JWT token with the new name
    const updatedToken = signToken({
      userId: decoded.userId,
      email: decoded.email,
      name: name,
    });

    // Set cookie
    cookieStore.set('session_token', updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: decoded.userId,
        email: decoded.email,
        name,
        avatar_url: avatarUrl || null,
      },
    });
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error occurred.', details: message },
      { status: 500 }
    );
  }
}

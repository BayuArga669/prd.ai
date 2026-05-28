import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

interface UserRow {
  id: number;
  email: string;
  password: string;
  name: string;
  avatar_url: string;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Retrieve user from DB
    const users = await query<UserRow[]>(
      'SELECT id, email, password, name, avatar_url FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Set cookie (Next.js 16 async cookies)
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day in seconds
    });

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error occurred.', details: message },
      { status: 500 }
    );
  }
}

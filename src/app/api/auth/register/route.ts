import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

interface DuplicateUserCheck {
  id: number;
}

interface InsertResult {
  insertId: number;
}

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUsers = await query<DuplicateUserCheck[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = hashPassword(password);
    
    // Set a default initials avatar from a public API
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e040a0&color=fff&bold=true`;

    // Insert user into DB
    const result = await query<InsertResult>(
      'INSERT INTO users (email, password, name, avatar_url) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, avatarUrl]
    );

    const userId = result.insertId;

    // Sign JWT
    const token = signToken({
      userId,
      email,
      name,
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
      message: 'Registration successful',
      user: {
        id: userId,
        email,
        name,
        avatar_url: avatarUrl,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error occurred.', details: message },
      { status: 500 }
    );
  }
}

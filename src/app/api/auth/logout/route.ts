import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear session token by setting expiration in the past
    cookieStore.set('session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    console.error('Logout error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error occurred.', details: message },
      { status: 500 }
    );
  }
}

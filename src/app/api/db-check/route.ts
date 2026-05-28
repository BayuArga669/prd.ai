import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface TestResultRow {
  connectionTest: number;
}

export async function GET() {
  try {
    // Run a simple query to verify the connection
    const result = await query<TestResultRow[]>('SELECT 1 + 1 AS connectionTest');
    
    return NextResponse.json({
      status: 'connected',
      message: 'Database connection verified successfully!',
      data: result[0],
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Database connection verification error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error && typeof error === 'object' && 'code' in error 
      ? String((error as Record<string, unknown>).code)
      : 'UNKNOWN_ERROR';
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed. Please check your credentials in the .env file.',
      error: errorMessage,
      code: errorCode,
    }, { status: 500 });
  }
}

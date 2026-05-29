import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { generateQuestions } from '@/lib/ai';

interface GenerateQuestionsBody {
  productName: string;
  productDescription: string;
  techPreference: 'ai' | 'manual';
  techStack?: string[];
}

/**
 * POST /api/documents/generate-questions
 * Generate AI-powered contextual follow-up questions based on product info.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = (await request.json()) as GenerateQuestionsBody;

    if (!body.productName || !body.productDescription) {
      return NextResponse.json(
        { error: 'productName and productDescription are required' },
        { status: 400 }
      );
    }

    if (!body.techPreference || !['ai', 'manual'].includes(body.techPreference)) {
      return NextResponse.json(
        { error: 'techPreference must be "ai" or "manual"' },
        { status: 400 }
      );
    }

    const questions = await generateQuestions(
      body.productName,
      body.productDescription,
      body.techPreference,
      body.techStack
    );

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    console.error('POST /api/documents/generate-questions error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

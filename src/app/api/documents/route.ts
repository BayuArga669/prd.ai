import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

interface DocumentListRow {
  id: number;
  title: string;
  status: string;
  template_type: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateDocumentBody {
  title: string;
  content?: string;
  status?: string;
  templateType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/documents — List all documents for the authenticated user
 * Supports optional ?limit=N query parameter (default 50)
 */
export async function GET(request: Request) {
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

    const userId = decoded.userId;

    // Parse optional limit from query string
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10) || 50, 500)) : 50;

    const documents = await query<DocumentListRow[]>(
      `SELECT id, title, status, template_type, created_at, updated_at FROM documents WHERE user_id = ? ORDER BY updated_at DESC LIMIT ${limit}`,
      [userId]
    );

    return NextResponse.json({ documents });
  } catch (error: unknown) {
    console.error('GET /api/documents error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents — Create a new document
 * Body: { title, content?, status?, templateType?, metadata? }
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

    const userId = decoded.userId;

    const body = (await request.json()) as CreateDocumentBody;

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const title = body.title.trim();
    const content = body.content ?? null;
    const status = body.status ?? 'Draft';
    const templateType = body.templateType ?? null;
    const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

    const result = await query<ResultSetHeader>(
      'INSERT INTO documents (title, content, status, template_type, metadata, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, status, templateType, metadata, userId]
    );

    const documentId = result.insertId;

    return NextResponse.json(
      {
        document: {
          id: documentId,
          title,
          content,
          status,
          template_type: templateType,
          metadata: body.metadata ?? null,
        },
        message: 'Document created',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('POST /api/documents error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

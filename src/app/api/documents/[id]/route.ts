import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

interface DocumentRow {
  id: number;
  title: string;
  content: string | null;
  status: string;
  template_type: string | null;
  metadata: unknown;
  user_id: number;
  created_at: string;
  updated_at: string;
}

function parseMetadata(metadata: unknown): Record<string, unknown> | null {
  if (!metadata) return null;
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof metadata === 'object') {
    return metadata as Record<string, unknown>;
  }
  return null;
}

interface UpdateDocumentBody {
  title?: string;
  content?: string;
  status?: string;
}

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Authenticate the request and return userId, or an error response.
 */
async function authenticate(): Promise<
  { userId: number; error?: never } | { error: NextResponse; userId?: never }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }
  return { userId: decoded.userId };
}

/**
 * GET /api/documents/[id] — Get a single document belonging to the user
 */
export async function GET(
  _request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const auth = await authenticate();
    if (auth.error) return auth.error;

    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const rows = await query<DocumentRow[]>(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, auth.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = rows[0];

    return NextResponse.json({
      document: {
        ...document,
        metadata: parseMetadata(document.metadata),
      },
    });
  } catch (error: unknown) {
    console.error('GET /api/documents/[id] error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/documents/[id] — Update a document
 * Body: { title?, content?, status? }
 * Builds a dynamic UPDATE query based on provided fields.
 */
export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const auth = await authenticate();
    if (auth.error) return auth.error;

    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const body = (await request.json()) as UpdateDocumentBody;

    // Build dynamic SET clause from provided fields
    const setClauses: string[] = [];
    const values: (string | number)[] = [];

    if (body.title !== undefined) {
      setClauses.push('title = ?');
      values.push(body.title);
    }
    if (body.content !== undefined) {
      setClauses.push('content = ?');
      values.push(body.content);
    }
    if (body.status !== undefined) {
      setClauses.push('status = ?');
      values.push(body.status);
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update' },
        { status: 400 }
      );
    }

    // Add WHERE params
    values.push(documentId, auth.userId);

    const result = await query<ResultSetHeader>(
      `UPDATE documents SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch the updated document
    const rows = await query<DocumentRow[]>(
      'SELECT * FROM documents WHERE id = ? AND user_id = ?',
      [documentId, auth.userId]
    );

    const document = rows[0];

    return NextResponse.json({
      document: {
        ...document,
        metadata: parseMetadata(document.metadata),
      },
      message: 'Document updated',
    });
  } catch (error: unknown) {
    console.error('PUT /api/documents/[id] error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id] — Hard-delete a document
 */
export async function DELETE(
  _request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const auth = await authenticate();
    if (auth.error) return auth.error;

    const documentId = parseInt(id, 10);
    if (isNaN(documentId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
    }

    const result = await query<ResultSetHeader>(
      'DELETE FROM documents WHERE id = ? AND user_id = ?',
      [documentId, auth.userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error: unknown) {
    console.error('DELETE /api/documents/[id] error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

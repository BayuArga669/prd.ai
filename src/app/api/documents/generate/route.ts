import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { generatePRDStream } from '@/lib/ai';
import type { WizardInputs } from '@/lib/ai';
import { ResultSetHeader } from 'mysql2';

interface GenerateRequestBody {
  productName: string;
  productDescription: string;
  primaryGoal: string;
  targetAudience: string;
  platforms: string[];
  features: string[];
  templateType?: string;
}

/**
 * POST /api/documents/generate — Generate a PRD with AI (streaming)
 * Creates a placeholder document, then streams AI-generated content.
 * The document ID is sent as the very first line: __DOC_ID__:<id>\n
 */
export async function POST(request: Request) {
  try {
    console.log('[generate] Received generate request');

    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) {
      console.log('[generate] No session token');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('[generate] Invalid token');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('[generate] User:', userId);

    const body = (await request.json()) as GenerateRequestBody;
    console.log('[generate] Body:', JSON.stringify({ productName: body.productName, features: body.features?.length }));

    // Validate required fields
    const requiredFields: (keyof GenerateRequestBody)[] = [
      'productName',
      'productDescription',
      'primaryGoal',
      'targetAudience',
      'platforms',
      'features',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        console.log('[generate] Missing field:', field);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(body.platforms)) {
      return NextResponse.json(
        { error: 'platforms must be an array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.features)) {
      return NextResponse.json(
        { error: 'features must be an array' },
        { status: 400 }
      );
    }

    // Save a placeholder document to the database
    const title = `${body.productName} PRD`;
    const templateType = body.templateType ?? null;
    const metadata = JSON.stringify({
      productName: body.productName,
      productDescription: body.productDescription,
      primaryGoal: body.primaryGoal,
      targetAudience: body.targetAudience,
      platforms: body.platforms,
      features: body.features,
    });

    const result = await query<ResultSetHeader>(
      'INSERT INTO documents (title, content, status, template_type, metadata, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, null, 'Draft', templateType, metadata, userId]
    );

    const documentId = result.insertId;
    console.log('[generate] Created document:', documentId);

    // Build WizardInputs for the AI module
    const inputs: WizardInputs = {
      productName: body.productName,
      productDescription: body.productDescription,
      primaryGoal: body.primaryGoal,
      targetAudience: body.targetAudience,
      platforms: body.platforms,
      features: body.features,
      templateType: body.templateType,
    };

    const aiStream = await generatePRDStream(inputs);
    console.log('[generate] AI stream obtained, starting response');

    // Create a new stream that prefixes the document ID
    const encoder = new TextEncoder();
    const prefixChunk = encoder.encode(`__DOC_ID__:${documentId}\n`);

    const outputStream = new ReadableStream({
      async start(controller) {
        // Send document ID as first chunk
        controller.enqueue(prefixChunk);

        const reader = aiStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          console.error('[generate] Stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Document-Id': String(documentId),
      },
    });
  } catch (error: unknown) {
    console.error('POST /api/documents/generate error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // OWNER_SETUP_TOKEN is NOT prefixed with NEXT_PUBLIC_ so it stays server-side only
    const expectedToken = process.env.OWNER_SETUP_TOKEN?.trim() || '';

    if (!expectedToken) {
      return NextResponse.json(
        { valid: false, error: 'Setup token is not configured on the server.' },
        { status: 503 }
      );
    }

    const valid = typeof token === 'string' && token.trim() === expectedToken;
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid request.' },
      { status: 400 }
    );
  }
}

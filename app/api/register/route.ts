import { NextResponse } from 'next/server';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://processing-facility-backend.onrender.com';

/** Proxy registration to Express backend (avoids browser CORS). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${apiUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Registration request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    'https://processing-facility-backend.onrender.com';

  try {
    const response = await fetch(`${apiBaseUrl}/api/location`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to load location (${response.status})` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as Array<{
      kabupaten?: string;
      kecamatan?: string;
      desa?: string;
    }>;

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to load location' },
      { status: 500 }
    );
  }
}

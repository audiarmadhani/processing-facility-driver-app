import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('driver_farms')
      .select('id, farm_name, farmer_name, village, district, created_at')
      .order('farm_name');

    if (q) {
      query = query.or(
        `farm_name.ilike.%${q}%,farmer_name.ilike.%${q}%,village.ilike.%${q}%`
      );
    }

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch farms';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { farm_name, farmer_name, village, district } = body as {
    farm_name?: string;
    farmer_name?: string;
    village?: string;
    district?: string;
  };

  if (!farm_name || !farmer_name || !village || !district) {
    return NextResponse.json(
      { message: 'farm_name, farmer_name, village, and district are required.' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('driver_farms')
      .insert({ farm_name, farmer_name, village, district })
      .select('id, farm_name, farmer_name, village, district, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create farm';
    return NextResponse.json({ message }, { status: 500 });
  }
}

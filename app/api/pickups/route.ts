import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('driver_pickups')
      .select(
        `
        id,
        client_id,
        farm_id,
        latitude,
        longitude,
        arrival_timestamp,
        departure_timestamp,
        time_at_farm_minutes,
        estimated_weight,
        species,
        variety,
        road_condition,
        vehicle_used,
        distance_km,
        estimated_fuel_liters,
        notes,
        farm_photo_url,
        pickup_photo_url,
        signature_url,
        sync_status,
        created_at,
        driver_farms ( farm_name, farmer_name, village, district )
      `
      )
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch pickups';
    return NextResponse.json({ message }, { status: 500 });
  }
}

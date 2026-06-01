import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PickupSyncPayload } from '@/types';

async function uploadFile(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || 'image/webp',
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid user id' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const metadataRaw = formData.get('metadata');
    if (!metadataRaw || typeof metadataRaw !== 'string') {
      return NextResponse.json({ message: 'Missing metadata' }, { status: 400 });
    }

    const payload = JSON.parse(metadataRaw) as PickupSyncPayload;
    const supabase = createAdminClient();

    // Idempotent: return existing if client_id already synced
    if (payload.client_id) {
      const { data: existing } = await supabase
        .from('driver_pickups')
        .select('id, farm_id, farm_photo_url, pickup_photo_url, signature_url')
        .eq('client_id', payload.client_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    let farmId = payload.farm_id;

    if (!farmId && payload.farm) {
      const { data: farm, error: farmError } = await supabase
        .from('driver_farms')
        .insert({
          farm_name: payload.farm.farm_name,
          farmer_name: payload.farm.farmer_name,
          village: payload.farm.village,
          district: payload.farm.district,
        })
        .select('id')
        .single();
      if (farmError) throw farmError;
      farmId = farm.id;
    }

    if (!farmId) {
      return NextResponse.json({ message: 'farm_id is required' }, { status: 400 });
    }

    const basePath = `${userId}/${payload.client_id}`;
    const farmPhoto = formData.get('farm_photo') as File | null;
    const pickupPhoto = formData.get('pickup_photo') as File | null;
    const signature = formData.get('signature') as File | null;

    let farm_photo_url: string | undefined;
    let pickup_photo_url: string | undefined;
    let signature_url: string | undefined;

    if (farmPhoto?.size) {
      farm_photo_url = await uploadFile(
        supabase,
        'farm-photos',
        `${basePath}/farm-${Date.now()}.webp`,
        farmPhoto
      );
    }
    if (pickupPhoto?.size) {
      pickup_photo_url = await uploadFile(
        supabase,
        'pickup-photos',
        `${basePath}/pickup-${Date.now()}.webp`,
        pickupPhoto
      );
    }
    if (signature?.size) {
      signature_url = await uploadFile(
        supabase,
        'signatures',
        `${basePath}/signature-${Date.now()}.png`,
        signature
      );
    }

    const { data: pickup, error: pickupError } = await supabase
      .from('driver_pickups')
      .insert({
        client_id: payload.client_id,
        farm_id: farmId,
        created_by: userId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        arrival_timestamp: payload.arrival_timestamp,
        departure_timestamp: payload.departure_timestamp,
        time_at_farm_minutes: payload.time_at_farm_minutes,
        estimated_weight: payload.estimated_weight,
        species: payload.species,
        variety: payload.variety,
        road_condition: payload.road_condition,
        vehicle_used: payload.vehicle_used,
        distance_km: payload.distance_km,
        estimated_fuel_liters: payload.estimated_fuel_liters,
        notes: payload.notes ?? null,
        farm_photo_url: farm_photo_url ?? null,
        pickup_photo_url: pickup_photo_url ?? null,
        signature_url: signature_url ?? null,
        sync_status: 'synced',
      })
      .select('id, farm_id, farm_photo_url, pickup_photo_url, signature_url')
      .single();

    if (pickupError) throw pickupError;

    return NextResponse.json(pickup);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}

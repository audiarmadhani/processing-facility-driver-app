import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PickupSyncPayload } from '@/types';

/** Vercel Hobby caps at 10s; Pro allows up to 60s for photo uploads. */
export const maxDuration = 60;

async function uploadFile(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string,
  file: Blob,
  contentType: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function blobFromFormEntry(entry: FormDataEntryValue | null): Blob | null {
  if (!entry || typeof entry === 'string') return null;
  if (entry.size <= 0) return null;
  return entry;
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
    const farmPhoto = blobFromFormEntry(formData.get('farm_photo'));
    const pickupPhoto = blobFromFormEntry(formData.get('pickup_photo'));
    const signature = blobFromFormEntry(formData.get('signature'));

    const warnings: string[] = [];
    let farm_photo_url: string | undefined;
    let pickup_photo_url: string | undefined;
    let signature_url: string | undefined;

    const uploads: Array<Promise<void>> = [];

    if (farmPhoto) {
      uploads.push(
        uploadFile(
          supabase,
          'farm-photos',
          `${basePath}/farm-${Date.now()}.webp`,
          farmPhoto,
          farmPhoto.type || 'image/webp'
        )
          .then((url) => {
            farm_photo_url = url;
          })
          .catch((e) => {
            warnings.push(
              `Farm photo not saved: ${e instanceof Error ? e.message : 'upload failed'}`
            );
          })
      );
    }
    if (pickupPhoto) {
      uploads.push(
        uploadFile(
          supabase,
          'pickup-photos',
          `${basePath}/pickup-${Date.now()}.webp`,
          pickupPhoto,
          pickupPhoto.type || 'image/webp'
        )
          .then((url) => {
            pickup_photo_url = url;
          })
          .catch((e) => {
            warnings.push(
              `Pickup photo not saved: ${e instanceof Error ? e.message : 'upload failed'}`
            );
          })
      );
    }
    if (signature) {
      uploads.push(
        uploadFile(
          supabase,
          'signatures',
          `${basePath}/signature-${Date.now()}.png`,
          signature,
          signature.type || 'image/png'
        )
          .then((url) => {
            signature_url = url;
          })
          .catch((e) => {
            warnings.push(
              `Signature not saved: ${e instanceof Error ? e.message : 'upload failed'}`
            );
          })
      );
    }

    await Promise.all(uploads);

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
        handoff_code: payload.handoff_code,
        sync_status: 'synced',
      })
      .select(
        'id, farm_id, farm_photo_url, pickup_photo_url, signature_url, handoff_code'
      )
      .single();

    if (pickupError) throw pickupError;

    return NextResponse.json({
      ...pickup,
      warnings: warnings.length ? warnings : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    console.error('[sync/pickup]', message, e);
    return NextResponse.json({ message }, { status: 500 });
  }
}

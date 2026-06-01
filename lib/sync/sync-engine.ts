import { db, savePickupDraft } from '@/db/dexie';
import type { PickupDraft, PickupSyncPayload } from '@/types';

export async function syncPickupDraft(localId: string): Promise<boolean> {
  const draft = await db.pickupDrafts.get(localId);
  if (!draft) return false;
  if (!navigator.onLine) return false;

  await savePickupDraft({ ...draft, sync_status: 'syncing', sync_error: undefined });

  try {
    const formData = new FormData();
    const payload: PickupSyncPayload = {
      client_id: draft.localId,
      farm_id: draft.farmId,
      farm: draft.farmId
        ? undefined
        : {
            ...draft.farmSnapshot,
            local_farm_id: draft.farmId,
          },
      latitude: draft.latitude!,
      longitude: draft.longitude!,
      arrival_timestamp: draft.arrival_timestamp!,
      departure_timestamp: draft.departure_timestamp!,
      time_at_farm_minutes: draft.time_at_farm_minutes ?? 0,
      estimated_weight: draft.estimated_weight!,
      species: draft.species!,
      variety: draft.variety!,
      road_condition: draft.road_condition!,
      vehicle_used: draft.vehicle_used!,
      notes: draft.notes,
      distance_km: draft.distance_km!,
      estimated_fuel_liters: draft.estimated_fuel_liters!,
    };

    if (!draft.farmId) {
      payload.farm = { ...draft.farmSnapshot };
    }

    formData.append('metadata', JSON.stringify(payload));
    if (draft.farm_photo_blob) {
      formData.append('farm_photo', draft.farm_photo_blob, 'farm.webp');
    }
    if (draft.pickup_photo_blob) {
      formData.append('pickup_photo', draft.pickup_photo_blob, 'pickup.webp');
    }
    if (draft.signature_blob) {
      formData.append('signature', draft.signature_blob, 'signature.png');
    }

    const res = await fetch('/api/sync/pickup', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Sync failed');
    }

    const data = (await res.json()) as {
      id: string;
      farm_id: string;
      farm_photo_url?: string;
      pickup_photo_url?: string;
      signature_url?: string;
    };

    await savePickupDraft({
      ...draft,
      serverId: data.id,
      farmId: data.farm_id,
      farm_photo_url: data.farm_photo_url ?? draft.farm_photo_url,
      pickup_photo_url: data.pickup_photo_url ?? draft.pickup_photo_url,
      signature_url: data.signature_url ?? draft.signature_url,
      sync_status: 'synced',
      sync_error: undefined,
    });

    return true;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    await savePickupDraft({
      ...draft,
      sync_status: 'failed',
      sync_error: message,
    });
    return false;
  }
}

export async function syncAllPending(): Promise<{ synced: number; failed: number }> {
  const pending = await db.pickupDrafts
    .where('sync_status')
    .anyOf(['pending', 'failed'])
    .toArray();

  let synced = 0;
  let failed = 0;

  for (const draft of pending) {
    if (!draft.departure_timestamp) continue;
    const ok = await syncPickupDraft(draft.localId);
    if (ok) synced++;
    else failed++;
  }

  return { synced, failed };
}

export async function refreshFarmsCache(): Promise<void> {
  if (!navigator.onLine) return;
  const res = await fetch('/api/farms');
  if (!res.ok) return;
  const farms = (await res.json()) as Array<{
    id: string;
    farm_name: string;
    farmer_name: string;
    village: string;
    district: string;
    created_at?: string;
  }>;
  const { upsertFarms } = await import('@/db/dexie');
  await upsertFarms(
    farms.map((f) => ({
      id: f.id,
      farm_name: f.farm_name,
      farmer_name: f.farmer_name,
      village: f.village,
      district: f.district,
      created_at: f.created_at,
      local_only: false,
    }))
  );
}

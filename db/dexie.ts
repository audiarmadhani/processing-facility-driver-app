import Dexie, { type Table } from 'dexie';
import type { FarmRecord, PickupDraft } from '@/types';

export class DriverDatabase extends Dexie {
  farms!: Table<FarmRecord, string>;
  pickupDrafts!: Table<PickupDraft, string>;

  constructor() {
    super('CherryPickupDriver');
    this.version(1).stores({
      farms: 'id, farm_name, farmer_name',
      pickupDrafts: 'localId, sync_status, created_at, farmId',
    });
  }
}

export const db = new DriverDatabase();

export async function countPendingSync(): Promise<number> {
  return db.pickupDrafts
    .where('sync_status')
    .anyOf(['pending', 'failed', 'syncing'])
    .filter((p) => !!p.departure_timestamp)
    .count();
}

export async function getPickupDraft(localId: string): Promise<PickupDraft | undefined> {
  return db.pickupDrafts.get(localId);
}

export async function savePickupDraft(draft: PickupDraft): Promise<void> {
  await db.pickupDrafts.put(draft);
}

export async function upsertFarms(farms: FarmRecord[]): Promise<void> {
  await db.farms.bulkPut(farms);
}

export async function getAllFarms(): Promise<FarmRecord[]> {
  return db.farms.toArray();
}

export async function saveFarm(farm: FarmRecord): Promise<void> {
  await db.farms.put(farm);
}

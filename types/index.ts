export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface FarmRecord {
  id: string;
  farm_name: string;
  farmer_name: string;
  village: string;
  district: string;
  created_at?: string;
  local_only?: boolean;
}

export interface FarmSnapshot {
  farm_name: string;
  farmer_name: string;
  village: string;
  district: string;
}

export interface PickupDraft {
  localId: string;
  serverId?: string;
  farmId?: string;
  farmSnapshot: FarmSnapshot;
  latitude?: number;
  longitude?: number;
  arrival_timestamp?: string;
  departure_timestamp?: string;
  time_at_farm_minutes?: number;
  estimated_weight?: number;
  species?: string;
  variety?: string;
  road_condition?: string;
  vehicle_used?: string;
  notes?: string;
  distance_km?: number;
  estimated_fuel_liters?: number;
  farm_photo_blob?: Blob;
  pickup_photo_blob?: Blob;
  signature_blob?: Blob;
  farm_photo_url?: string;
  pickup_photo_url?: string;
  signature_url?: string;
  sync_status: SyncStatus;
  sync_error?: string;
  created_by?: string;
  created_at: string;
}

export interface PickupSyncPayload {
  client_id: string;
  farm_id?: string;
  farm?: FarmSnapshot & { local_farm_id?: string };
  latitude: number;
  longitude: number;
  arrival_timestamp: string;
  departure_timestamp: string;
  time_at_farm_minutes: number;
  estimated_weight: number;
  species: string;
  variety: string;
  road_condition: string;
  vehicle_used: string;
  notes?: string;
  distance_km: number;
  estimated_fuel_liters: number;
}

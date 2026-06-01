import { haversineDistanceKm } from '@/lib/geo/haversine';
import { VEHICLE_EFFICIENCY_KM_PER_L } from '@/lib/constants/pickup-options';

export function getFacilityCoordinates(): { lat: number; lng: number } | null {
  const lat = parseFloat(process.env.NEXT_PUBLIC_FACILITY_LAT ?? '');
  const lng = parseFloat(process.env.NEXT_PUBLIC_FACILITY_LNG ?? '');
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export function calculateDistanceKm(
  pickupLat: number,
  pickupLng: number
): number | null {
  const facility = getFacilityCoordinates();
  if (!facility) return null;
  return haversineDistanceKm(pickupLat, pickupLng, facility.lat, facility.lng);
}

export function calculateFuelLiters(
  distanceKm: number,
  vehicleUsed: string
): number | null {
  const efficiency = VEHICLE_EFFICIENCY_KM_PER_L[vehicleUsed];
  if (!efficiency) return null;
  return distanceKm / efficiency;
}

export function calculateTimeAtFarmMinutes(
  arrival: string,
  departure: string
): number {
  const ms = new Date(departure).getTime() - new Date(arrival).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

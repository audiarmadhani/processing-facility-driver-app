export const COFFEE_SPECIES = ['Arabica', 'Robusta'] as const;

export const DEFAULT_VARIETIES = [
  'Cobra',
  'Kopyol',
  'Andungsari',
  'S795',
  'Kartika',
  'Other',
] as const;

export const ROAD_CONDITIONS = ['Good', 'Moderate', 'Poor'] as const;

export const VEHICLES = ['Pickup A', 'Pickup B', 'Truck A', 'Truck B'] as const;

export const VEHICLE_EFFICIENCY_KM_PER_L: Record<string, number> = {
  'Pickup A': 12,
  'Pickup B': 11,
  'Truck A': 8,
  'Truck B': 7,
};

export function getCoffeeVarieties(): string[] {
  const env = process.env.NEXT_PUBLIC_COFFEE_VARIETIES;
  if (env?.trim()) {
    return env.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [...DEFAULT_VARIETIES];
}

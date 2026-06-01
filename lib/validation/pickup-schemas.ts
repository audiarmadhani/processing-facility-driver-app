import { z } from 'zod';

export const farmSchema = z.object({
  farm_name: z.string().min(1, 'Farm name is required'),
  farmer_name: z.string().min(1, 'Farmer name is required'),
  village: z.string().min(1, 'Village is required'),
  district: z.string().min(1, 'District is required'),
});

export const pickupInfoSchema = z.object({
  estimated_weight: z.coerce.number().positive('Weight must be greater than 0'),
  species: z.enum(['Arabica', 'Robusta']),
  variety: z.string().min(1, 'Variety is required'),
  road_condition: z.enum(['Good', 'Moderate', 'Poor']),
  vehicle_used: z.enum(['Pickup A', 'Pickup B', 'Truck A', 'Truck B']),
  notes: z.string().optional(),
});

export type FarmFormValues = z.infer<typeof farmSchema>;
export type PickupInfoFormValues = z.infer<typeof pickupInfoSchema>;

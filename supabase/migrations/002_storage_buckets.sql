-- Create storage buckets for pickup media (run in Supabase SQL editor if not applied)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('farm-photos', 'farm-photos', true),
  ('pickup-photos', 'pickup-photos', true),
  ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import SyncStatusChip from '@/components/SyncStatusChip';
import { getPickupDraft } from '@/db/dexie';
import type { PickupDraft } from '@/types';

function ImagePreview({
  blob,
  url,
  alt,
}: {
  blob?: Blob;
  url?: string;
  alt: string;
}) {
  const [src, setSrc] = useState<string | null>(url ?? null);

  useEffect(() => {
    if (url) {
      setSrc(url);
      return;
    }
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob, url]);

  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }}
    />
  );
}

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [draft, setDraft] = useState<PickupDraft | null>(null);

  useEffect(() => {
    void getPickupDraft(id).then((d) => setDraft(d ?? null));
  }, [id]);

  if (!draft) {
    return (
      <Stack alignItems="center" py={4}>
        <CircularProgress />
      </Stack>
    );
  }

  const rows: [string, string | number | undefined][] = [
    ['Farm', draft.farmSnapshot.farm_name],
    ['Farmer', draft.farmSnapshot.farmer_name],
    ['Village', draft.farmSnapshot.village],
    ['District', draft.farmSnapshot.district],
    ['Weight (kg)', draft.estimated_weight],
    ['Species', draft.species],
    ['Variety', draft.variety],
    ['Road', draft.road_condition],
    ['Vehicle', draft.vehicle_used],
    ['Distance (km)', draft.distance_km?.toFixed(2)],
    ['Est. fuel (L)', draft.estimated_fuel_liters?.toFixed(2)],
    ['Time at farm (min)', draft.time_at_farm_minutes],
    ['Arrival', draft.arrival_timestamp ? new Date(draft.arrival_timestamp).toLocaleString() : '—'],
    ['Departure', draft.departure_timestamp ? new Date(draft.departure_timestamp).toLocaleString() : '—'],
    ['GPS', draft.latitude != null ? `${draft.latitude.toFixed(5)}, ${draft.longitude?.toFixed(5)}` : '—'],
    ['Notes', draft.notes || '—'],
  ];

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={600}>
          Pickup Details
        </Typography>
        <SyncStatusChip status={draft.sync_status} />
      </Stack>
      <Card>
        <CardContent>
          <Stack spacing={1}>
            {rows.map(([k, v]) => (
              <Stack key={k} direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {k}
                </Typography>
                <Typography variant="body2">{String(v ?? '—')}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
      <Typography variant="subtitle2">Farm photo</Typography>
      <ImagePreview blob={draft.farm_photo_blob} url={draft.farm_photo_url} alt="Farm" />
      <Typography variant="subtitle2">Pickup photo</Typography>
      <ImagePreview blob={draft.pickup_photo_blob} url={draft.pickup_photo_url} alt="Pickup" />
      <Typography variant="subtitle2">Signature</Typography>
      <ImagePreview blob={draft.signature_blob} url={draft.signature_url} alt="Signature" />
    </Stack>
  );
}

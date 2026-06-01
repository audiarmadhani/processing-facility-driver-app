'use client';

import { useRouter } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useLiveQuery } from 'dexie-react-hooks';
import SyncStatusChip from '@/components/SyncStatusChip';
import { db } from '@/db/dexie';
import type { PickupDraft } from '@/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function HistoryPage() {
  const router = useRouter();
  const pickups = useLiveQuery(async () => {
    const all = await db.pickupDrafts.toArray();
    return all
      .filter((p) => !!p.departure_timestamp)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [], [] as PickupDraft[]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={600}>
        Pickup History
      </Typography>
      <List>
        {(pickups ?? []).map((p) => (
          <ListItemButton
            key={p.localId}
            onClick={() => router.push(`/history/${p.localId}`)}
            sx={{ borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'divider' }}
          >
            <ListItemText
              primary={p.farmSnapshot.farm_name}
              secondary={`${p.farmSnapshot.farmer_name} · ${formatDate(p.created_at)} · ${p.estimated_weight ?? '—'} kg`}
            />
            <SyncStatusChip status={p.sync_status} />
          </ListItemButton>
        ))}
      </List>
      {!pickups?.length && (
        <Typography color="text.secondary">No completed pickups yet.</Typography>
      )}
    </Stack>
  );
}

'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useLiveQuery } from 'dexie-react-hooks';
import SyncStatusChip from '@/components/SyncStatusChip';
import DriverFieldButton from '@/components/DriverFieldButton';
import { db } from '@/db/dexie';
import { syncAllPending, syncPickupDraft } from '@/lib/sync/sync-engine';
import { useOnline } from '@/lib/hooks/use-online';
import type { PickupDraft } from '@/types';

export default function SyncPage() {
  const online = useOnline();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const pending = useLiveQuery(
    () =>
      db.pickupDrafts
        .where('sync_status')
        .anyOf(['pending', 'failed', 'syncing'])
        .filter((p) => !!p.departure_timestamp)
        .toArray(),
    [],
    [] as PickupDraft[]
  );

  const handleRetryAll = async () => {
    if (!online) {
      setMessage('Connect to the internet to sync.');
      return;
    }
    setSyncing(true);
    setMessage('');
    const result = await syncAllPending();
    setMessage(`Synced: ${result.synced}, failed: ${result.failed}`);
    setSyncing(false);
  };

  const handleRetryOne = async (localId: string) => {
    if (!online) {
      setMessage('Connect to the internet to sync.');
      return;
    }
    setSyncing(true);
    const ok = await syncPickupDraft(localId);
    setMessage(ok ? 'Synced successfully.' : 'Sync failed. Try again.');
    setSyncing(false);
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 0,
        overflow: 'auto',
        width: '100%',
      }}
    >
      <Stack spacing={2}>
      <Typography variant="h5" fontWeight={600}>
        Pending Sync
      </Typography>
      {!online && (
        <Alert severity="warning">You are offline. Sync will run when back online.</Alert>
      )}
      {message && <Alert severity="info">{message}</Alert>}
      <DriverFieldButton disabled={syncing || !online} onClick={handleRetryAll}>
        {syncing ? 'Syncing…' : 'Retry All Failed'}
      </DriverFieldButton>
      <List>
        {(pending ?? []).map((p) => (
          <ListItem
            key={p.localId}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
              <ListItemText
                primary={p.farmSnapshot.farm_name}
                secondary={p.sync_error ?? p.sync_status}
              />
              <SyncStatusChip status={p.sync_status} />
            </Stack>
            {p.sync_status !== 'synced' && (
              <Button
                size="small"
                variant="outlined"
                disabled={syncing || !online}
                onClick={() => void handleRetryOne(p.localId)}
                sx={{ mt: 1, alignSelf: 'flex-end' }}
              >
                {p.sync_status === 'syncing' ? 'Retry stuck sync' : 'Retry'}
              </Button>
            )}
          </ListItem>
        ))}
      </List>
      {!pending?.length && (
        <Typography color="text.secondary">Nothing waiting to sync.</Typography>
      )}
      </Stack>
    </Box>
  );
}

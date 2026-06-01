'use client';

import Alert from '@mui/material/Alert';
import { useOnline } from '@/lib/hooks/use-online';

export default function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <Alert severity="warning" sx={{ borderRadius: 0 }}>
      You are offline. Pickups will sync when connection returns.
    </Alert>
  );
}

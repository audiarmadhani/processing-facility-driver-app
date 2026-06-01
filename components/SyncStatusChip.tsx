'use client';

import Chip from '@mui/material/Chip';
import type { SyncStatus } from '@/types';

const labels: Record<SyncStatus, string> = {
  pending: 'Pending',
  syncing: 'Syncing',
  synced: 'Synced',
  failed: 'Failed',
};

const colors: Record<SyncStatus, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  syncing: 'info',
  synced: 'success',
  failed: 'error',
};

export default function SyncStatusChip({ status }: { status: SyncStatus }) {
  return <Chip label={labels[status]} color={colors[status]} size="small" />;
}

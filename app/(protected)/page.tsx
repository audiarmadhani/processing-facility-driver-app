'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import DriverFieldButton from '@/components/DriverFieldButton';
import SyncProvider from '@/components/SyncProvider';

export default function HomePage() {
  const router = useRouter();

  return (
    <SyncProvider>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
          minHeight: 0,
        }}
      >
        <DriverFieldButton onClick={() => router.push('/pickup/farm')}>
          Start Pickup
        </DriverFieldButton>
      </Box>
    </SyncProvider>
  );
}

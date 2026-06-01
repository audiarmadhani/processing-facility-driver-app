'use client';

import { useRouter } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Box from '@mui/material/Box';
import DriverFieldButton from '@/components/DriverFieldButton';
import DriverMobileCard from '@/components/DriverMobileCard';
import SyncProvider from '@/components/SyncProvider';

export default function HomePage() {
  const router = useRouter();

  return (
    <SyncProvider>
      <Stack spacing={2} sx={{ flex: 1, justifyContent: 'center', minHeight: 0 }}>
        <DriverMobileCard>
          <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LocalShippingIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} textAlign="center">
              Field pickup
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Record farm arrival, cherry details, and hand off a code at the
              mill.
            </Typography>
          </Stack>
        </DriverMobileCard>
        <DriverFieldButton onClick={() => router.push('/pickup/farm')}>
          Start pickup
        </DriverFieldButton>
      </Stack>
    </SyncProvider>
  );
}

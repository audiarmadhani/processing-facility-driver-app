'use client';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DriverFieldButton from '@/components/DriverFieldButton';

interface PickupHandoffDialogProps {
  open: boolean;
  handoffCode: string;
  farmName: string;
  onDone: () => void;
}

export default function PickupHandoffDialog({
  open,
  handoffCode,
  farmName,
  onDone,
}: PickupHandoffDialogProps) {
  return (
    <Dialog
      open={open}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'stretch',
          minHeight: '100dvh',
          px: 2,
          py: 4,
        }}
      >
        <Stack spacing={3} alignItems="stretch">
          <Typography variant="h5" fontWeight={700} textAlign="center">
            Pickup complete
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Give this code to receiving staff for{' '}
            <strong>{farmName}</strong>
          </Typography>
          <Box
            sx={{
              py: 3,
              px: 2,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              textAlign: 'center',
              letterSpacing: '0.35em',
            }}
          >
            <Typography
              component="div"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3rem' },
                fontWeight: 800,
                fontFamily: 'ui-monospace, monospace',
                lineHeight: 1.1,
              }}
            >
              {handoffCode}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Receiving will enter this code when creating the batch (optional for
            now). You can find it again in History.
          </Typography>
          <DriverFieldButton onClick={onDone}>Done</DriverFieldButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

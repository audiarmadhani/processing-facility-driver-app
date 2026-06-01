'use client';

import { useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (blob: Blob) => void;
}

export default function SignaturePad({ onSave }: SignaturePadProps) {
  const ref = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    ref.current?.clear();
  };

  const handleSave = () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const dataUrl = ref.current.getTrimmedCanvas().toDataURL('image/png');
    fetch(dataUrl)
      .then((r) => r.blob())
      .then(onSave);
  };

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          touchAction: 'none',
        }}
      >
        <SignatureCanvas
          ref={ref}
          canvasProps={{
            width: 320,
            height: 160,
            style: { width: '100%', height: 160 },
          }}
        />
      </Box>
      <Stack direction="row" spacing={1}>
        <Button size="small" onClick={handleClear}>
          Clear
        </Button>
        <Button size="small" variant="contained" onClick={handleSave}>
          Save Signature
        </Button>
      </Stack>
    </Stack>
  );
}

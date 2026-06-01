'use client';

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SignatureCanvas from 'react-signature-canvas';

const SIGNATURE_BG = '#ffffff';
const SIGNATURE_PEN = '#111111';

interface SignaturePadProps {
  onSave: (blob: Blob) => void;
}

export default function SignaturePad({ onSave }: SignaturePadProps) {
  const ref = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const next = Math.floor(el.clientWidth) || 320;
      setWidth(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    <Stack spacing={1.5}>
      <Box
        ref={containerRef}
        sx={{
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: SIGNATURE_BG,
          touchAction: 'none',
          overflow: 'hidden',
        }}
      >
        <SignatureCanvas
          ref={ref}
          penColor={SIGNATURE_PEN}
          backgroundColor={SIGNATURE_BG}
          canvasProps={{
            width,
            height: 180,
            style: {
              width: '100%',
              height: 180,
              display: 'block',
              backgroundColor: SIGNATURE_BG,
            },
          }}
        />
      </Box>
      <Stack direction="row" spacing={1}>
        <Button size="large" variant="outlined" fullWidth onClick={handleClear}>
          Clear
        </Button>
        <Button size="large" variant="contained" fullWidth onClick={handleSave}>
          Save signature
        </Button>
      </Stack>
    </Stack>
  );
}

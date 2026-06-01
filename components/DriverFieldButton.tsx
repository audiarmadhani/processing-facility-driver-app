'use client';

import Button, { type ButtonProps } from '@mui/material/Button';

export default function DriverFieldButton(props: ButtonProps) {
  return (
    <Button
      size="large"
      variant="contained"
      fullWidth
      sx={{
        minHeight: 52,
        py: 1.5,
        borderRadius: 2.5,
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'none',
        ...props.sx,
      }}
      {...props}
    />
  );
}

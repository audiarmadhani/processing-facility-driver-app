'use client';

import Button, { type ButtonProps } from '@mui/material/Button';

export default function DriverFieldButton(props: ButtonProps) {
  return (
    <Button
      size="large"
      variant="contained"
      fullWidth
      sx={{ minHeight: 52, py: 1.5, ...props.sx }}
      {...props}
    />
  );
}

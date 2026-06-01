'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import type { CardProps } from '@mui/material/Card';

export default function DriverMobileCard({
  children,
  ...props
}: CardProps & { children: React.ReactNode }) {
  return (
    <Card
      elevation={0}
      {...props}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        ...props.sx,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { signOut, useSession } from 'next-auth/react';
import DriverBottomNav from '@/components/DriverBottomNav';

const BOTTOM_NAV_HEIGHT = 64;

export default function DriverAppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Toolbar sx={{ minHeight: 56, maxWidth: 520, width: '100%', mx: 'auto' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              BTM HEQA
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Cherry pickup
            </Typography>
          </Box>
          <IconButton
            aria-label="Account menu"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            edge="end"
            size="large"
            sx={{ color: 'inherit' }}
          >
            <AccountCircleIcon fontSize="large" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {session?.user?.name && (
              <MenuItem disabled sx={{ opacity: 1 }}>
                <ListItemText
                  primary={session.user.name}
                  secondary={session.user.email ?? undefined}
                />
              </MenuItem>
            )}
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                void signOut({ callbackUrl: '/auth/signin' });
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 520,
          mx: 'auto',
          px: { xs: 1.5, sm: 2 },
          pt: 2,
          pb: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom) + 16px)`,
          minHeight: 0,
        }}
      >
        {children}
      </Box>

      <DriverBottomNav />
    </Box>
  );
}

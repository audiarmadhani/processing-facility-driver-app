'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Badge from '@mui/material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { useLiveQuery } from 'dexie-react-hooks';
import { countPendingSync } from '@/db/dexie';

type TabValue = '/' | '/history' | '/sync';

const TABS: {
  value: TabValue;
  label: string;
  icon: typeof HomeIcon;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    value: '/',
    label: 'Home',
    icon: HomeIcon,
    isActive: (pathname) =>
      pathname === '/' || pathname.startsWith('/pickup'),
  },
  {
    value: '/history',
    label: 'History',
    icon: HistoryIcon,
    isActive: (pathname) => pathname.startsWith('/history'),
  },
  {
    value: '/sync',
    label: 'Sync',
    icon: CloudSyncIcon,
    isActive: (pathname) => pathname.startsWith('/sync'),
  },
];

export default function DriverBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const pendingCount = useLiveQuery(() => countPendingSync(), [], 0);

  const activeTab = useMemo(() => {
    return TABS.find((tab) => tab.isActive(pathname))?.value ?? '/';
  }, [pathname]);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={activeTab}
        onChange={(_, value: TabValue) => {
          if (value !== activeTab) router.push(value);
        }}
        showLabels
        sx={{
          height: 64,
          bgcolor: 'background.paper',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            py: 1,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
          },
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const icon =
            tab.value === '/sync' && pendingCount > 0 ? (
              <Badge badgeContent={pendingCount} color="warning">
                <Icon />
              </Badge>
            ) : (
              <Icon />
            );

          return (
            <BottomNavigationAction
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={icon}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}

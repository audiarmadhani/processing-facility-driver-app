import * as React from 'react';
import { NextAppProvider } from '@toolpad/core/nextjs';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { SessionProvider, signIn, signOut } from 'next-auth/react';
import theme from '@/theme/theme';
import { auth } from '@/auth';
import OfflineBanner from '@/components/OfflineBanner';

export const metadata = {
  title: 'BTM HEQA — Cherry Pickup Driver',
  description: 'Coffee cherry pickup field data collection',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cherry Pickup',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: 'hsl(210, 98%, 48%)',
};

const AUTHENTICATION = {
  signIn,
  signOut,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en" data-toolpad-color-scheme="dark">
      <body>
        <SessionProvider session={session}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <NextAppProvider
              theme={theme}
              navigation={[]}
              session={session}
              authentication={AUTHENTICATION}
            >
              <OfflineBanner />
              {children}
            </NextAppProvider>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

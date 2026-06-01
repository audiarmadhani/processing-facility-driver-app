'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOnline } from '@/lib/hooks/use-online';
import { refreshFarmsCache, syncAllPending } from '@/lib/sync/sync-engine';

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const online = useOnline();
  const { status } = useSession();

  useEffect(() => {
    if (!online || status !== 'authenticated') return;

    void refreshFarmsCache();
    void syncAllPending();

    const interval = setInterval(() => {
      void syncAllPending();
    }, 60000);

    return () => clearInterval(interval);
  }, [online, status]);

  useEffect(() => {
    if (!online || status !== 'authenticated') return;
    const onOnline = () => {
      void refreshFarmsCache();
      void syncAllPending();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [online, status]);

  return <>{children}</>;
}

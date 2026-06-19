import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@clerk/clerk-expo';

import { runSync, type SyncResult } from '@/lib/sync';

export function useAutoSync() {
  const { isSignedIn, getToken } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const wasOffline = useRef(false);

  const sync = useCallback(async () => {
    if (!isSignedIn) return;
    setSyncing(true);
    try {
      const result = await runSync(() => getToken());
      setLastResult(result);
    } finally {
      setSyncing(false);
    }
  }, [isSignedIn, getToken]);

  // Auto-trigger when connectivity transitions from offline -> online.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (online && wasOffline.current) {
        sync();
      }
      wasOffline.current = !online;
    });
    return unsubscribe;
  }, [sync]);

  return { sync, syncing, lastResult };
}

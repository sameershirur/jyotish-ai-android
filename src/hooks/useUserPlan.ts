import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { getCachedPlan, refreshPlan, type CachedPlan } from '@/lib/plan';

export function useUserPlan() {
  const { isSignedIn, getToken } = useAuth();
  const [state, setState] = useState<CachedPlan>({ plan: 'free', verifiedAt: '' });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setState({ plan: 'free', verifiedAt: '' });
      setLoading(false);
      return;
    }
    const cached = await getCachedPlan();
    setState(cached);
    const token = await getToken();
    if (token) {
      const fresh = await refreshPlan(token);
      setState(fresh);
    }
    setLoading(false);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, loading, refresh };
}

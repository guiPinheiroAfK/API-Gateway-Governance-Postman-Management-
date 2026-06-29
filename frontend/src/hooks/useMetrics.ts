import { useState, useEffect, useCallback } from 'react';
import { GatewayMetrics } from '../types';
import { fetchMetrics } from '../api/gateway';

const POLL_INTERVAL = 4000;

export function useMetrics(enabled: boolean) {
  const [metrics, setMetrics] = useState<GatewayMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setError(null);
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { metrics, error, loading, refresh };
}

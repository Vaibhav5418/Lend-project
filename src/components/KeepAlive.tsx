import { useEffect } from 'react';
import { pingHealth } from '../api/client';

/** Pings backend /api/health to avoid cold starts (e.g. Render sleep). */
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function KeepAlive() {
  useEffect(() => {
    pingHealth(); // pre-warm as soon as app loads
    const interval = setInterval(pingHealth, KEEP_ALIVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
  return null;
}

import { useEffect, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { CurrentStats } from "@/src/lib/types";

const REFRESH_INTERVAL_MS = 30_000;

export function useCurrentStats() {
  const [stats, setStats] = useState<CurrentStats | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const response = await apiClient.getCurrentStats();
        if (mounted) setStats(response);
      } catch {
        if (mounted) setStats(null);
      }
    };

    fetchStats().catch(() => null);
    const timer = window.setInterval(fetchStats, REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return stats;
}

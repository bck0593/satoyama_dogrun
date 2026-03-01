import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { Dog } from "@/src/lib/types";

type UseDogsOptions = {
  enabled?: boolean;
  activeOnly?: boolean;
};

export function useDogs(options: UseDogsOptions = {}) {
  const { enabled = true, activeOnly = false } = options;
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getDogs();
      setDogs(activeOnly ? response.filter((dog) => dog.is_active) : response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "犬情報の取得に失敗しました。");
      setDogs([]);
    } finally {
      setLoading(false);
    }
  }, [activeOnly, enabled]);

  useEffect(() => {
    if (!enabled) {
      setDogs([]);
      setLoading(false);
      setError(null);
      return;
    }

    reload().catch(() => null);
  }, [enabled, reload]);

  return { dogs, loading, error, reload };
}

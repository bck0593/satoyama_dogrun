import { useEffect, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { Reservation } from "@/src/lib/types";

export function useUserReservations(enabled: boolean) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setReservations([]);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    apiClient
      .getReservations()
      .then((data) => {
        if (!mounted) return;
        setReservations(data);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setReservations([]);
        setError(err instanceof Error ? err.message : "予約の取得に失敗しました。");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { reservations, loading, error };
}

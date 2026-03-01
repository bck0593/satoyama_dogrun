import { useEffect, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { Reservation } from "@/src/lib/types";

export function useUserReservations(enabled: boolean) {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (!enabled) {
      setReservations([]);
      return;
    }

    let mounted = true;

    apiClient
      .getReservations()
      .then((data) => {
        if (mounted) setReservations(data);
      })
      .catch(() => {
        if (mounted) setReservations([]);
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return reservations;
}

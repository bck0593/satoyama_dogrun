import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import { todayDateString } from "@/src/lib/date-utils";
import type { CurrentStats, Reservation } from "@/src/lib/types";

const DEFAULT_POLLING_INTERVAL_MS = 15_000;

export function useLiveStatus(pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS) {
  const [stats, setStats] = useState<CurrentStats | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const [statsResult, reservationsResult] = await Promise.allSettled([
        apiClient.getCurrentStats(),
        apiClient.getReservations(),
      ]);

      if (!mounted) return;

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      } else {
        setStats(null);
      }

      if (reservationsResult.status === "fulfilled") {
        setReservations(reservationsResult.value);
      }
    };

    fetchAll().catch(() => null);
    const timer = window.setInterval(fetchAll, pollingIntervalMs);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [pollingIntervalMs]);

  const currentReservation = useMemo(() => {
    const today = todayDateString();
    return reservations.find((reservation) => reservation.date === today && reservation.status === "checked_in") ?? null;
  }, [reservations]);

  const congestionView = useMemo(() => {
    switch (stats?.congestion) {
      case "low":
        return { label: "空いています", color: "text-emerald-600" };
      case "medium":
        return { label: "やや混雑", color: "text-yellow-600" };
      case "high":
        return { label: "混雑", color: "text-orange-600" };
      case "full":
        return { label: "満員", color: "text-red-600" };
      default:
        return { label: "取得中", color: "text-gray-500" };
    }
  }, [stats?.congestion]);

  return { stats, currentReservation, congestionView };
}

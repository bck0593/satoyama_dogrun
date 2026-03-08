import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import { todayDateString } from "@/src/lib/date-utils";
import { toDateTimeValue } from "@/src/lib/reservation-display";
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

  const nextTodayReservation = useMemo(() => {
    const today = todayDateString();
    return (
      reservations
        .filter((reservation) => reservation.date === today && ["pending_payment", "confirmed"].includes(reservation.status))
        .sort((a, b) => toDateTimeValue(a.date, a.start_time) - toDateTimeValue(b.date, b.start_time))[0] ?? null
    );
  }, [reservations]);

  const utilizationRate = useMemo(() => {
    if (!stats?.max_capacity) return null;
    return Math.min(Math.round((stats.current_dogs / stats.max_capacity) * 100), 100);
  }, [stats?.current_dogs, stats?.max_capacity]);

  const congestionView = useMemo(() => {
    switch (stats?.congestion) {
      case "low":
        return {
          label: "空いています",
          color: "text-emerald-600",
          description: "いまは比較的ゆったり利用できます。",
        };
      case "medium":
        return {
          label: "やや混雑",
          color: "text-yellow-600",
          description: "空きはありますが、にぎわってきています。",
        };
      case "high":
        return {
          label: "混雑",
          color: "text-orange-600",
          description: "混み合っています。予約や時間調整が安心です。",
        };
      case "full":
        return {
          label: "満員",
          color: "text-red-600",
          description: "現在は空きがありません。",
        };
      default:
        return {
          label: "取得中",
          color: "text-gray-500",
          description: "最新の利用状況を読み込んでいます。",
        };
    }
  }, [stats?.congestion]);

  return { stats, currentReservation, nextTodayReservation, congestionView, utilizationRate };
}

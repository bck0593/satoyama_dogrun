import type { StatusTone } from "@/src/components/status-pill";
import { todayDateString } from "@/src/lib/date-utils";
import { getUpcomingReservation, toDateTimeValue } from "@/src/lib/reservation-display";
import type { Dog, Reservation, UserProfile } from "@/src/lib/types";

export type DogReadinessCode = "ready" | "pending" | "rejected" | "expired";

export type DogReadiness = {
  code: DogReadinessCode;
  label: string;
  tone: StatusTone;
  hint: string;
};

/** Soft "callout box" classes for a dog's readiness hint, keyed by readiness code. */
export const DOG_READINESS_HINT_CLASS: Record<DogReadinessCode, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  expired: "border-red-200 bg-red-50 text-red-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

/** Display order: bookable dogs first, then waiting, then those needing action. */
const READINESS_RANK: Record<DogReadinessCode, number> = {
  ready: 0,
  pending: 1,
  expired: 2,
  rejected: 3,
};

type ReadinessDog = Pick<Dog, "vaccine_approval_status" | "vaccine_expires_on" | "vaccine_review_note" | "name">;

/** Sort dogs so bookable (予約OK) ones come first; ties broken by name. */
export function sortDogsByReadiness<T extends ReadinessDog>(dogs: T[], today: string = todayDateString()): T[] {
  return [...dogs].sort((a, b) => {
    const rankDiff = READINESS_RANK[getDogReadiness(a, today).code] - READINESS_RANK[getDogReadiness(b, today).code];
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name, "ja");
  });
}

/**
 * Single source of truth for "can this dog be booked, and if not, why?".
 * Vaccine review state (pending / rejected) takes priority because it blocks
 * regardless of the expiry date; an approved dog is then gated on the expiry.
 */
export function getDogReadiness(
  dog: Pick<Dog, "vaccine_approval_status" | "vaccine_expires_on" | "vaccine_review_note">,
  today: string = todayDateString(),
): DogReadiness {
  if (dog.vaccine_approval_status === "rejected") {
    return {
      code: "rejected",
      label: "差し戻し",
      tone: "danger",
      hint: dog.vaccine_review_note
        ? `差し戻し理由: ${dog.vaccine_review_note} 修正して再提出してください。`
        : "ワクチン証明が差し戻されました。修正して再提出してください。",
    };
  }
  if (dog.vaccine_approval_status === "pending") {
    return {
      code: "pending",
      label: "スタッフ確認中",
      tone: "warning",
      hint: "ワクチン証明をスタッフが確認中です。承認されると予約に使えます。",
    };
  }
  if (dog.vaccine_expires_on < today) {
    return {
      code: "expired",
      label: "ワクチン期限切れ",
      tone: "danger",
      hint: "ワクチン期限が切れています。期限を更新すると、再び予約に使えます。",
    };
  }
  return {
    code: "ready",
    label: "予約OK",
    tone: "success",
    hint: "この犬で予約できます。",
  };
}

type PrimaryAction = {
  href: string;
  label: string;
  description: string;
  tone: "brand" | "warning" | "success" | "neutral";
};

export function isProfileComplete(user: Pick<UserProfile, "display_name" | "phone_number"> | null | undefined) {
  return Boolean(user?.display_name?.trim() && user?.phone_number?.trim());
}

export function isSuspended(
  user: Pick<UserProfile, "suspended_until"> | null | undefined,
  now = Date.now(),
) {
  if (!user?.suspended_until) return false;
  const suspendedUntil = new Date(user.suspended_until).getTime();
  return Number.isFinite(suspendedUntil) && suspendedUntil > now;
}

export function summarizeDogs(dogs: Dog[]) {
  const activeDogs = dogs.filter((dog) => dog.is_active);
  const approvedDogs = activeDogs.filter((dog) => dog.vaccine_approval_status === "approved");
  const pendingDogs = activeDogs.filter((dog) => dog.vaccine_approval_status === "pending");
  const rejectedDogs = activeDogs.filter((dog) => dog.vaccine_approval_status === "rejected");

  return {
    activeDogs,
    approvedDogs,
    pendingDogs,
    rejectedDogs,
  };
}

export function getTodayReservations(reservations: Reservation[], now = Date.now()) {
  const today = todayDateString();
  return reservations
    .filter((reservation) => reservation.date === today)
    .sort((a, b) => toDateTimeValue(a.date, a.start_time) - toDateTimeValue(b.date, b.start_time))
    .filter((reservation) => toDateTimeValue(reservation.date, reservation.end_time) >= now);
}

export function getCheckedInReservation(reservations: Reservation[]) {
  return reservations.find((reservation) => reservation.status === "checked_in") ?? null;
}

export function getPendingTodayReservation(reservations: Reservation[], now = Date.now()) {
  return (
    getTodayReservations(reservations, now).find((reservation) =>
      ["pending_payment", "confirmed"].includes(reservation.status),
    ) ?? null
  );
}

export function getPrimaryAction(input: {
  user: UserProfile | null;
  dogs: Dog[];
  reservations: Reservation[];
  now?: number;
}): PrimaryAction {
  const { user, dogs, reservations, now = Date.now() } = input;

  if (!user) {
    return {
      href: "/login",
      label: "LINEでログイン",
      description: "まずはログインして、会員情報と犬情報の登録を始めましょう。",
      tone: "brand",
    };
  }

  if (isSuspended(user, now)) {
    return {
      href: "/mypage",
      label: "利用停止期間を確認",
      description: "無断キャンセル等による利用停止中です。解除予定日を確認してください。",
      tone: "warning",
    };
  }

  if (!isProfileComplete(user)) {
    return {
      href: "/mypage",
      label: "プロフィールを整える",
      description: "まずは表示名と電話番号を登録して、連絡が取れる状態にしておきましょう。",
      tone: "warning",
    };
  }

  const { activeDogs, approvedDogs, pendingDogs } = summarizeDogs(dogs);

  if (!activeDogs.length) {
    return {
      href: "/dog-registration",
      label: "犬を登録する",
      description: "予約には犬情報の登録が必要です。最初の1頭を登録しましょう。",
      tone: "brand",
    };
  }

  if (!approvedDogs.length) {
    return {
      href: pendingDogs.length ? "/mypage" : "/dog-registration",
      label: pendingDogs.length ? "承認状況を確認する" : "予約できる犬を登録する",
      description: pendingDogs.length
        ? "ワクチン証明の承認が完了すると予約できます。マイページで状態を確認してください。"
        : "ワクチン証明が承認済みの犬がまだいません。登録と申請を進めてください。",
      tone: "warning",
    };
  }

  const checkedInReservation = getCheckedInReservation(reservations);
  if (checkedInReservation) {
    return {
      href: "/live-status",
      label: "利用状況を確認する",
      description: "現在ご利用中です。混雑状況と利用終了時間を確認できます。",
      tone: "success",
    };
  }

  const todayReservation = getPendingTodayReservation(reservations, now);
  if (todayReservation) {
    return {
      href: "/checkin",
      label: "チェックインする",
      description: "本日の予約があります。現地ではQRチェックインに進んでください。",
      tone: "success",
    };
  }

  const upcomingReservation = getUpcomingReservation(reservations, now);
  if (upcomingReservation) {
    return {
      href: "/mypage",
      label: "予約内容を確認する",
      description: "次回予約があります。時間と利用犬を確認して、当日に備えましょう。",
      tone: "neutral",
    };
  }

  return {
    href: "/reservation",
    label: "予約する",
    description: "日付と犬を選んで、そのまま事前決済まで進めます。",
    tone: "brand",
  };
}

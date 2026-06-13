import type { StatusTone } from "@/src/components/status-pill";
import type { Dog as DogProfile, SlotAvailability } from "@/src/lib/types";

export const FEE_PER_DOG = 200;

export const CALENDAR_CLASS_NAMES = {
  month_caption: "flex h-10 items-center justify-center px-10",
  caption_label: "text-base font-bold text-[#0e3875]",
  nav: "absolute inset-x-0 top-1 flex w-full items-center justify-between",
  button_previous:
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c5d4e9] bg-white text-[#0f3b79] hover:bg-[#edf3fb]",
  button_next:
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c5d4e9] bg-white text-[#0f3b79] hover:bg-[#edf3fb]",
  weekdays: "mt-2",
  weekday: "text-xs font-semibold text-[#4c6a97]",
  week: "mt-1",
  day: "text-sm font-medium text-[#123b73] [&[data-selected=true]_button]:rounded-full [&[data-selected=true]_button]:bg-[#001f54] [&[data-selected=true]_button]:text-white",
  day_button: "h-9 w-9 rounded-full",
  selected: "bg-transparent text-inherit",
  today: "border border-[#7ca0d4] text-[#0a3f87]",
  outside: "text-[#9cb0cc]",
  disabled: "text-[#c7d2e3]",
};

export function slotTone(slot: SlotAvailability): { label: string; tone: StatusTone; className: string } {
  if (slot.available_total <= 0) {
    return {
      label: "満員",
      tone: "danger",
      className: "border-slate-200 bg-slate-100 text-slate-400",
    };
  }
  if (slot.available_total <= 3) {
    return {
      label: "残りわずか",
      tone: "warning",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  return {
    label: "空きあり",
    tone: "success",
    className: "border-[#cbd8ea] bg-white text-[#163865]",
  };
}

export function dogStatusInfo(status: "pending" | "approved" | "rejected"): {
  label: string;
  tone: StatusTone;
  detail: string;
} {
  if (status === "approved") {
    return { label: "承認済み", tone: "success", detail: "この犬で予約できます。" };
  }
  if (status === "rejected") {
    return { label: "差し戻し", tone: "danger", detail: "証明書の再提出後に予約できます。" };
  }
  return { label: "確認待ち", tone: "warning", detail: "スタッフ承認後に予約できます。" };
}

export function hasValidVaccineForDate(dog: Pick<DogProfile, "vaccine_expires_on">, selectedDateText: string): boolean {
  return dog.vaccine_expires_on >= selectedDateText;
}

export function getSlotCapacityIssue(slot: SlotAvailability, dogs: DogProfile[]): string | null {
  if (slot.available_total < dogs.length) {
    return "選択頭数が空き枠を超えています。";
  }

  const selectedLargeDogs = dogs.filter((dog) => dog.size_category === "large").length;
  const selectedSmallDogs = dogs.filter((dog) => dog.size_category === "small").length;
  const availableLargeDogs = Math.max(slot.max_large_dogs - slot.reserved_large, 0);
  const availableSmallDogs =
    typeof slot.available_small === "number"
      ? slot.available_small
      : typeof slot.max_small_dogs === "number" && typeof slot.reserved_small === "number"
        ? Math.max(slot.max_small_dogs - slot.reserved_small, 0)
        : Number.POSITIVE_INFINITY;

  if (selectedLargeDogs > availableLargeDogs) {
    return "大型犬の受入上限を超えるため、この時間は予約できません。";
  }

  if (selectedSmallDogs > availableSmallDogs) {
    return "小型犬の受入上限を超えるため、この時間は予約できません。";
  }

  return null;
}

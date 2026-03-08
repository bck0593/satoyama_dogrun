export type UserProfile = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  phone_number: string;
  line_user_id: string;
  is_staff: boolean;
  no_show_count: number;
  suspended_until: string | null;
  created_at: string;
};

export type Dog = {
  id: number;
  owner: number;
  name: string;
  breed: string;
  breed_raw: string;
  breed_normalized: string;
  breed_group: string | null;
  weight_kg: string;
  size_category: "small" | "medium" | "large";
  gender: "male" | "female" | "unknown" | null;
  birth_date: string | null;
  vaccine_expires_on: string;
  vaccine_proof_image?: string | null;
  vaccine_approval_status: "pending" | "approved" | "rejected";
  vaccine_review_note: string;
  vaccine_reviewed_at: string | null;
  vaccine_reviewed_by: number | null;
  is_restricted_breed: boolean;
  is_active: boolean;
  notes: string;
};

export type ReservationDog = {
  dog: number;
  dog_name: string;
  breed: string;
  size_category: string;
  weight_kg: string;
};

export type Reservation = {
  id: number;
  user: number;
  date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  status: string;
  payment_status: string;
  total_amount: string;
  qr_token: string;
  qr_expires_at: string | null;
  note: string;
  paid_at: string | null;
  checked_in_at: string | null;
  actual_checked_out_at?: string | null;
  actual_duration_minutes?: number | null;
  cancelled_at: string | null;
  cancel_reason: string;
  cancelled_by: number | null;
  cancelled_by_role: "user" | "admin" | "";
  cancelled_by_display_name?: string | null;
  created_at: string;
  reservation_dogs: ReservationDog[];
};

export type SlotAvailability = {
  start_time: string;
  end_time: string;
  max_total_dogs: number;
  max_large_dogs: number;
  max_small_dogs?: number;
  reserved_total: number;
  reserved_large: number;
  reserved_small?: number;
  available_total: number;
  available_small?: number;
};

export type CurrentStats = {
  timestamp: string;
  current_dogs: number;
  total_dogs: number;
  large_dogs: number;
  medium_dogs: number;
  small_dogs: number;
  max_capacity: number;
  available: number;
  congestion: "low" | "medium" | "high" | "full";
  breed_counts: Array<{ breed: string; count: number }>;
  breeds: Array<{ breed: string; count: number }>;
  dogs?: Array<{ dog_name: string; breed: string; size_category: "small" | "medium" | "large" }>;
};

export type HomeHeroSlide = {
  id: number;
  title: string;
  description: string;
  image: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type HomeHeroSlideCreateInput = {
  title: string;
  description?: string;
  alt_text?: string;
  display_order: number;
  is_active: boolean;
  image: File;
};

export type HomeHeroSlideUpdateInput = {
  title?: string;
  description?: string;
  alt_text?: string;
  display_order?: number;
  is_active?: boolean;
  image?: File | null;
};

export type BreedStatsPeriod = "daily" | "monthly" | "realtime";

export type BreedStatsItem = {
  breed: string;
  count: number;
  unique_dogs?: number;
};

export type BreedStatsResponse = {
  period: BreedStatsPeriod;
  target_date?: string;
  target_month?: string;
  data: BreedStatsItem[];
  generated_at: string;
};

export type PaymentHistoryItem = {
  id: number;
  reservation_id: number;
  reservation_date: string;
  reservation_start_time: string;
  amount: string;
  unit_price?: string;
  tax?: string;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  refunded_amount: string;
  idempotency_key?: string;
  created_at: string;
};

export type AdminUsageEntry = {
  id: number;
  reservation_id: number;
  reservation_date: string | null;
  reservation_start_time: string | null;
  reservation_end_time: string | null;
  user_display_name: string;
  dog_name_snapshot: string;
  breed_snapshot: string;
  size_category_snapshot: "small" | "medium" | "large" | string;
  weight_kg_snapshot: string;
  status: "in" | "out" | "invalid" | string;
  source: string;
  checked_in_at: string;
  checked_out_at: string | null;
  usage_minutes: number;
};

export type CheckinQrPreview = {
  reservation_id: number;
  status: string;
  payment_status: string;
  user: {
    id: number;
    display_name: string;
    suspended_until: string | null;
  };
  slot: {
    date: string;
    start_time: string;
    end_time: string;
  };
  dogs: Array<{
    dog_id: number;
    dog_name: string;
    breed: string;
    size_category: string;
    weight_kg: string;
  }>;
  eligibility: {
    allowed: boolean;
    reason_code: string;
    reason: string;
  };
  checkin_window: {
    open_at: string;
    close_at: string;
    slot_start: string;
    slot_end: string;
    qr_expires_at: string | null;
    checked_at: string;
  };
};

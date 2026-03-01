import { API_BASE_URL } from "@/src/lib/config";
import { tokenStorage } from "@/src/lib/auth";
import type {
  BreedStatsPeriod,
  BreedStatsResponse,
  CurrentStats,
  Dog,
  HomeHeroSlide,
  HomeHeroSlideCreateInput,
  HomeHeroSlideUpdateInput,
  PaymentHistoryItem,
  Reservation,
  SlotAvailability,
  UserProfile,
} from "@/src/lib/types";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type JsonRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
};

type InternalJsonRequestOptions = JsonRequestOptions & {
  _retrying?: boolean;
};

let refreshRequest: Promise<string | null> | null = null;

function asList<T>(payload: T[] | { results: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.results ?? [];
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function extractErrorMessage(payload: unknown): string {
  if (!payload) return "API error";
  if (typeof payload === "string") return payload;

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (record.code === "token_not_valid") {
      return "セッションの有効期限が切れました。再ログインしてください。";
    }
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;

    for (const [field, value] of Object.entries(record)) {
      if (Array.isArray(value) && value.length) {
        return `${field}: ${value.map((item) => String(item)).join(", ")}`;
      }
      if (typeof value === "string" && value.length) {
        return `${field}: ${value}`;
      }
    }
  }

  return "API error";
}

function isUnauthorized(statusCode: number) {
  return statusCode === 401;
}

function buildAuthHeaders(auth = true, tokenOverride?: string | null): HeadersInit {
  const headers: HeadersInit = {};
  const token = tokenOverride ?? tokenStorage.getAccessToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  let response: Response;
  let payload: unknown;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    payload = await parseResponse(response);
  } catch {
    tokenStorage.clear();
    return null;
  }

  if (!response.ok || !payload || typeof payload !== "object") {
    tokenStorage.clear();
    return null;
  }

  const record = payload as Record<string, unknown>;
  const nextAccessToken = typeof record.access === "string" ? record.access : null;
  const nextRefreshToken = typeof record.refresh === "string" ? record.refresh : refreshToken;

  if (!nextAccessToken) {
    tokenStorage.clear();
    return null;
  }

  tokenStorage.setTokens(nextAccessToken, nextRefreshToken);
  return nextAccessToken;
}

async function getRefreshedAccessToken() {
  if (!refreshRequest) {
    refreshRequest = refreshAccessToken().finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

async function apiRequest<T>(path: string, options: InternalJsonRequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    ...buildAuthHeaders(options.auth !== false),
    "Content-Type": "application/json",
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (options.auth !== false && !options._retrying && isUnauthorized(response.status)) {
      const refreshedToken = await getRefreshedAccessToken();
      if (refreshedToken) {
        return apiRequest<T>(path, { ...options, _retrying: true });
      }
      throw new Error("セッションの有効期限が切れました。再ログインしてください。");
    }
    throw new Error(extractErrorMessage(payload));
  }

  return payload as T;
}

async function apiFormRequest<T>(
  path: string,
  formData: FormData,
  method: HttpMethod = "POST",
  retrying = false,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildAuthHeaders(true),
    body: formData,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    if (!retrying && isUnauthorized(response.status)) {
      const refreshedToken = await getRefreshedAccessToken();
      if (refreshedToken) {
        return apiFormRequest<T>(path, formData, method, true);
      }
      throw new Error("セッションの有効期限が切れました。再ログインしてください。");
    }
    throw new Error(extractErrorMessage(payload));
  }

  return payload as T;
}

export const apiClient = {
  async lineLogin(input: { id_token?: string; line_user_id?: string; display_name?: string; email?: string }) {
    return apiRequest<{ access: string; refresh: string; user: UserProfile; is_new_user: boolean }>("/auth/line", {
      method: "POST",
      body: input,
      auth: false,
    });
  },

  async getMe() {
    return apiRequest<UserProfile>("/auth/me");
  },

  async updateMe(input: Partial<Pick<UserProfile, "display_name" | "email" | "phone_number">>) {
    return apiRequest<UserProfile>("/auth/me", { method: "PATCH", body: input });
  },

  async getDogs() {
    const payload = await apiRequest<Dog[] | { results: Dog[] }>("/dogs/");
    return asList(payload);
  },

  async createDog(input: {
    name: string;
    breed: string;
    breed_group?: string;
    weight_kg: number;
    size_category: "small" | "medium" | "large";
    gender?: "male" | "female" | "unknown";
    birth_date?: string;
    vaccine_expires_on: string;
    notes?: string;
    vaccine_proof_image?: File | null;
  }) {
    const formData = new FormData();
    formData.append("name", input.name);
    formData.append("breed", input.breed);
    if (input.breed_group) formData.append("breed_group", input.breed_group);
    formData.append("weight_kg", String(input.weight_kg));
    formData.append("size_category", input.size_category);
    if (input.gender) formData.append("gender", input.gender);
    if (input.birth_date) formData.append("birth_date", input.birth_date);
    formData.append("vaccine_expires_on", input.vaccine_expires_on);
    if (input.notes) formData.append("notes", input.notes);
    if (input.vaccine_proof_image) formData.append("vaccine_proof_image", input.vaccine_proof_image);

    return apiFormRequest<Dog>("/dogs/", formData, "POST");
  },

  async updateDog(
    dogId: number,
    input: {
      name?: string;
      breed?: string;
      breed_group?: string;
      weight_kg?: number;
      size_category?: "small" | "medium" | "large";
      gender?: "male" | "female" | "unknown";
      birth_date?: string;
      vaccine_expires_on?: string;
      notes?: string;
      vaccine_proof_image?: File | null;
    },
  ) {
    const formData = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });

    return apiFormRequest<Dog>(`/dogs/${dogId}/`, formData, "PATCH");
  },

  async getReservations() {
    const payload = await apiRequest<Reservation[] | { results: Reservation[] }>("/reservations/");
    return asList(payload);
  },

  async createReservation(input: {
    date: string;
    start_time: string;
    end_time: string;
    party_size: number;
    dog_ids: number[];
    note?: string;
  }) {
    return apiRequest<Reservation>("/reservations/", { method: "POST", body: input });
  },

  async cancelReservation(reservationId: number, reason = "") {
    return apiRequest<{ reservation_id: number; status: string; refund_eligible: boolean }>(
      `/reservations/${reservationId}/cancel/`,
      {
        method: "POST",
        body: { reason },
      },
    );
  },

  async getAvailability(date: string) {
    return apiRequest<{ date: string; slots: SlotAvailability[]; rain_closed?: boolean }>(`/reservations/availability?date=${date}`, {
      auth: false,
    });
  },

  async createCheckoutSession(input: { reservation_id: number; success_url: string; cancel_url: string }) {
    return apiRequest<{ checkout_url: string; session_id: string }>("/payments/checkout-session", {
      method: "POST",
      body: input,
    });
  },

  async getPaymentHistory() {
    return apiRequest<PaymentHistoryItem[]>("/payments/history");
  },

  async checkinByQr(qr_token: string) {
    return apiRequest<{ reservation_id: number; status: string; checked_in_at: string }>("/checkins/qr", {
      method: "POST",
      body: { qr_token },
    });
  },

  async getCurrentStats() {
    return apiRequest<CurrentStats>("/stats/current", { auth: false });
  },

  async getBreedStats(period: BreedStatsPeriod, options?: { date?: string; month?: string }) {
    const params = new URLSearchParams({ period });
    if (options?.date) params.set("date", options.date);
    if (options?.month) params.set("month", options.month);
    return apiRequest<BreedStatsResponse>(`/stats/breeds?${params.toString()}`, { auth: false });
  },

  async getHomeHeroSlides() {
    return apiRequest<HomeHeroSlide[]>("/content/home-hero-slides", { auth: false });
  },

  async getAdminDashboard() {
    return apiRequest<{
      today_date: string;
      members: number;
      dogs: number;
      today_reservations: number;
      today_checkins: number;
      active_checkins: number;
      pending_payment: number;
      no_show_today: number;
      sales_today: number;
    }>("/admin/dashboard");
  },

  async getAdminMembers() {
    const payload = await apiRequest<
      Array<UserProfile & { dog_count: number }> | { results: Array<UserProfile & { dog_count: number }> }
    >("/admin/members/");
    return asList(payload);
  },

  async getAdminDogs() {
    const payload = await apiRequest<Dog[] | { results: Dog[] }>("/admin/dogs/");
    return asList(payload);
  },

  async getAdminHomeHeroSlides() {
    const payload = await apiRequest<HomeHeroSlide[] | { results: HomeHeroSlide[] }>("/admin/home-hero-slides/");
    return asList(payload);
  },

  async createAdminHomeHeroSlide(input: HomeHeroSlideCreateInput) {
    const formData = new FormData();
    formData.append("title", input.title);
    if (input.description) formData.append("description", input.description);
    if (input.alt_text) formData.append("alt_text", input.alt_text);
    formData.append("display_order", String(input.display_order));
    formData.append("is_active", String(input.is_active));
    formData.append("image", input.image);
    return apiFormRequest<HomeHeroSlide>("/admin/home-hero-slides/", formData, "POST");
  },

  async updateAdminHomeHeroSlide(slideId: number, input: HomeHeroSlideUpdateInput) {
    const formData = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });
    return apiFormRequest<HomeHeroSlide>(`/admin/home-hero-slides/${slideId}/`, formData, "PATCH");
  },

  async deleteAdminHomeHeroSlide(slideId: number) {
    return apiRequest<void>(`/admin/home-hero-slides/${slideId}/`, { method: "DELETE" });
  },

  async reviewAdminDogVaccine(
    dogId: number,
    input: { vaccine_approval_status: "approved" | "rejected"; vaccine_review_note?: string },
  ) {
    return apiRequest<Dog>(`/admin/dogs/${dogId}/review_vaccine/`, {
      method: "POST",
      body: input,
    });
  },

  async getAdminReservations() {
    const payload = await apiRequest<Reservation[] | { results: Reservation[] }>("/admin/reservations/");
    return asList(payload);
  },

  async getAdminCheckins() {
    const payload = await apiRequest<
      | Array<{
          id: number;
          reservation_id: number;
          user_display_name: string;
          action: string;
          source: string;
          scanned_at: string;
        }>
      | {
          results: Array<{
            id: number;
            reservation_id: number;
            user_display_name: string;
            action: string;
            source: string;
            scanned_at: string;
          }>;
        }
    >("/admin/checkins/");
    return asList(payload);
  },

  async getAdminSales() {
    return apiRequest<Array<{ currency: string; total_amount: number }>>("/admin/sales");
  },
};

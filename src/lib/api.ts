// Typed wrappers around supabase.functions.invoke for all migrated backend endpoints.
// Each function returns typed data or throws an Error with a message safe to display.

import { supabase, isSupabaseConfigured } from "../integrations/supabase/client";
import i18n from "./i18n";
import type {
  Restaurant,
  Salon,
  Service,
  Table,
  TableBooking,
  ServiceBooking,
} from "../types";

// ---------- shared helpers ----------

interface InvokeResult<T> {
  data: T | null;
  error: { message?: string } | null;
}

/**
 * Maps Supabase edge-function names to local Express endpoints when Supabase is
 * not configured. This lets the app run with the built-in in-memory server
 * without requiring real Supabase credentials.
 */
function localEndpoint(fnName: string, method?: string): string | null {
  if (method === "GET" && fnName.startsWith("tables?")) return `/api/${fnName}`;
  switch (fnName) {
    case "restaurants":
    case "salons":
    case "services":
      return `/api/${fnName}`;
    case "book-table":
      return "/api/tables/book";
    case "book-service":
      return "/api/services/book";
    default:
      return null;
  }
}

async function invokeLocalOrThrow<T>(
  fnName: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
  fallbackError = "Request failed"
): Promise<T> {
  const endpoint = localEndpoint(fnName, options.method);
  if (!endpoint) {
    throw new Error(fallbackError);
  }

  const attempt = async () => {
    const response = await fetch(endpoint, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "Request failed");
      throw new Error(text || fallbackError);
    }
    return (await response.json()) as T;
  };

  try {
    return await attempt();
  } catch (err) {
    // Retry once after a short delay. The dev server can be a few ms behind
    // the browser during the first load, so a single retry removes transient
    // startup failures without hiding real errors.
    await new Promise((resolve) => setTimeout(resolve, 300));
    return await attempt();
  }
}

/**
 * Runs supabase.functions.invoke and normalizes errors into thrown Error objects.
 * Uses the server-provided error message when present, otherwise falls back
 * to the raw invoke error, otherwise a generic message.
 *
 * When Supabase is not configured, falls back to the local Express endpoints
 * served by server.ts so the app can run with demo data.
 */
async function invokeOrThrow<T>(
  fnName: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
  fallbackError = "Request failed"
): Promise<T> {
  if (!isSupabaseConfigured) {
    return invokeLocalOrThrow<T>(fnName, options, fallbackError);
  }

  const { data, error } = (await supabase.functions.invoke(fnName, {
    method: options.method ?? "GET",
    body: options.body as never,
  })) as InvokeResult<unknown>;

  if (error) {
    const serverMsg =
      data && typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error ?? "")
        : "";
    throw new Error(serverMsg || error.message || fallbackError);
  }

  return data as T;
}

// ---------- Restaurants ----------

export function listRestaurants(): Promise<Restaurant[]> {
  return invokeOrThrow<Restaurant[]>("restaurants", { method: "GET" }, i18n.t("api.loadRestaurantsError"))
    .then((data) => (Array.isArray(data) ? data : []));
}

export interface RegisterRestaurantInput {
  name: string;
  description?: string;
  cuisine?: string;
  tablesCount?: string;
  image?: string;
}

export function registerRestaurant(input: RegisterRestaurantInput): Promise<Restaurant> {
  return invokeOrThrow<Restaurant>(
    "restaurants",
    { method: "POST", body: input },
    i18n.t("api.registerRestaurantError")
  );
}

// ---------- Salons ----------

export function listSalons(): Promise<Salon[]> {
  return invokeOrThrow<Salon[]>("salons", { method: "GET" }, i18n.t("api.loadSalonsError"))
    .then((data) => (Array.isArray(data) ? data : []));
}

export interface RegisterSalonInput {
  name: string;
  description?: string;
  category?: string;
  address?: string;
  image?: string;
  serviceName?: string;
  servicePrice?: string;
  serviceDuration?: string;
}

export function registerSalon(input: RegisterSalonInput): Promise<Salon> {
  return invokeOrThrow<Salon>(
    "salons",
    { method: "POST", body: input },
    i18n.t("api.registerSalonError")
  );
}

// ---------- Services ----------

export function listServices(): Promise<Service[]> {
  return invokeOrThrow<Service[]>("services", { method: "GET" }, i18n.t("api.loadServicesError"))
    .then((data) => (Array.isArray(data) ? data : []));
}

// ---------- Tables ----------

export interface ListTablesInput {
  restaurantId: string;
  time: string;
}

export function listTables({ restaurantId, time }: ListTablesInput): Promise<Table[]> {
  const path = `tables?restaurantId=${encodeURIComponent(restaurantId)}&time=${encodeURIComponent(time)}`;
  return invokeOrThrow<Table[]>(path, { method: "GET" }, i18n.t("api.loadTablesError"))
    .then((data) => (Array.isArray(data) ? data : []));
}

// ---------- Bookings ----------

export interface BookTableInput {
  userId: string;
  tableId: string;
  tableNumber: number;
  room: "main" | "vip" | "terrace";
  restaurantId?: string;
  restaurantName?: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
  basePrice: number;
  currentBalance: number;

  // Batch booking properties
  tableIds?: string[];
  tableNumbers?: number[];
  rooms?: string[];
  basePrices?: number[];
}

export interface BookTableResult {
  booking: TableBooking;
  bookings?: TableBooking[];
  priceCharged: number;
}

export function bookTable(input: BookTableInput): Promise<BookTableResult> {
  return invokeOrThrow<BookTableResult>(
    "book-table",
    { method: "POST", body: input },
    i18n.t("api.bookTableError")
  );
}

export interface BookServiceInput {
  userId: string;
  serviceId: string;
  serviceName: string;
  category: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  price: number;
  salonId?: string;
  salonName?: string;
  currentBalance: number;
}

export interface BookServiceResult {
  booking: ServiceBooking;
  priceCharged: number;
}

export function bookService(input: BookServiceInput): Promise<BookServiceResult> {
  return invokeOrThrow<BookServiceResult>(
    "book-service",
    { method: "POST", body: input },
    i18n.t("api.bookServiceError")
  );
}

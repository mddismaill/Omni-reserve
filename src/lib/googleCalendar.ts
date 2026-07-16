import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import i18n from "./i18n";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/calendar.events");

// Cache the access token in memory as strictly required
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth listener
export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleCalendarSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(i18n.t("googleCalendar.tokenFailed"));
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get cached access token
export const getCalendarAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Sign out / disconnect
export const googleCalendarSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// --- Google Calendar API Integrations ---

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

// 1. Fetch upcoming events from Google Calendar
export const fetchGoogleCalendarEvents = async (limit = 10): Promise<CalendarEvent[]> => {
  const token = await getCalendarAccessToken();
  if (!token) throw new Error(i18n.t("googleCalendar.noToken"));

  const nowISO = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${nowISO}&orderBy=startTime&singleEvents=true&maxResults=${limit}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || i18n.t("googleCalendar.loadFailed"));
  }

  const data = await res.json();
  return data.items || [];
};

// Helper to construct dateTime for Moscow/Russian time zone standard, or user's local
const getStartEndDateTime = (dateStr: string, timeStr: string, durationMinutes = 120) => {
  // Format should be YYYY-MM-DDTHH:MM:SS
  const startDateTimeStr = `${dateStr}T${timeStr}:00`;
  const startDate = new Date(startDateTimeStr);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  
  // Format back to ISO strings or clean locale strings
  const pad = (num: number) => String(num).padStart(2, "0");
  
  const formatDateOffset = (d: Date) => {
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    
    // Get time zone offset in hours and minutes
    const offset = -d.getTimezoneOffset();
    const offsetSign = offset >= 0 ? "+" : "-";
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMins = pad(Math.abs(offset) % 60);
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMins}`;
  };

  return {
    start: formatDateOffset(startDate),
    end: formatDateOffset(endDate)
  };
};

// 2. Add Booking to Google Calendar
export const addBookingToGoogleCalendar = async (
  booking: any,
  durationMinutes = 120
): Promise<CalendarEvent> => {
  const token = await getCalendarAccessToken();
  if (!token) throw new Error(i18n.t("googleCalendar.noToken"));

  const { start, end } = getStartEndDateTime(booking.date, booking.time, durationMinutes);

  const summary = booking.type === "table" 
    ? i18n.t("googleCalendar.tableSummary", { tableNumber: booking.tableNumber, restaurantName: booking.restaurantName || "OmniReserve" })
    : i18n.t("googleCalendar.serviceSummary", { serviceName: booking.serviceName, staffName: booking.staffName });

  const roomLabel = booking.room === "vip" 
    ? i18n.t("googleCalendar.vip") 
    : booking.room === "terrace" 
      ? i18n.t("googleCalendar.terrace") 
      : i18n.t("googleCalendar.main");

  const notesLabel = booking.notes || i18n.t("googleCalendar.noNotes");

  const description = booking.type === "table"
    ? i18n.t("googleCalendar.tableDesc", {
        restaurantName: booking.restaurantName || "OmniReserve",
        tableNumber: booking.tableNumber,
        room: roomLabel,
        guests: booking.guests,
        notes: notesLabel,
        price: booking.price
      })
    : i18n.t("googleCalendar.serviceDesc", {
        serviceName: booking.serviceName,
        category: booking.category,
        staffName: booking.staffName,
        salonName: booking.salonName || "Lotus Spa",
        price: booking.price
      });

  const location = booking.type === "table"
    ? `${booking.restaurantName || "OmniReserve"}, ${i18n.t("googleCalendar.locationSuffix")}`
    : `${booking.salonName || "Lotus Spa & Wellness"}, ${i18n.t("googleCalendar.locationSuffix")}`;

  const eventBody = {
    summary,
    location,
    description,
    start: {
      dateTime: start,
      timeZone: "Europe/Moscow"
    },
    end: {
      dateTime: end,
      timeZone: "Europe/Moscow"
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 120 }
      ]
    }
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventBody)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || i18n.t("googleCalendar.saveFailed"));
  }

  return await res.json();
};

// 3. Remove/Delete Event from Google Calendar
export const deleteGoogleCalendarEvent = async (eventId: string): Promise<void> => {
  const token = await getCalendarAccessToken();
  if (!token) throw new Error(i18n.t("googleCalendar.noToken"));

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok && res.status !== 404) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || i18n.t("googleCalendar.deleteFailed"));
  }
};

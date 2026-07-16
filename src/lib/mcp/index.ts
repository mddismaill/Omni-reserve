import { auth, defineMcp } from "npm:@lovable.dev/mcp-js";
import listPublishedBusinessesTool from "./tools/list-published-businesses.ts";
import listMyBookingsTool from "./tools/list-my-bookings.ts";
import cancelBookingTool from "./tools/cancel-booking.ts";

// The OAuth issuer MUST be the direct Supabase host (RFC 8414 §3.3).
// Build from VITE_SUPABASE_PROJECT_ID (Vite inlines this at build time).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "book-dine-find-mcp",
  title: "Book, Dine & Find",
  version: "0.1.0",
  instructions:
    "Tools for the Book, Dine & Find app. Use `list_published_businesses` to browse restaurants and services, `list_my_bookings` to see the signed-in user's reservations, and `cancel_booking` to cancel one of their bookings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPublishedBusinessesTool, listMyBookingsTool, cancelBookingTool],
});

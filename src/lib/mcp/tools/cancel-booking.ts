import { createClient } from "npm:@supabase/supabase-js";
import { defineTool, type ToolContext } from "npm:@lovable.dev/mcp-js";
import { z } from "npm:zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "cancel_booking",
  title: "Cancel booking",
  description: "Cancel one of the signed-in user's bookings by id. Sets status to 'cancelled'.",
  inputSchema: {
    booking_id: z.string().uuid().describe("The booking id to cancel."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
  handler: async ({ booking_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking_id)
      .eq("client_id", ctx.getUserId())
      .select("id, status")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Booking not found or not owned by you." }], isError: true };
    return {
      content: [{ type: "text", text: `Booking ${data.id} cancelled.` }],
      structuredContent: { booking: data },
    };
  },
});

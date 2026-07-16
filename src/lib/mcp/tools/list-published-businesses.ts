import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_published_businesses",
  title: "List published businesses",
  description: "List published businesses in the directory. Optionally filter by city, kind (restaurant/service), or a text search on name.",
  inputSchema: {
    city: z.string().optional().describe("Filter by city name."),
    kind: z.enum(["restaurant", "service"]).optional().describe("Filter by business kind."),
    search: z.string().optional().describe("Case-insensitive substring match on the business name."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, kind, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("businesses")
      .select("id, slug, name, description, category, city, cuisine, kind, price_tier, address")
      .eq("is_published", true)
      .limit(limit ?? 20);
    if (city) query = query.eq("city", city);
    if (kind) query = query.eq("kind", kind);
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { businesses: data ?? [] },
    };
  },
});

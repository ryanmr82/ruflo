// /routes/api/consumes/admin/update.ts
// Admin endpoint to update consume prices and settings

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();

const CONFIG_KEY = ["consumes", "config"];
const PRICES_KEY = ["consumes", "prices"];
const STATIC_PRICES_KEY = ["consumes", "staticPrices"];

export const handler: Handlers = {
  async POST(req) {
    try {
      // Check for admin auth cookie
      const cookies = req.headers.get("cookie") || "";
      if (!cookies.includes("admin_auth=true")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = await req.json();
      const { discountPercent, items } = body;

      // Update discount percent in config
      if (typeof discountPercent === "number") {
        await kv.set(CONFIG_KEY, { discountPercent });
      }

      // Update item static prices
      if (items && typeof items === "object") {
        // Get current static prices
        const staticResult = await kv.get(STATIC_PRICES_KEY);
        const staticPrices = (staticResult.value as Record<string, { staticPrice?: number; isStatic: boolean }>) || {};

        // Merge updates
        for (const [itemId, update] of Object.entries(items)) {
          const itemUpdate = update as { staticPrice?: number; isStatic: boolean };
          if (itemUpdate.isStatic) {
            staticPrices[itemId] = {
              isStatic: true,
              staticPrice: itemUpdate.staticPrice
            };
          } else {
            // Remove static price, use AH price with discount
            staticPrices[itemId] = {
              isStatic: false
            };
          }
        }

        await kv.set(STATIC_PRICES_KEY, staticPrices);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      console.error("Admin update error:", e);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

// /routes/api/consumes/config.ts
// API endpoints for consume shop configuration

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();

const CONFIG_KEY = ["consumes", "config"];

interface ConsumesConfig {
  discountPercent: number;
  adminIds: string[];
  notifyOnOrder: boolean;
  notifyChannelId: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_CONFIG: ConsumesConfig = {
  discountPercent: 10,
  adminIds: ["387885041348247552"],
  notifyOnOrder: true,
  notifyChannelId: "1371230469919608882"
};

export const handler: Handlers = {
  // GET /api/consumes/config - Get current config
  async GET(_req) {
    const configResult = await kv.get(CONFIG_KEY);
    const config = configResult.value || DEFAULT_CONFIG;

    return new Response(JSON.stringify(config), {
      headers: { "Content-Type": "application/json" }
    });
  },

  // POST /api/consumes/config - Update config
  async POST(req) {
    try {
      const body = await req.json();

      // Get current config
      const configResult = await kv.get(CONFIG_KEY);
      const config: ConsumesConfig = configResult.value || { ...DEFAULT_CONFIG };

      // Update fields
      if (body.discountPercent !== undefined) {
        config.discountPercent = Math.max(0, Math.min(50, body.discountPercent));
      }
      if (body.adminIds !== undefined && Array.isArray(body.adminIds)) {
        config.adminIds = body.adminIds;
      }
      if (body.notifyOnOrder !== undefined) {
        config.notifyOnOrder = !!body.notifyOnOrder;
      }
      if (body.notifyChannelId !== undefined) {
        config.notifyChannelId = body.notifyChannelId;
      }

      config.updatedAt = new Date().toISOString();
      config.updatedBy = body.updatedBy || "unknown";

      await kv.set(CONFIG_KEY, config);

      return new Response(JSON.stringify({
        success: true,
        config
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  // PATCH /api/consumes/config/admin - Add/remove admin
  async PATCH(req) {
    try {
      const body = await req.json();

      if (!body.userId || !body.action) {
        return new Response(JSON.stringify({ error: "userId and action required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const configResult = await kv.get(CONFIG_KEY);
      const config: ConsumesConfig = configResult.value || { ...DEFAULT_CONFIG };

      if (body.action === "add") {
        if (!config.adminIds.includes(body.userId)) {
          config.adminIds.push(body.userId);
        }
      } else if (body.action === "remove") {
        config.adminIds = config.adminIds.filter(id => id !== body.userId);
      }

      config.updatedAt = new Date().toISOString();
      config.updatedBy = body.updatedBy || "unknown";

      await kv.set(CONFIG_KEY, config);

      return new Response(JSON.stringify({
        success: true,
        adminIds: config.adminIds
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

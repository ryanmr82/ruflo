// /routes/api/consumes/orders.ts
// API endpoints for consume order management with Discord notifications

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();
const DB_PATH = "/home/opc/tbc-website/data.db";

const ORDERS_KEY = ["consumes", "orders"];

// Discord configuration from environment
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") || "1039762365345976330";
const DISCORD_ALCHEMY_CHANNEL_ID = Deno.env.get("DISCORD_ALCHEMY_CHANNEL_ID") || "1371230469919608882";

interface SessionData {
  discordId: string;
  discordUsername: string;
  discordDisplayName: string;
}

interface Order {
  id: string;
  userId: string;
  username: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  completedAt?: string;
  completedBy?: string;
}

// Get user session from cookie (same as raid signup)
async function getSession(req: Request): Promise<SessionData | null> {
  const cookies = req.headers.get("cookie");
  if (!cookies) return null;

  const sessionMatch = cookies.match(/session=([^;]+)/);
  if (!sessionMatch) return null;

  const sessionId = sessionMatch[1];
  const kvDb = await Deno.openKv(DB_PATH);
  const session = await kvDb.get<SessionData>(["sessions", sessionId]);
  kvDb.close();

  return session.value;
}

// Get user's server nickname from Discord API
async function getGuildNickname(discordId: string): Promise<string | null> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    return null;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}`,
      {
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      console.error("[Orders] Failed to fetch guild member:", response.status);
      return null;
    }

    const member = await response.json();
    // nick is the server nickname, null if not set
    return member.nick || null;
  } catch (e) {
    console.error("[Orders] Error fetching guild nickname:", e);
    return null;
  }
}

// Format copper to gold string
function formatPrice(copper: number): string {
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  if (gold > 0) {
    return silver > 0 ? `${gold}g ${silver}s` : `${gold}g`;
  }
  return `${silver}s`;
}

// Send order notification to Discord Alchemy channel
async function notifyDiscord(order: Order): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    console.error("[Orders] No Discord bot token configured");
    return false;
  }

  try {
    const embed = {
      title: "New Consume Order",
      color: 0x00FF00,
      fields: [
        { name: "Item", value: order.itemName, inline: true },
        { name: "Quantity", value: order.quantity.toString(), inline: true },
        { name: "Price", value: formatPrice(order.totalPrice), inline: true },
        { name: "Customer", value: order.username, inline: true },
        { name: "Order ID", value: order.id, inline: true }
      ],
      timestamp: order.createdAt,
      footer: { text: "TBC Guild Consume Shop" }
    };

    if (order.notes) {
      embed.fields.push({ name: "Notes", value: order.notes, inline: false });
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_ALCHEMY_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[Orders] Discord notification failed:", response.status, err);
      return false;
    }

    console.log("[Orders] Discord notification sent for order", order.id);
    return true;
  } catch (e) {
    console.error("[Orders] Discord notification error:", e);
    return false;
  }
}

export const handler: Handlers = {
  // GET /api/consumes/orders - Get orders
  async GET(req) {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("userId");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Get all orders
    const ordersResult = await kv.get(ORDERS_KEY);
    let orders: Order[] = (ordersResult.value as Order[]) || [];

    // Filter by status
    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    // Filter by user
    if (userId) {
      orders = orders.filter(o => o.userId === userId);
    }

    // Sort by date (newest first) and limit
    orders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return new Response(JSON.stringify({
      orders,
      total: orders.length
    }), {
      headers: { "Content-Type": "application/json" }
    });
  },

  // POST /api/consumes/orders - Create new order
  async POST(req) {
    try {
      // Get user from session cookie (same as raid signup)
      const session = await getSession(req);
      if (!session) {
        return new Response(JSON.stringify({ error: "Please log in with Discord to place orders" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = await req.json();

      // Validate
      if (!body.itemId || !body.quantity) {
        return new Response(JSON.stringify({ error: "itemId and quantity required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get user's guild nickname (their WoW character name)
      const guildNickname = await getGuildNickname(session.discordId);

      // Use guild nickname if set, otherwise fall back to display name
      const displayName = guildNickname || session.discordDisplayName || session.discordUsername;

      console.log("[Orders] User info - discordId:", session.discordId,
        "guildNickname:", guildNickname,
        "displayName:", session.discordDisplayName,
        "using:", displayName);

      // Get current orders
      const ordersResult = await kv.get(ORDERS_KEY);
      const orders: Order[] = (ordersResult.value as Order[]) || [];

      // Create new order using guild nickname for username
      const order: Order = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        userId: session.discordId,
        username: displayName,
        itemId: body.itemId,
        itemName: body.itemName || body.itemId,
        quantity: body.quantity,
        unitPrice: body.unitPrice || 0,
        totalPrice: body.totalPrice || (body.unitPrice * body.quantity) || 0,
        notes: body.notes || "",
        status: "pending",
        createdAt: new Date().toISOString()
      };

      orders.push(order);
      await kv.set(ORDERS_KEY, orders);

      // Send Discord notification to Alchemy channel
      const notified = await notifyDiscord(order);

      return new Response(JSON.stringify({
        success: true,
        order,
        discordNotified: notified
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      console.error("[Orders] Error:", e);
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  // PATCH /api/consumes/orders - Update order status
  async PATCH(req) {
    try {
      const body = await req.json();

      if (!body.orderId || !body.status) {
        return new Response(JSON.stringify({ error: "orderId and status required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get orders
      const ordersResult = await kv.get(ORDERS_KEY);
      const orders: Order[] = (ordersResult.value as Order[]) || [];

      // Find and update order
      const orderIndex = orders.findIndex(o => o.id === body.orderId);
      if (orderIndex === -1) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      orders[orderIndex].status = body.status;

      if (body.status === "processing") {
        orders[orderIndex].processedAt = new Date().toISOString();
        orders[orderIndex].processedBy = body.processedBy || "unknown";
      }

      if (body.status === "completed") {
        orders[orderIndex].completedAt = new Date().toISOString();
        orders[orderIndex].completedBy = body.completedBy || "unknown";
      }

      await kv.set(ORDERS_KEY, orders);

      return new Response(JSON.stringify({
        success: true,
        order: orders[orderIndex]
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  // DELETE /api/consumes/orders - Delete/cancel order
  async DELETE(req) {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get orders
    const ordersResult = await kv.get(ORDERS_KEY);
    const orders: Order[] = (ordersResult.value as Order[]) || [];

    // Find order
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Mark as cancelled instead of deleting
    orders[orderIndex].status = "cancelled";
    await kv.set(ORDERS_KEY, orders);

    return new Response(JSON.stringify({
      success: true,
      message: "Order cancelled"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};

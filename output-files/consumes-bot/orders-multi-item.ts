// /routes/api/consumes/orders.ts
// API endpoints for consume order management with multi-item orders

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();
const DB_PATH = "/home/opc/tbc-website/data.db";

const ORDERS_KEY = ["consumes", "orders"];

// Discord configuration
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") || "";
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") || "1039762365345976330";
const DISCORD_ALCHEMY_CHANNEL_ID = Deno.env.get("DISCORD_ALCHEMY_CHANNEL_ID") || "1371230469919608882";

interface SessionData {
  discordId: string;
  discordUsername: string;
  discordDisplayName: string;
}

interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  userId: string;
  username: string;
  items: OrderItem[];
  totalPrice: number;
  notes: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  completedAt?: string;
  completedBy?: string;
}

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

async function getGuildNickname(discordId: string): Promise<string | null> {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) return null;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordId}`,
      { headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}` } }
    );

    if (!response.ok) return null;

    const member = await response.json();
    return member.nick || null;
  } catch (e) {
    console.error("[Orders] Error fetching guild nickname:", e);
    return null;
  }
}

function formatPrice(copper: number): string {
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  if (gold > 0) {
    return silver > 0 ? `${gold}g ${silver}s` : `${gold}g`;
  }
  return `${silver}s`;
}

async function notifyDiscord(order: Order): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    console.error("[Orders] No Discord bot token configured");
    return false;
  }

  try {
    // Build items list for the embed
    const itemsList = order.items.map(item =>
      `• **${item.itemName}** x${item.quantity} - ${formatPrice(item.totalPrice)}`
    ).join("\n");

    const embed = {
      title: "New Consume Order",
      color: 0x00FF00,
      fields: [
        { name: "Customer", value: order.username, inline: true },
        { name: "Order ID", value: order.id, inline: true },
        { name: "Items", value: itemsList || "No items", inline: false },
        { name: "Total", value: formatPrice(order.totalPrice), inline: true }
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
        body: JSON.stringify({ embeds: [embed] })
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
  async GET(req) {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("userId");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const ordersResult = await kv.get(ORDERS_KEY);
    let orders: Order[] = (ordersResult.value as Order[]) || [];

    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    if (userId) {
      orders = orders.filter(o => o.userId === userId);
    }

    orders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return new Response(JSON.stringify({ orders, total: orders.length }), {
      headers: { "Content-Type": "application/json" }
    });
  },

  async POST(req) {
    try {
      const session = await getSession(req);
      if (!session) {
        return new Response(JSON.stringify({ error: "Please log in with Discord to place orders" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = await req.json();

      // Handle both single item (legacy) and multi-item orders
      let items: OrderItem[] = [];
      let totalPrice = 0;

      if (body.items && Array.isArray(body.items)) {
        // Multi-item order
        items = body.items.map((item: any) => ({
          itemId: item.itemId,
          itemName: item.itemName || item.itemId,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || (item.unitPrice * item.quantity) || 0
        }));
        totalPrice = body.totalPrice || items.reduce((sum, item) => sum + item.totalPrice, 0);
      } else if (body.itemId) {
        // Single item order (legacy support)
        items = [{
          itemId: body.itemId,
          itemName: body.itemName || body.itemId,
          quantity: body.quantity || 1,
          unitPrice: body.unitPrice || 0,
          totalPrice: body.totalPrice || (body.unitPrice * body.quantity) || 0
        }];
        totalPrice = items[0].totalPrice;
      } else {
        return new Response(JSON.stringify({ error: "items array or itemId required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get guild nickname for display
      const guildNickname = await getGuildNickname(session.discordId);
      const displayName = guildNickname || session.discordDisplayName || session.discordUsername;

      console.log("[Orders] Creating order for:", displayName, "with", items.length, "items");

      const ordersResult = await kv.get(ORDERS_KEY);
      const orders: Order[] = (ordersResult.value as Order[]) || [];

      const order: Order = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        userId: session.discordId,
        username: displayName,
        items,
        totalPrice,
        notes: body.notes || "",
        status: "pending",
        createdAt: new Date().toISOString()
      };

      orders.push(order);
      await kv.set(ORDERS_KEY, orders);

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

  async PATCH(req) {
    try {
      const body = await req.json();

      if (!body.orderId || !body.status) {
        return new Response(JSON.stringify({ error: "orderId and status required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const ordersResult = await kv.get(ORDERS_KEY);
      const orders: Order[] = (ordersResult.value as Order[]) || [];

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

      return new Response(JSON.stringify({ success: true, order: orders[orderIndex] }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: (e as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  async DELETE(req) {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ordersResult = await kv.get(ORDERS_KEY);
    const orders: Order[] = (ordersResult.value as Order[]) || [];

    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    orders[orderIndex].status = "cancelled";
    await kv.set(ORDERS_KEY, orders);

    return new Response(JSON.stringify({ success: true, message: "Order cancelled" }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};

// /routes/api/consumes/orders.ts
// API endpoints for consume order management

import { Handlers } from "$fresh/server.ts";

const kv = await Deno.openKv();

const ORDERS_KEY = ["consumes", "orders"];

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
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
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
    let orders: Order[] = ordersResult.value || [];

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
      const body = await req.json();

      // Validate
      if (!body.userId || !body.itemId || !body.quantity) {
        return new Response(JSON.stringify({ error: "userId, itemId, and quantity required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get current orders
      const ordersResult = await kv.get(ORDERS_KEY);
      const orders: Order[] = ordersResult.value || [];

      // Create new order
      const order: Order = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        userId: body.userId,
        username: body.username || "Unknown",
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

      return new Response(JSON.stringify({
        success: true,
        order
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
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
      const orders: Order[] = ordersResult.value || [];

      // Find and update order
      const orderIndex = orders.findIndex(o => o.id === body.orderId);
      if (orderIndex === -1) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      orders[orderIndex].status = body.status;
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
      return new Response(JSON.stringify({ error: e.message }), {
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
    const orders: Order[] = ordersResult.value || [];

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

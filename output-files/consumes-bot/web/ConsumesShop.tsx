// /islands/ConsumesShop.tsx
import { useEffect, useState } from "preact/hooks";

interface Item {
  id: string;
  name: string;
  itemId: number;
  staticPrice?: number;
  ahPrice: number | null;
  shopPrice: number | null;
  isStatic: boolean;
  updatedAt: string | null;
}

interface Category {
  name: string;
  items: Item[];
}

interface PricesData {
  discountPercent: number;
  categories: Record<string, Category>;
  lastUpdated?: string;
}

interface Order {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

// Format copper to gold string
function formatGold(copper: number | null): string {
  if (!copper) return "N/A";
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const cop = copper % 100;
  let result = "";
  if (gold > 0) result += `${gold}g `;
  if (silver > 0) result += `${silver}s `;
  if (cop > 0 || result === "") result += `${cop}c`;
  return result.trim();
}

// Format date in user's local timezone
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Format relative time (e.g., "5 minutes ago")
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// Get the most recent update time from all items
function getLastUpdated(categories: Record<string, Category>): string | null {
  let latest: Date | null = null;
  for (const cat of Object.values(categories)) {
    for (const item of cat.items) {
      if (item.updatedAt) {
        const itemDate = new Date(item.updatedAt);
        if (!latest || itemDate > latest) {
          latest = itemDate;
        }
      }
    }
  }
  return latest ? latest.toISOString() : null;
}

export default function ConsumesShop() {
  const [prices, setPrices] = useState<PricesData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("protection");
  const [orderItem, setOrderItem] = useState<Item | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load prices on mount
  useEffect(() => {
    fetchPrices();
  }, []);

  async function fetchPrices() {
    try {
      setLoading(true);
      const response = await fetch("/api/consumes/prices");
      if (!response.ok) throw new Error("Failed to load prices");
      const data = await response.json();
      setPrices(data);
      setError(null);
    } catch (e) {
      setError("Failed to load prices. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function placeOrder() {
    if (!orderItem) return;

    try {
      setOrderStatus("placing");
      const response = await fetch("/api/consumes/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "web-user", // Will be replaced with Discord ID when auth is added
          username: "Web User",
          itemId: orderItem.id,
          itemName: orderItem.name,
          quantity: orderQuantity,
          unitPrice: orderItem.shopPrice,
          totalPrice: (orderItem.shopPrice || 0) * orderQuantity,
          notes: orderNotes
        })
      });

      if (!response.ok) throw new Error("Failed to place order");

      setOrderStatus("success");
      setOrderItem(null);
      setOrderQuantity(1);
      setOrderNotes("");

      // Clear success message after 3 seconds
      setTimeout(() => setOrderStatus(null), 3000);
    } catch (e) {
      setOrderStatus("error");
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div class="consumes-container">
        <div class="loading">Loading prices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="consumes-container">
        <div class="error">{error}</div>
        <button onClick={fetchPrices}>Retry</button>
      </div>
    );
  }

  const categories = prices?.categories || {};
  const currentCategory = categories[selectedCategory];

  return (
    <div class="consumes-container">
      <style>{`
        .consumes-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .consumes-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .consumes-header h1 {
          color: var(--text-primary, #e0c89b);
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .consumes-header .discount-badge {
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 1.1rem;
          display: inline-block;
        }

        .last-updated-banner {
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 8px;
          padding: 10px 20px;
          margin-top: 15px;
          display: inline-block;
        }

        .last-updated-banner .label {
          color: var(--text-muted, #808080);
          font-size: 0.9rem;
        }

        .last-updated-banner .time {
          color: var(--text-primary, #e0c89b);
          font-weight: bold;
          margin-left: 8px;
        }

        .last-updated-banner .relative {
          color: var(--accent-color, #c9a959);
          margin-left: 8px;
          font-size: 0.9rem;
        }

        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
          justify-content: center;
        }

        .category-tab {
          padding: 10px 20px;
          background: var(--bg-secondary, #2a2a2a);
          border: 2px solid var(--border-color, #4a4a4a);
          border-radius: 8px;
          color: var(--text-secondary, #b0a080);
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-tab:hover {
          border-color: var(--accent-color, #c9a959);
        }

        .category-tab.active {
          background: linear-gradient(135deg, #3d3d3d, #2a2a2a);
          border-color: var(--accent-color, #c9a959);
          color: var(--text-primary, #e0c89b);
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }

        .item-card {
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 10px;
          padding: 15px;
          transition: all 0.2s;
        }

        .item-card:hover {
          border-color: var(--accent-color, #c9a959);
          transform: translateY(-2px);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .item-name {
          color: var(--text-primary, #e0c89b);
          font-weight: bold;
          font-size: 1.1rem;
        }

        .item-acronym {
          background: var(--bg-tertiary, #3a3a3a);
          color: var(--accent-color, #c9a959);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-family: monospace;
        }

        .item-prices {
          margin: 10px 0;
        }

        .shop-price {
          font-size: 1.3rem;
          color: #4a9c2d;
          font-weight: bold;
        }

        .ah-price {
          color: var(--text-muted, #808080);
          text-decoration: line-through;
          font-size: 0.9rem;
          margin-left: 10px;
        }

        .static-badge {
          background: #c9a959;
          color: #1a1a1a;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          margin-left: 10px;
        }

        .no-price {
          color: var(--text-muted, #808080);
          font-style: italic;
        }

        .order-button {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .order-button:hover {
          background: linear-gradient(135deg, #5ab33d, #3d7b2a);
        }

        .order-button:disabled {
          background: #4a4a4a;
          cursor: not-allowed;
        }

        /* Order Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg-primary, #1a1a1a);
          border: 2px solid var(--accent-color, #c9a959);
          border-radius: 15px;
          padding: 30px;
          max-width: 450px;
          width: 90%;
        }

        .modal-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          color: var(--text-primary, #e0c89b);
          margin-bottom: 5px;
        }

        .modal-body {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          color: var(--text-secondary, #b0a080);
          margin-bottom: 5px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 6px;
          color: var(--text-primary, #e0c89b);
          font-size: 1rem;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .order-summary {
          background: var(--bg-secondary, #2a2a2a);
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .order-total {
          font-size: 1.5rem;
          color: #4a9c2d;
          font-weight: bold;
          text-align: center;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .modal-actions button {
          flex: 1;
          padding: 12px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          border: none;
        }

        .btn-cancel {
          background: var(--bg-secondary, #2a2a2a);
          color: var(--text-secondary, #b0a080);
          border: 1px solid var(--border-color, #4a4a4a) !important;
        }

        .btn-confirm {
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          color: white;
        }

        .status-message {
          text-align: center;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .status-success {
          background: rgba(74, 156, 45, 0.2);
          color: #4a9c2d;
          border: 1px solid #4a9c2d;
        }

        .status-error {
          background: rgba(200, 50, 50, 0.2);
          color: #c83232;
          border: 1px solid #c83232;
        }

        .updated-time {
          font-size: 0.8rem;
          color: var(--text-muted, #808080);
          margin-top: 5px;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary, #b0a080);
        }

        @media (max-width: 768px) {
          .consumes-header h1 {
            font-size: 1.8rem;
          }

          .category-tabs {
            flex-direction: column;
          }

          .items-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div class="consumes-header">
        <h1>Guild Consume Shop</h1>
        <div class="discount-badge">
          {prices?.discountPercent}% Off AH Prices for Guild Members
        </div>
        {prices && (() => {
          const lastUpdated = getLastUpdated(prices.categories);
          return lastUpdated ? (
            <div class="last-updated-banner">
              <span class="label">Prices last updated:</span>
              <span class="time">{formatDate(lastUpdated)}</span>
              <span class="relative">({formatRelativeTime(lastUpdated)})</span>
            </div>
          ) : null;
        })()}
      </div>

      {orderStatus === "success" && (
        <div class="status-message status-success">
          Order placed successfully! An alchemist will contact you soon.
        </div>
      )}

      {orderStatus === "error" && (
        <div class="status-message status-error">
          Failed to place order. Please try again or contact an officer.
        </div>
      )}

      <div class="category-tabs">
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            class={`category-tab ${selectedCategory === key ? "active" : ""}`}
            onClick={() => setSelectedCategory(key)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div class="items-grid">
        {currentCategory?.items.map((item) => (
          <div key={item.id} class="item-card">
            <div class="item-header">
              <span class="item-name">{item.name}</span>
              <span class="item-acronym">{item.id}</span>
            </div>

            <div class="item-prices">
              {item.shopPrice ? (
                <>
                  <span class="shop-price">{formatGold(item.shopPrice)}</span>
                  {item.isStatic ? (
                    <span class="static-badge">G-Bank</span>
                  ) : (
                    item.ahPrice && <span class="ah-price">{formatGold(item.ahPrice)}</span>
                  )}
                </>
              ) : (
                <span class="no-price">Price not set</span>
              )}
            </div>

            {item.updatedAt && (
              <div class="updated-time">
                Updated: {formatDate(item.updatedAt)}
              </div>
            )}

            <button
              class="order-button"
              disabled={!item.shopPrice}
              onClick={() => setOrderItem(item)}
            >
              {item.shopPrice ? "Order" : "Unavailable"}
            </button>
          </div>
        ))}
      </div>

      {/* Order Modal */}
      {orderItem && (
        <div class="modal-overlay" onClick={() => setOrderItem(null)}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2>Place Order</h2>
              <div style="color: var(--text-secondary);">{orderItem.name}</div>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={orderQuantity}
                  onInput={(e) => setOrderQuantity(parseInt((e.target as HTMLInputElement).value) || 1)}
                />
              </div>

              <div class="form-group">
                <label>Notes (optional)</label>
                <textarea
                  placeholder="Any special requests or your in-game character name..."
                  value={orderNotes}
                  onInput={(e) => setOrderNotes((e.target as HTMLTextAreaElement).value)}
                />
              </div>

              <div class="order-summary">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Unit Price:</span>
                  <span>{formatGold(orderItem.shopPrice)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Quantity:</span>
                  <span>x{orderQuantity}</span>
                </div>
                <hr style="border-color: var(--border-color); margin: 10px 0;" />
                <div class="order-total">
                  Total: {formatGold((orderItem.shopPrice || 0) * orderQuantity)}
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" onClick={() => setOrderItem(null)}>
                Cancel
              </button>
              <button
                class="btn-confirm"
                onClick={placeOrder}
                disabled={orderStatus === "placing"}
              >
                {orderStatus === "placing" ? "Placing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

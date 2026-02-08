// /islands/ConsumesShop.tsx
import { useEffect, useState } from "preact/hooks";

interface Item {
  id: string;
  name: string;
  itemId: number;
  description: string;
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

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ConsumesShop() {
  const [prices, setPrices] = useState<PricesData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("protection");
  const [orderItem, setOrderItem] = useState<Item | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
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
          userId: "web-user",
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

      setTimeout(() => setOrderStatus(null), 3000);
    } catch (e) {
      setOrderStatus("error");
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div class="consumes-container">
        <div class="loading">Loading alchemy consumables...</div>
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

        .consumes-header .subtitle {
          color: var(--text-secondary, #b0a080);
          font-size: 1.1rem;
          margin-bottom: 15px;
        }

        .consumes-header .discount-badge {
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 1.1rem;
          display: inline-block;
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
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 15px;
        }

        .item-card {
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 10px;
          padding: 15px;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }

        .item-card:hover {
          border-color: var(--accent-color, #c9a959);
          transform: translateY(-2px);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .item-name {
          color: var(--text-primary, #e0c89b);
          font-weight: bold;
          font-size: 1.05rem;
          flex: 1;
        }

        .item-acronym {
          background: var(--bg-tertiary, #3a3a3a);
          color: var(--accent-color, #c9a959);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-family: monospace;
          margin-left: 10px;
          white-space: nowrap;
        }

        .item-description {
          color: var(--text-muted, #909090);
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 12px;
          flex: 1;
        }

        .item-prices {
          margin: 10px 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
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
        }

        .static-badge {
          background: #c9a959;
          color: #1a1a1a;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .no-price {
          color: var(--text-muted, #808080);
          font-style: italic;
        }

        .item-footer {
          margin-top: auto;
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

        .updated-time {
          font-size: 0.75rem;
          color: var(--text-muted, #707070);
          margin-top: 8px;
          text-align: right;
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

        .modal-item-desc {
          color: var(--text-muted, #909090);
          font-size: 0.9rem;
          margin-top: 10px;
          padding: 10px;
          background: var(--bg-secondary, #2a2a2a);
          border-radius: 6px;
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
          box-sizing: border-box;
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

        .loading, .error {
          text-align: center;
          padding: 40px;
          color: var(--text-secondary, #b0a080);
        }

        .wowhead-link {
          font-size: 0.8rem;
          color: var(--accent-color, #c9a959);
          text-decoration: none;
          margin-left: 8px;
        }

        .wowhead-link:hover {
          text-decoration: underline;
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
        <h1>Guild Alchemy Shop</h1>
        <div class="subtitle">Crafted by your guild alchemists with love (and reagents)</div>
        <div class="discount-badge">
          {prices?.discountPercent}% Off AH Prices for Guild Members
        </div>
      </div>

      {orderStatus === "success" && (
        <div class="status-message status-success">
          Order placed successfully! An alchemist will contact you in-game soon.
        </div>
      )}

      {orderStatus === "error" && (
        <div class="status-message status-error">
          Failed to place order. Please try again or contact an officer in Discord.
        </div>
      )}

      <div class="category-tabs">
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            class={`category-tab ${selectedCategory === key ? "active" : ""}`}
            onClick={() => setSelectedCategory(key)}
          >
            {cat.name} ({cat.items.length})
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

            <div class="item-description">
              {item.description}
            </div>

            <div class="item-prices">
              {item.shopPrice ? (
                <>
                  <span class="shop-price">{formatGold(item.shopPrice)}</span>
                  {item.isStatic ? (
                    <span class="static-badge">G-Bank</span>
                  ) : (
                    item.ahPrice && <span class="ah-price">{formatGold(item.ahPrice)} AH</span>
                  )}
                </>
              ) : (
                <span class="no-price">Price not set yet</span>
              )}
              <a
                href={`https://database.turtle-wow.org/?item=${item.itemId}`}
                target="_blank"
                rel="noopener noreferrer"
                class="wowhead-link"
              >
                [DB]
              </a>
            </div>

            <div class="item-footer">
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
                {item.shopPrice ? "Order Now" : "Coming Soon"}
              </button>
            </div>
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
              <div class="modal-item-desc">{orderItem.description}</div>
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
                <label>Notes (include your character name!)</label>
                <textarea
                  placeholder="Your in-game character name and any special requests..."
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
                {orderStatus === "placing" ? "Placing Order..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

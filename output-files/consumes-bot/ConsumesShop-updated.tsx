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

// Parse gold string to copper
function parseGoldString(str: string): number | null {
  if (!str || str.trim() === "") return null;
  let total = 0;
  const goldMatch = str.match(/(\d+)\s*g/i);
  const silverMatch = str.match(/(\d+)\s*s/i);
  const copperMatch = str.match(/(\d+)\s*c/i);
  if (goldMatch) total += parseInt(goldMatch[1]) * 10000;
  if (silverMatch) total += parseInt(silverMatch[1]) * 100;
  if (copperMatch) total += parseInt(copperMatch[1]);
  // If just a number, treat as gold
  if (!goldMatch && !silverMatch && !copperMatch) {
    const num = parseFloat(str);
    if (!isNaN(num)) total = Math.round(num * 10000);
  }
  return total > 0 ? total : null;
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

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [editedDiscount, setEditedDiscount] = useState<number>(10);
  const [editedItems, setEditedItems] = useState<Record<string, { price: string; isFixed: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load prices on mount
  useEffect(() => {
    fetchPrices();
  }, []);

  // Initialize edited values when prices load or admin mode changes
  useEffect(() => {
    if (prices && isAdmin) {
      setEditedDiscount(prices.discountPercent);
      const items: Record<string, { price: string; isFixed: boolean }> = {};
      for (const cat of Object.values(prices.categories)) {
        for (const item of cat.items) {
          items[item.id] = {
            price: item.isStatic && item.staticPrice
              ? formatGold(item.staticPrice)
              : item.shopPrice
                ? formatGold(item.shopPrice)
                : "",
            isFixed: item.isStatic
          };
        }
      }
      setEditedItems(items);
    }
  }, [prices, isAdmin]);

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

  function handleAdminClick() {
    if (isAdmin) {
      // Exit admin mode
      setIsAdmin(false);
      setEditedItems({});
      setSaveMessage(null);
    } else {
      // Show password modal
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError(false);
    }
  }

  async function handlePasswordSubmit() {
    try {
      // Use existing admin auth endpoint
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });

      if (response.ok) {
        setIsAdmin(true);
        setShowPasswordModal(false);
        setPasswordInput("");
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } catch (e) {
      console.error("Auth error:", e);
      setPasswordError(true);
    }
  }

  function updateItemEdit(itemId: string, field: "price" | "isFixed", value: string | boolean) {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  }

  async function saveChanges() {
    setSaving(true);
    setSaveMessage(null);

    try {
      // Build the update payload
      const updates: Record<string, { staticPrice?: number; isStatic: boolean }> = {};

      for (const [itemId, edit] of Object.entries(editedItems)) {
        const priceInCopper = parseGoldString(edit.price);
        updates[itemId] = {
          isStatic: edit.isFixed,
          staticPrice: edit.isFixed ? (priceInCopper || undefined) : undefined
        };
      }

      const response = await fetch("/api/consumes/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountPercent: editedDiscount,
          items: updates
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to save");
      }

      setSaveMessage("Changes saved successfully!");
      // Refresh prices
      await fetchPrices();

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
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

        .discount-badge {
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 1.1rem;
          display: inline-block;
        }

        .discount-badge.editable {
          background: linear-gradient(135deg, #8b5a2b, #654321);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .discount-input {
          width: 60px;
          padding: 4px 8px;
          border: 1px solid #c8a060;
          border-radius: 4px;
          background: rgba(0,0,0,0.3);
          color: white;
          font-size: 1rem;
          text-align: center;
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

        .item-card.admin-mode {
          border-color: #8b5a2b;
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

        .static-badge, .fixed-badge {
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

        /* Admin Edit Controls */
        .admin-controls {
          background: rgba(139, 90, 43, 0.2);
          border: 1px solid #8b5a2b;
          border-radius: 6px;
          padding: 10px;
          margin-top: 10px;
        }

        .admin-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .admin-row:last-child {
          margin-bottom: 0;
        }

        .admin-row label {
          color: var(--text-secondary, #b0a080);
          font-size: 0.85rem;
          min-width: 70px;
        }

        .admin-price-input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 4px;
          background: var(--bg-primary, #1a1a1a);
          color: var(--text-primary, #e0c89b);
          font-size: 0.9rem;
        }

        .admin-price-input:focus {
          border-color: #c9a959;
          outline: none;
        }

        .fixed-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .fixed-toggle input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .fixed-toggle span {
          color: var(--text-secondary, #b0a080);
          font-size: 0.85rem;
        }

        .fixed-toggle input:checked + span {
          color: #c9a959;
          font-weight: bold;
        }

        /* Admin Header Bar */
        .admin-bar {
          background: linear-gradient(135deg, #8b5a2b, #654321);
          border: 1px solid #c8a060;
          border-radius: 10px;
          padding: 15px 20px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .admin-bar-title {
          color: #e0c89b;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .admin-bar-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .save-btn {
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          color: white;
          padding: 8px 20px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn:hover {
          background: linear-gradient(135deg, #5ab33d, #3d7b2a);
        }

        .save-btn:disabled {
          background: #4a4a4a;
          cursor: not-allowed;
        }

        .save-message {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .save-message.success {
          background: rgba(74, 156, 45, 0.3);
          color: #5ab33d;
        }

        .save-message.error {
          background: rgba(200, 50, 50, 0.3);
          color: #ff6b6b;
        }

        /* Password Modal */
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
          max-width: 400px;
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
          box-sizing: border-box;
        }

        .form-group input.error {
          border-color: #ff6b6b;
        }

        .form-group .error-text {
          color: #ff6b6b;
          font-size: 0.85rem;
          margin-top: 5px;
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

        .download-section {
          margin-top: 15px;
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .download-btn {
          background: linear-gradient(135deg, #3d7ab8, #2a5580);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .download-btn:hover {
          background: linear-gradient(135deg, #4a8fd0, #3d7ab8);
          transform: translateY(-2px);
        }

        .admin-toggle {
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          color: var(--text-secondary, #b0a080);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-toggle:hover {
          border-color: var(--text-primary, #e0c89b);
        }

        .admin-toggle.active {
          background: linear-gradient(135deg, #8b5a2b, #654321);
          border-color: #c8a060;
          color: #e0c89b;
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

          .admin-bar {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <div class="consumes-header">
        <h1>Guild Consume Shop</h1>
        {isAdmin ? (
          <div class="discount-badge editable">
            <span>Discount:</span>
            <input
              type="number"
              class="discount-input"
              value={editedDiscount}
              min="0"
              max="100"
              onChange={(e) => setEditedDiscount(parseInt((e.target as HTMLInputElement).value) || 0)}
            />
            <span>% Off AH Prices</span>
          </div>
        ) : (
          <div class="discount-badge">
            {prices?.discountPercent}% Off AH Prices for Guild Members
          </div>
        )}
        <div class="download-section">
          <a href="/GuildShopSync-v2.0.zip" class="download-btn" download="GuildShopSync-v2.0.zip">
            Download Price Scanner Addon
          </a>
          <button
            class={`admin-toggle ${isAdmin ? "active" : ""}`}
            onClick={handleAdminClick}
          >
            {isAdmin ? "Exit Admin Mode" : "Admin Mode"}
          </button>
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

      {/* Admin Bar */}
      {isAdmin && (
        <div class="admin-bar">
          <div class="admin-bar-title">Admin Mode Active - Edit prices below</div>
          <div class="admin-bar-actions">
            {saveMessage && (
              <span class={`save-message ${saveMessage.includes("success") ? "success" : "error"}`}>
                {saveMessage}
              </span>
            )}
            <button class="save-btn" onClick={saveChanges} disabled={saving}>
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      )}

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
        {currentCategory?.items.map((item) => {
          const editData = editedItems[item.id] || { price: "", isFixed: false };

          return (
            <div key={item.id} class={`item-card ${isAdmin ? "admin-mode" : ""}`}>
              <div class="item-header">
                <span class="item-name">{item.name}</span>
                <span class="item-acronym">{item.id}</span>
              </div>

              <div class="item-prices">
                {item.shopPrice ? (
                  <>
                    <span class="shop-price">{formatGold(item.shopPrice)}</span>
                    {item.isStatic ? (
                      <span class="fixed-badge">Fixed</span>
                    ) : (
                      item.ahPrice && <span class="ah-price">{formatGold(item.ahPrice)}</span>
                    )}
                  </>
                ) : (
                  <span class="no-price">Price not set</span>
                )}
              </div>

              {item.updatedAt && !isAdmin && (
                <div class="updated-time">
                  Updated: {formatDate(item.updatedAt)}
                </div>
              )}

              {/* Admin Edit Controls */}
              {isAdmin && (
                <div class="admin-controls">
                  <div class="admin-row">
                    <label class="fixed-toggle">
                      <input
                        type="checkbox"
                        checked={editData.isFixed}
                        onChange={(e) => updateItemEdit(item.id, "isFixed", (e.target as HTMLInputElement).checked)}
                      />
                      <span>Fixed Price</span>
                    </label>
                  </div>
                  {editData.isFixed && (
                    <div class="admin-row">
                      <label>Price:</label>
                      <input
                        type="text"
                        class="admin-price-input"
                        placeholder="e.g. 5g 50s"
                        value={editData.price}
                        onInput={(e) => updateItemEdit(item.id, "price", (e.target as HTMLInputElement).value)}
                      />
                    </div>
                  )}
                  {!editData.isFixed && item.ahPrice && (
                    <div class="admin-row" style="font-size: 0.85rem; color: var(--text-muted);">
                      Auto: {formatGold(Math.round(item.ahPrice * (100 - editedDiscount) / 100))} ({editedDiscount}% off {formatGold(item.ahPrice)})
                    </div>
                  )}
                </div>
              )}

              {!isAdmin && (
                <button
                  class="order-button"
                  disabled={!item.shopPrice}
                  onClick={() => setOrderItem(item)}
                >
                  {item.shopPrice ? "Order" : "Unavailable"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div class="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div class="modal-content" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2>Admin Login</h2>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Password</label>
                <input
                  type="password"
                  class={passwordError ? "error" : ""}
                  value={passwordInput}
                  onInput={(e) => {
                    setPasswordInput((e.target as HTMLInputElement).value);
                    setPasswordError(false);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handlePasswordSubmit();
                  }}
                  placeholder="Enter admin password"
                  autoFocus
                />
                {passwordError && <div class="error-text">Incorrect password</div>}
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button class="btn-confirm" onClick={handlePasswordSubmit}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}

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

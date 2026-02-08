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

interface CartItem {
  item: Item;
  quantity: number;
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
  if (!goldMatch && !silverMatch && !copperMatch) {
    const num = parseFloat(str);
    if (!isNaN(num)) total = Math.round(num * 10000);
  }
  return total > 0 ? total : null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [showCart, setShowCart] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [editedDiscount, setEditedDiscount] = useState<number>(10);
  const [editedItems, setEditedItems] = useState<Record<string, { price: string; isFixed: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

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

  // Cart functions
  function addToCart(item: Item, quantity: number = 1) {
    if (!item.shopPrice) return;
    setCart(prev => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: existing ? existing.quantity + quantity : quantity
        }
      };
    });
  }

  function updateCartQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity }
    }));
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[itemId];
      return newCart;
    });
  }

  function clearCart() {
    setCart({});
    setOrderNotes("");
  }

  function getCartTotal(): number {
    return Object.values(cart).reduce((total, { item, quantity }) => {
      return total + (item.shopPrice || 0) * quantity;
    }, 0);
  }

  function getCartItemCount(): number {
    return Object.values(cart).reduce((count, { quantity }) => count + quantity, 0);
  }

  async function placeOrder() {
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) return;

    try {
      setOrderStatus("placing");

      // Build items array for the order
      const items = cartItems.map(({ item, quantity }) => ({
        itemId: item.id,
        itemName: item.name,
        quantity,
        unitPrice: item.shopPrice || 0,
        totalPrice: (item.shopPrice || 0) * quantity
      }));

      const response = await fetch("/api/consumes/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          notes: orderNotes,
          totalPrice: getCartTotal()
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to place order");
      }

      setOrderStatus("success");
      clearCart();
      setShowCart(false);

      setTimeout(() => setOrderStatus(null), 5000);
    } catch (e) {
      setOrderStatus("error");
      console.error(e);
    }
  }

  // Admin functions
  function handleAdminClick() {
    if (isAdmin) {
      setIsAdmin(false);
      setEditedItems({});
      setSaveMessage(null);
    } else {
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError(false);
    }
  }

  async function handlePasswordSubmit() {
    try {
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
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  }

  async function saveChanges() {
    setSaving(true);
    setSaveMessage(null);

    try {
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
        body: JSON.stringify({ discountPercent: editedDiscount, items: updates })
      });

      if (!response.ok) throw new Error("Failed to save");

      setSaveMessage("Changes saved successfully!");
      await fetchPrices();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div class="consumes-container"><div class="loading">Loading prices...</div></div>;
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
  const cartItemCount = getCartItemCount();

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
        .header-actions {
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
        .cart-btn {
          background: linear-gradient(135deg, #c9a959, #a08040);
          color: #1a1a1a;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-weight: bold;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          position: relative;
        }
        .cart-btn:hover {
          background: linear-gradient(135deg, #dab96a, #b09050);
          transform: translateY(-2px);
        }
        .cart-badge {
          background: #ff4444;
          color: white;
          border-radius: 50%;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
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
        .last-updated-banner {
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 8px;
          padding: 10px 20px;
          margin-top: 15px;
          display: inline-block;
        }
        .last-updated-banner .label { color: var(--text-muted, #808080); font-size: 0.9rem; }
        .last-updated-banner .time { color: var(--text-primary, #e0c89b); font-weight: bold; margin-left: 8px; }
        .last-updated-banner .relative { color: var(--accent-color, #c9a959); margin-left: 8px; font-size: 0.9rem; }
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
        .category-tab:hover { border-color: var(--accent-color, #c9a959); }
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
        .item-card.in-cart {
          border-color: #4a9c2d;
          box-shadow: 0 0 10px rgba(74, 156, 45, 0.3);
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }
        .item-name { color: var(--text-primary, #e0c89b); font-weight: bold; font-size: 1.1rem; }
        .item-acronym {
          background: var(--bg-tertiary, #3a3a3a);
          color: var(--accent-color, #c9a959);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-family: monospace;
        }
        .item-prices { margin: 10px 0; }
        .shop-price { font-size: 1.3rem; color: #4a9c2d; font-weight: bold; }
        .ah-price { color: var(--text-muted, #808080); text-decoration: line-through; font-size: 0.9rem; margin-left: 10px; }
        .fixed-badge { background: #c9a959; color: #1a1a1a; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 10px; }
        .no-price { color: var(--text-muted, #808080); font-style: italic; }
        .add-to-cart-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 10px;
        }
        .qty-control {
          display: flex;
          align-items: center;
          background: var(--bg-tertiary, #3a3a3a);
          border-radius: 6px;
          overflow: hidden;
        }
        .qty-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-primary, #e0c89b);
          font-size: 1.2rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .qty-btn:hover { background: rgba(255,255,255,0.1); }
        .qty-input {
          width: 40px;
          text-align: center;
          border: none;
          background: transparent;
          color: var(--text-primary, #e0c89b);
          font-size: 1rem;
          padding: 4px 0;
        }
        .qty-input::-webkit-inner-spin-button,
        .qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .add-btn {
          flex: 1;
          padding: 8px 12px;
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-btn:hover { background: linear-gradient(135deg, #5ab33d, #3d7b2a); }
        .add-btn:disabled { background: #4a4a4a; cursor: not-allowed; }
        .in-cart-indicator {
          color: #4a9c2d;
          font-size: 0.85rem;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        /* Cart Panel */
        .cart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
        }
        .cart-panel {
          width: 400px;
          max-width: 100%;
          background: var(--bg-primary, #1a1a1a);
          height: 100%;
          display: flex;
          flex-direction: column;
          border-left: 2px solid var(--accent-color, #c9a959);
        }
        .cart-header {
          padding: 20px;
          border-bottom: 1px solid var(--border-color, #4a4a4a);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cart-header h2 { color: var(--text-primary, #e0c89b); margin: 0; }
        .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #b0a080);
          font-size: 1.5rem;
          cursor: pointer;
        }
        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
        }
        .cart-item {
          background: var(--bg-secondary, #2a2a2a);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
        }
        .cart-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .cart-item-name { color: var(--text-primary, #e0c89b); font-weight: bold; }
        .cart-item-remove {
          background: none;
          border: none;
          color: #ff6b6b;
          cursor: pointer;
          font-size: 1rem;
        }
        .cart-item-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cart-item-price { color: #4a9c2d; font-weight: bold; }
        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cart-item-qty input {
          width: 50px;
          padding: 4px;
          text-align: center;
          background: var(--bg-tertiary, #3a3a3a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 4px;
          color: var(--text-primary, #e0c89b);
        }
        .cart-empty {
          text-align: center;
          color: var(--text-muted, #808080);
          padding: 40px 20px;
        }
        .cart-footer {
          padding: 20px;
          border-top: 1px solid var(--border-color, #4a4a4a);
        }
        .cart-notes {
          margin-bottom: 15px;
        }
        .cart-notes label {
          display: block;
          color: var(--text-secondary, #b0a080);
          margin-bottom: 5px;
          font-size: 0.9rem;
        }
        .cart-notes textarea {
          width: 100%;
          padding: 10px;
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 6px;
          color: var(--text-primary, #e0c89b);
          resize: vertical;
          min-height: 60px;
          box-sizing: border-box;
        }
        .cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          font-size: 1.2rem;
        }
        .cart-total-label { color: var(--text-secondary, #b0a080); }
        .cart-total-value { color: #4a9c2d; font-weight: bold; font-size: 1.4rem; }
        .checkout-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        .checkout-btn:hover { background: linear-gradient(135deg, #5ab33d, #3d7b2a); }
        .checkout-btn:disabled { background: #4a4a4a; cursor: not-allowed; }
        .clear-cart-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 6px;
          color: var(--text-secondary, #b0a080);
          margin-top: 10px;
          cursor: pointer;
        }
        .clear-cart-btn:hover { border-color: #ff6b6b; color: #ff6b6b; }
        /* Status Messages */
        .status-message {
          text-align: center;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .status-success { background: rgba(74, 156, 45, 0.2); color: #4a9c2d; border: 1px solid #4a9c2d; }
        .status-error { background: rgba(200, 50, 50, 0.2); color: #c83232; border: 1px solid #c83232; }
        /* Admin Bar */
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
        .admin-bar-title { color: #e0c89b; font-weight: bold; font-size: 1.1rem; }
        .admin-bar-actions { display: flex; gap: 10px; align-items: center; }
        .save-btn {
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);
          color: white;
          padding: 8px 20px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
        }
        .save-btn:disabled { background: #4a4a4a; cursor: not-allowed; }
        .save-message { padding: 6px 12px; border-radius: 4px; font-size: 0.9rem; }
        .save-message.success { background: rgba(74, 156, 45, 0.3); color: #5ab33d; }
        .save-message.error { background: rgba(200, 50, 50, 0.3); color: #ff6b6b; }
        /* Admin Controls */
        .admin-controls {
          background: rgba(139, 90, 43, 0.2);
          border: 1px solid #8b5a2b;
          border-radius: 6px;
          padding: 10px;
          margin-top: 10px;
        }
        .admin-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .admin-row:last-child { margin-bottom: 0; }
        .admin-row label { color: var(--text-secondary, #b0a080); font-size: 0.85rem; min-width: 70px; }
        .admin-price-input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 4px;
          background: var(--bg-primary, #1a1a1a);
          color: var(--text-primary, #e0c89b);
          font-size: 0.9rem;
        }
        .fixed-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .fixed-toggle input { width: 18px; height: 18px; cursor: pointer; }
        .fixed-toggle span { color: var(--text-secondary, #b0a080); font-size: 0.85rem; }
        /* Modal */
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
        .modal-header { text-align: center; margin-bottom: 20px; }
        .modal-header h2 { color: var(--text-primary, #e0c89b); margin-bottom: 5px; }
        .modal-body { margin-bottom: 20px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; color: var(--text-secondary, #b0a080); margin-bottom: 5px; }
        .form-group input {
          width: 100%;
          padding: 10px;
          background: var(--bg-secondary, #2a2a2a);
          border: 1px solid var(--border-color, #4a4a4a);
          border-radius: 6px;
          color: var(--text-primary, #e0c89b);
          box-sizing: border-box;
        }
        .form-group input.error { border-color: #ff6b6b; }
        .form-group .error-text { color: #ff6b6b; font-size: 0.85rem; margin-top: 5px; }
        .modal-actions { display: flex; gap: 10px; }
        .modal-actions button { flex: 1; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; }
        .btn-cancel { background: var(--bg-secondary, #2a2a2a); color: var(--text-secondary, #b0a080); border: 1px solid var(--border-color, #4a4a4a) !important; }
        .btn-confirm { background: linear-gradient(135deg, #4a9c2d, #2d6b1a); color: white; }
        .loading, .error { text-align: center; padding: 40px; color: var(--text-secondary, #b0a080); }
        @media (max-width: 768px) {
          .consumes-header h1 { font-size: 1.8rem; }
          .category-tabs { flex-direction: column; }
          .items-grid { grid-template-columns: 1fr; }
          .cart-panel { width: 100%; }
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
        <div class="header-actions">
          <a href="/GuildShopSync-v2.3.zip" class="download-btn" download="GuildShopSync-v2.3.zip">
            Download Price Scanner
          </a>
          <button class="cart-btn" onClick={() => setShowCart(true)}>
            Cart
            {cartItemCount > 0 && <span class="cart-badge">{cartItemCount}</span>}
          </button>
          <button class={`admin-toggle ${isAdmin ? "active" : ""}`} onClick={handleAdminClick}>
            {isAdmin ? "Exit Admin" : "Admin"}
          </button>
        </div>
        {prices && (() => {
          const lastUpdated = getLastUpdated(prices.categories);
          return lastUpdated ? (
            <div class="last-updated-banner">
              <span class="label">Prices updated:</span>
              <span class="time">{formatDate(lastUpdated)}</span>
              <span class="relative">({formatRelativeTime(lastUpdated)})</span>
            </div>
          ) : null;
        })()}
      </div>

      {isAdmin && (
        <div class="admin-bar">
          <div class="admin-bar-title">Admin Mode - Edit prices below</div>
          <div class="admin-bar-actions">
            {saveMessage && (
              <span class={`save-message ${saveMessage.includes("success") ? "success" : "error"}`}>
                {saveMessage}
              </span>
            )}
            <button class="save-btn" onClick={saveChanges} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
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
          Failed to place order. Please log in with Discord and try again.
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
          const inCart = cart[item.id];

          return (
            <div key={item.id} class={`item-card ${inCart ? "in-cart" : ""} ${isAdmin ? "admin-mode" : ""}`}>
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

              {isAdmin ? (
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
                </div>
              ) : (
                <>
                  <div class="add-to-cart-row">
                    <div class="qty-control">
                      <button class="qty-btn" onClick={() => {
                        const input = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                        const val = Math.max(1, parseInt(input.value) - 1);
                        input.value = val.toString();
                      }}>-</button>
                      <input
                        type="number"
                        id={`qty-${item.id}`}
                        class="qty-input"
                        defaultValue="1"
                        min="1"
                        max="99"
                      />
                      <button class="qty-btn" onClick={() => {
                        const input = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                        const val = Math.min(99, parseInt(input.value) + 1);
                        input.value = val.toString();
                      }}>+</button>
                    </div>
                    <button
                      class="add-btn"
                      disabled={!item.shopPrice}
                      onClick={() => {
                        const input = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                        const qty = parseInt(input.value) || 1;
                        addToCart(item, qty);
                        input.value = "1";
                      }}
                    >
                      {item.shopPrice ? "Add" : "N/A"}
                    </button>
                  </div>
                  {inCart && (
                    <div class="in-cart-indicator">
                      ✓ {inCart.quantity} in cart
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Cart Panel */}
      {showCart && (
        <div class="cart-overlay" onClick={() => setShowCart(false)}>
          <div class="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div class="cart-header">
              <h2>Your Cart</h2>
              <button class="close-btn" onClick={() => setShowCart(false)}>×</button>
            </div>

            <div class="cart-items">
              {Object.keys(cart).length === 0 ? (
                <div class="cart-empty">
                  <p>Your cart is empty</p>
                  <p style="font-size: 0.9rem; margin-top: 10px;">Add items from the shop to get started</p>
                </div>
              ) : (
                Object.entries(cart).map(([itemId, { item, quantity }]) => (
                  <div key={itemId} class="cart-item">
                    <div class="cart-item-header">
                      <span class="cart-item-name">{item.name}</span>
                      <button class="cart-item-remove" onClick={() => removeFromCart(itemId)}>×</button>
                    </div>
                    <div class="cart-item-details">
                      <span class="cart-item-price">{formatGold((item.shopPrice || 0) * quantity)}</span>
                      <div class="cart-item-qty">
                        <input
                          type="number"
                          value={quantity}
                          min="1"
                          max="99"
                          onChange={(e) => updateCartQuantity(itemId, parseInt((e.target as HTMLInputElement).value) || 0)}
                        />
                        <span style="color: var(--text-muted);">@ {formatGold(item.shopPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div class="cart-footer">
              <div class="cart-notes">
                <label>Notes for Alchemist (optional)</label>
                <textarea
                  placeholder="Character name, delivery preferences, etc..."
                  value={orderNotes}
                  onInput={(e) => setOrderNotes((e.target as HTMLTextAreaElement).value)}
                />
              </div>

              <div class="cart-total">
                <span class="cart-total-label">Total:</span>
                <span class="cart-total-value">{formatGold(getCartTotal())}</span>
              </div>

              <button
                class="checkout-btn"
                disabled={Object.keys(cart).length === 0 || orderStatus === "placing"}
                onClick={placeOrder}
              >
                {orderStatus === "placing" ? "Placing Order..." : `Place Order (${getCartItemCount()} items)`}
              </button>

              {Object.keys(cart).length > 0 && (
                <button class="clear-cart-btn" onClick={clearCart}>
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                  onKeyPress={(e) => { if (e.key === "Enter") handlePasswordSubmit(); }}
                  placeholder="Enter admin password"
                  autoFocus
                />
                {passwordError && <div class="error-text">Incorrect password</div>}
              </div>
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button class="btn-confirm" onClick={handlePasswordSubmit}>Login</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

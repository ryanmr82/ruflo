#!/usr/bin/env python3
"""Add search feature with fuzzy autocomplete to ConsumesShop"""

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "r") as f:
    content = f.read()

# 1. Widen item cards from 280px to 340px
content = content.replace("minmax(280px, 1fr)", "minmax(340px, 1fr)")

# 2. Add search state variable after other state declarations
search_state = '''  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);'''

# Find where to insert search state (after showPasswordModal state)
content = content.replace(
    'const [showPasswordModal, setShowPasswordModal] = useState(false);',
    'const [showPasswordModal, setShowPasswordModal] = useState(false);\n' + search_state
)

# 3. Add fuzzy search function after the component states
fuzzy_search_fn = '''
  // Fuzzy search function
  const fuzzySearch = (query: string): Item[] => {
    if (!query || query.length < 2 || !prices) return [];
    const lowerQuery = query.toLowerCase();
    const results: Item[] = [];

    for (const cat of Object.values(prices.categories)) {
      for (const item of cat.items) {
        const name = item.name.toLowerCase();
        const desc = (item.description || "").toLowerCase();

        // Check if query matches name or description
        if (name.includes(lowerQuery) || desc.includes(lowerQuery)) {
          results.push(item);
        } else {
          // Fuzzy match: check if all chars in query appear in order in name
          let queryIdx = 0;
          for (const char of name) {
            if (char === lowerQuery[queryIdx]) queryIdx++;
            if (queryIdx === lowerQuery.length) break;
          }
          if (queryIdx === lowerQuery.length) results.push(item);
        }
      }
    }

    // Sort by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase().includes(lowerQuery) ? 0 : 1;
      const bExact = b.name.toLowerCase().includes(lowerQuery) ? 0 : 1;
      return aExact - bExact;
    });

    return results.slice(0, 10); // Limit to 10 results
  };

  const handleSearchChange = (e: Event) => {
    const query = (e.target as HTMLInputElement).value;
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchResults(fuzzySearch(query));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const selectSearchResult = (item: Item) => {
    // Find which category this item belongs to
    if (prices) {
      for (const [catKey, cat] of Object.entries(prices.categories)) {
        if (cat.items.some(i => i.id === item.id)) {
          setSelectedCategory(catKey);
          break;
        }
      }
    }
    setSearchQuery("");
    setShowSearchResults(false);
    // Scroll to the item after a brief delay
    setTimeout(() => {
      const el = document.getElementById(`item-${item.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };
'''

# Insert fuzzy search function after useEffect for fetching prices
content = content.replace(
    '  useEffect(() => {\n    fetchPrices();',
    fuzzy_search_fn + '\n  useEffect(() => {\n    fetchPrices();'
)

# 4. Add search CSS styles
search_css = '''
        .search-container { position: relative; margin-bottom: 20px; max-width: 400px; margin-left: auto; margin-right: auto; }
        .search-input { width: 100%; padding: 12px 40px 12px 15px; background: #2a2a2a; border: 2px solid #4a4a4a; border-radius: 8px; color: #e0c89b; font-size: 1rem; outline: none; transition: border-color 0.2s; }
        .search-input:focus { border-color: #c9a959; }
        .search-input::placeholder { color: #666; }
        .search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #666; pointer-events: none; }
        .search-results { position: absolute; top: 100%; left: 0; right: 0; background: #1a1a1a; border: 2px solid #c9a959; border-top: none; border-radius: 0 0 8px 8px; max-height: 300px; overflow-y: auto; z-index: 100; }
        .search-result-item { padding: 10px 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #3a3a3a; transition: background 0.2s; }
        .search-result-item:hover { background: #2a2a2a; }
        .search-result-item:last-child { border-bottom: none; }
        .search-result-icon { width: 24px; height: 24px; border-radius: 3px; }
        .search-result-name { color: #e0c89b; font-weight: bold; }
        .search-result-desc { color: #4ade80; font-size: 0.8rem; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
'''

# Insert CSS before the category-tabs style
content = content.replace(
    ".category-tabs { display: flex;",
    search_css + "\n        .category-tabs { display: flex;"
)

# 5. Add search input HTML after the header
search_html = '''
          {/* Search */}
          <div class="search-container">
            <input
              type="text"
              class="search-input"
              placeholder="Search consumables..."
              value={searchQuery}
              onInput={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
            <span class="search-icon">🔍</span>
            {showSearchResults && searchResults.length > 0 && (
              <div class="search-results">
                {searchResults.map(item => (
                  <div
                    key={item.id}
                    class="search-result-item"
                    onMouseDown={() => selectSearchResult(item)}
                  >
                    <img
                      class="search-result-icon"
                      src={`/icons/consumes/${item.itemId}.png`}
                      alt=""
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div>
                      <div class="search-result-name">{item.name}</div>
                      {item.description && <div class="search-result-desc">{item.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
'''

# Find where to insert search HTML (after the last-updated-banner div, before category-tabs)
content = content.replace(
    '{/* Category Tabs */}\n          <div class="category-tabs">',
    search_html + '\n          {/* Category Tabs */}\n          <div class="category-tabs">'
)

# 6. Add id to item cards for scrolling
content = content.replace(
    '<div class={`item-card ${cart[item.id]',
    '<div id={`item-${item.id}`} class={`item-card ${cart[item.id]'
)

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "w") as f:
    f.write(content)

print("Added search feature with fuzzy autocomplete")
print("Widened item cards from 280px to 340px")

#!/usr/bin/env python3
"""Add price source indicator to ConsumesShop.tsx"""

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "r") as f:
    content = f.read()

# 1. Add 'source' to Item interface
content = content.replace(
    'updatedAt: string | null;\n}',
    'updatedAt: string | null;\n  source?: string;\n}'
)

# 2. Add CSS for price source indicators
source_css = '''        .price-source { font-size: 0.65rem; padding: 2px 5px; border-radius: 3px; margin-left: 5px; font-weight: bold; }
        .price-source.addon { background: #2d5a27; color: #7fff7f; }
        .price-source.web { background: #5a4a27; color: #ffd700; }
        .price-source.static { background: #4a2d5a; color: #da70d6; }
        .price-legend { display: flex; gap: 15px; justify-content: center; margin-bottom: 15px; font-size: 0.8rem; flex-wrap: wrap; }
        .price-legend-item { display: flex; align-items: center; gap: 5px; }
        .price-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        .price-legend-dot.addon { background: #7fff7f; }
        .price-legend-dot.web { background: #ffd700; }
        .price-legend-dot.static { background: #da70d6; }
'''

# Insert CSS before .category-tabs
content = content.replace(
    '        .category-tabs {',
    source_css + '        .category-tabs {'
)

# 3. Add legend HTML after search container, before category tabs
legend_html = '''          {/* Price Source Legend */}
          <div class="price-legend">
            <div class="price-legend-item">
              <span class="price-legend-dot addon"></span>
              <span>In-Game AH Scan</span>
            </div>
            <div class="price-legend-item">
              <span class="price-legend-dot web"></span>
              <span>wowauctions.net</span>
            </div>
            <div class="price-legend-item">
              <span class="price-legend-dot static"></span>
              <span>Fixed Price</span>
            </div>
          </div>

'''

# Insert legend before category tabs
content = content.replace(
    '          {/* Category Tabs */}',
    legend_html + '          {/* Category Tabs */'
)

# 4. Update item card to show price source indicator
# Find the shop-price span and add source indicator after it
old_price_display = '{item.shopPrice ? (\n                  <>\n                    <span class="shop-price">{formatGold(item.shopPrice)}</span>\n                    {item.isStatic ? <span class="fixed-badge">Fixed</span> : item.ahPrice && <span class="ah-price">{formatGold(item.ahPrice)}</span>}'
new_price_display = '''{item.shopPrice ? (
                  <>
                    <span class="shop-price">{formatGold(item.shopPrice)}</span>
                    {item.isStatic ? (
                      <span class="price-source static">FIXED</span>
                    ) : item.source === "wowauctions.net" ? (
                      <span class="price-source web">WEB</span>
                    ) : (
                      <span class="price-source addon">AH</span>
                    )}
                    {!item.isStatic && item.ahPrice && <span class="ah-price">{formatGold(item.ahPrice)}</span>}'''

content = content.replace(old_price_display, new_price_display)

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "w") as f:
    f.write(content)

print("Added price source indicator to ConsumesShop.tsx")
print("- Added 'source' to Item interface")
print("- Added CSS for price source badges")
print("- Added price source legend")
print("- Updated item cards to show source badge")

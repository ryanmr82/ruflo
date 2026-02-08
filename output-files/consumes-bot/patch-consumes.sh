#!/bin/bash
# Patch ConsumesShop.tsx to add download link and admin toggle

FILE=~/tbc-website/islands/ConsumesShop.tsx

# Backup first
cp "$FILE" "$FILE.bak"

# 1. Add state for admin mode after existing useState declarations (around line 82-90)
sed -i '/const \[showOrders, setShowOrders\] = useState(false);/a\  const [isAdmin, setIsAdmin] = useState(false);' "$FILE"

# 2. Add CSS for download button and admin toggle before the closing `}</style>
# Find the line with the closing backtick-brace and add CSS before it
sed -i '/^      \`\}<\/style>/i\
        .download-section {\
          margin-top: 15px;\
          display: flex;\
          gap: 10px;\
          justify-content: center;\
          flex-wrap: wrap;\
        }\
\
        .download-btn {\
          background: linear-gradient(135deg, #3d7ab8, #2a5580);\
          color: white;\
          padding: 10px 20px;\
          border-radius: 8px;\
          text-decoration: none;\
          font-weight: bold;\
          display: inline-flex;\
          align-items: center;\
          gap: 8px;\
          transition: all 0.2s ease;\
        }\
\
        .download-btn:hover {\
          background: linear-gradient(135deg, #4a8fd0, #3d7ab8);\
          transform: translateY(-2px);\
        }\
\
        .admin-toggle {\
          background: var(--bg-secondary, #2a2a2a);\
          border: 1px solid var(--border-color, #4a4a4a);\
          color: var(--text-secondary, #b0a080);\
          padding: 10px 20px;\
          border-radius: 8px;\
          cursor: pointer;\
          transition: all 0.2s ease;\
        }\
\
        .admin-toggle:hover {\
          border-color: var(--text-primary, #e0c89b);\
        }\
\
        .admin-toggle.active {\
          background: linear-gradient(135deg, #8b5a2b, #654321);\
          border-color: #c8a060;\
          color: #e0c89b;\
        }\
\
        .admin-price-input {\
          width: 100px;\
          padding: 5px 8px;\
          border: 1px solid var(--border-color, #4a4a4a);\
          border-radius: 4px;\
          background: var(--bg-primary, #1a1a1a);\
          color: var(--text-primary, #e0c89b);\
          font-size: 0.9rem;\
        }\
\
        .admin-save-btn {\
          background: linear-gradient(135deg, #4a9c2d, #2d6b1a);\
          color: white;\
          padding: 5px 10px;\
          border-radius: 4px;\
          border: none;\
          cursor: pointer;\
          font-size: 0.8rem;\
        }\
' "$FILE"

echo "CSS added"

# 3. Add download section and admin toggle after the discount-badge div
# First, find the exact line number
LINE=$(grep -n 'prices?.discountPercent.*Off AH Prices' "$FILE" | head -1 | cut -d: -f1)
NEXT_LINE=$((LINE + 2))

# Insert after the closing </div> of discount-badge
sed -i "${NEXT_LINE}a\\
        <div class=\"download-section\">\\
          <a href=\"/static/GuildShopSync-v2.0.zip\" class=\"download-btn\" download>\\
            Download Price Scanner Addon\\
          </a>\\
          <button\\
            class={\`admin-toggle \${isAdmin ? 'active' : ''}\`}\\
            onClick={() => setIsAdmin(!isAdmin)}\\
          >\\
            {isAdmin ? 'Exit Admin Mode' : 'Alchemist Mode'}\\
          </button>\\
        </div>" "$FILE"

echo "Download section added"
echo "Patch complete!"

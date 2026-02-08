#!/usr/bin/env python3
"""Fix API to include source field in category items"""

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    content = f.read()

# Update the category items mapping to include source
old_mapping = '''items: cat.items.map((item) => {
          const priceInfo = getItemPriceInfo(item);
          return {
            id: item.id,
            name: item.name,
            itemId: item.itemId,
          description: item.description,
            ...priceInfo
          };
        })'''

new_mapping = '''items: cat.items.map((item) => {
          const priceInfo = getItemPriceInfo(item);
          const priceData = prices[item.id] as { source?: string } | undefined;
          return {
            id: item.id,
            name: item.name,
            itemId: item.itemId,
            description: item.description,
            ...priceInfo,
            source: priceData?.source || null
          };
        })'''

content = content.replace(old_mapping, new_mapping)

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.write(content)

print("Fixed API to include source field in category items")

#!/usr/bin/env python3
"""Download icons for 13 new items from turtlecraft.gg"""

import requests
import os

ICON_DIR = "/home/opc/tbc-website/static/icons/consumes"
API_URL = "http://localhost:8000/api/item"
TURTLECRAFT_ICON_URL = "https://database.turtlecraft.gg/images/icons/medium"

# New item IDs
new_items = [
    60977,  # Danonzo's Tel'Abim Delight
    60976,  # Danonzo's Tel'Abim Surprise
    60978,  # Danonzo's Tel'Abim Medley
    51720,  # Power Mushroom
    20452,  # Smoked Desert Dumplings
    84041,  # Gilneas Hot Stew
    21151,  # Rumsey Rum Black Label
    15723,  # Tea with Sugar
    61675,  # Nordanaar Herbal Tea
    9224,   # Elixir of Demonslaying
    13453,  # Elixir of Brute Force
    61423,  # Dreamtonic
    12404,  # Dense Sharpening Stone
]

os.makedirs(ICON_DIR, exist_ok=True)

for item_id in new_items:
    icon_path = f"{ICON_DIR}/{item_id}.png"

    # Skip if already exists
    if os.path.exists(icon_path):
        print(f"Icon already exists: {item_id}.png")
        continue

    # Get icon name from API
    try:
        resp = requests.get(f"{API_URL}/{item_id}", timeout=10)
        if resp.status_code != 200:
            print(f"Failed to get item {item_id} from API: {resp.status_code}")
            continue

        data = resp.json()
        icon_name = data.get("icon", "").lower()

        if not icon_name:
            print(f"No icon found for item {item_id}")
            continue

        # Download icon from turtlecraft.gg
        icon_url = f"{TURTLECRAFT_ICON_URL}/{icon_name}.png"
        icon_resp = requests.get(icon_url, timeout=10)

        if icon_resp.status_code == 200:
            with open(icon_path, "wb") as f:
                f.write(icon_resp.content)
            print(f"Downloaded: {item_id}.png ({icon_name})")
        else:
            print(f"Failed to download icon for {item_id}: {icon_url} - {icon_resp.status_code}")

    except Exception as e:
        print(f"Error processing item {item_id}: {e}")

print("\nDone downloading icons!")

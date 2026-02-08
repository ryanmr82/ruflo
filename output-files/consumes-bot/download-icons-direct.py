#!/usr/bin/env python3
"""Download icons directly using known icon names"""

import requests
import os

ICON_DIR = "/home/opc/tbc-website/static/icons/consumes"
TURTLECRAFT_ICON_URL = "https://database.turtlecraft.gg/images/icons/medium"

# Item ID -> icon name mapping from static cache
icons = {
    60977: "inv_drink_21",
    60976: "inv_misc_food_92",
    60978: "inv_misc_food_73",
    51720: "inv_mushroom_14",
    20452: "inv_misc_food_64",
    84041: "inv_drink_19",
    21151: "inv_drink_04",
    15723: "inv_drink_15",
    61675: "inv_drink_waterskin_03",
    9224: "inv_potion_27",
    13453: "inv_potion_40",
    61423: "inv_potion_114",
    12404: "inv_stone_sharpeningstone_05",
}

os.makedirs(ICON_DIR, exist_ok=True)

for item_id, icon_name in icons.items():
    icon_path = f"{ICON_DIR}/{item_id}.png"

    # Skip if already exists
    if os.path.exists(icon_path):
        print(f"Icon already exists: {item_id}.png")
        continue

    # Download icon from turtlecraft.gg
    icon_url = f"{TURTLECRAFT_ICON_URL}/{icon_name}.png"
    try:
        icon_resp = requests.get(icon_url, timeout=10)

        if icon_resp.status_code == 200:
            with open(icon_path, "wb") as f:
                f.write(icon_resp.content)
            print(f"Downloaded: {item_id}.png ({icon_name})")
        else:
            print(f"Failed to download: {item_id} from {icon_url} - {icon_resp.status_code}")
    except Exception as e:
        print(f"Error downloading {item_id}: {e}")

print("\nDone!")

#!/usr/bin/env python3
"""Fetch prices from wowauctions.net for items missing AH prices"""

import requests
import re
import json
import time

# Items to fetch prices for (user confirmed these are on AH)
items_to_fetch = [
    (9036, "magic-resistance-potion", "Magic Resistance Potion"),
    (13446, "major-healing-potion", "Major Healing Potion"),
    (12820, "winterfall-firewater", "Winterfall Firewater"),
    (20520, "dark-rune", "Dark Rune"),
    (12404, "dense-sharpening-stone", "Dense Sharpening Stone"),
    (12217, "dragonbreath-chili", "Dragonbreath Chili"),
    (60977, "danonzos-telabim-delight", "Danonzo's Tel'Abim Delight"),
    (60976, "danonzos-telabim-surprise", "Danonzo's Tel'Abim Surprise"),
    (60978, "danonzos-telabim-medley", "Danonzo's Tel'Abim Medley"),
    (51720, "power-mushroom", "Power Mushroom"),
    (20452, "smoked-desert-dumplings", "Smoked Desert Dumplings"),
    (84041, "gilneas-hot-stew", "Gilneas Hot Stew"),
    (21151, "rumsey-rum-black-label", "Rumsey Rum Black Label"),
    (9224, "elixir-of-demonslaying", "Elixir of Demonslaying"),
    (61423, "dreamtonic", "Dreamtonic"),
]

BASE_URL = "https://www.wowauctions.net/auctionHouse/turtle-wow/tel-abim/horde"
API_URL = "http://localhost:8000/api/consumes/prices"

prices_found = {}

for item_id, slug, name in items_to_fetch:
    url = f"{BASE_URL}/{slug}-{item_id}"
    print(f"Fetching: {name} ({item_id})...")

    try:
        resp = requests.get(url, timeout=15, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        if resp.status_code != 200:
            print(f"  ERROR: HTTP {resp.status_code}")
            continue

        html = resp.text

        # Look for embedded JSON data with price info
        # Pattern: "minimum_buyout":12345 or avg_price
        min_buyout_match = re.search(r'"minimum_buyout"\s*:\s*(\d+)', html)
        avg_price_match = re.search(r'"avg_price"\s*:\s*(\d+)', html)

        if min_buyout_match:
            price_copper = int(min_buyout_match.group(1))
            if price_copper > 0:
                prices_found[item_id] = price_copper
                gold = price_copper // 10000
                silver = (price_copper % 10000) // 100
                copper = price_copper % 100
                print(f"  Found: {gold}g {silver}s {copper}c (min buyout)")
            else:
                print(f"  No listings found (price=0)")
        elif avg_price_match:
            price_copper = int(avg_price_match.group(1))
            if price_copper > 0:
                prices_found[item_id] = price_copper
                gold = price_copper // 10000
                silver = (price_copper % 10000) // 100
                copper = price_copper % 100
                print(f"  Found: {gold}g {silver}s {copper}c (avg price)")
            else:
                print(f"  No listings found (price=0)")
        else:
            print(f"  No price data found in page")

        time.sleep(0.5)  # Be nice to the server

    except Exception as e:
        print(f"  ERROR: {e}")

print(f"\n=== Found prices for {len(prices_found)} items ===\n")

# Update prices via API
if prices_found:
    print("Updating prices via API...")

    for item_id, price in prices_found.items():
        try:
            resp = requests.post(API_URL, json={
                "itemId": str(item_id),
                "ahPrice": price,
                "source": "wowauctions.net"
            }, timeout=10)

            if resp.status_code == 200:
                print(f"  Updated {item_id}: {price} copper")
            else:
                print(f"  Failed to update {item_id}: {resp.status_code}")
        except Exception as e:
            print(f"  Error updating {item_id}: {e}")

print("\nDone!")

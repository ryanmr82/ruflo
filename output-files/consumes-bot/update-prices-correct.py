#!/usr/bin/env python3
"""Update prices using correct internal IDs"""

import requests

# Prices fetched from wowauctions.net (in copper)
# Format: internal_id -> price_copper
prices = {
    "MagicResistance": 9999,      # 0g 99s 99c
    "MajorHealing": 9900,          # 0g 99s 0c
    "WinterfallFirewater": 7999,   # 0g 79s 99c
    "DarkRune": 23097,             # 2g 30s 97c
    "DenseSharpeningStone": 6500,  # 0g 65s 0c
    "DragonbreathChili": 9999,     # 0g 99s 99c
    "DanozoDelight": 9850,         # 0g 98s 50c
    "DanozoSurprise": 4000,        # 0g 40s 0c
    "DanozoMedley": 15000,         # 1g 50s 0c
    "PowerMushroom": 7750,         # 0g 77s 50c
    "SmokedDesertDumplings": 11998,# 1g 19s 98c
    "GilneasHotStew": 2219,        # 0g 22s 19c
    "RumseyRumBlackLabel": 3500,   # 0g 35s 0c
    "ElixirOfDemonslaying": 8499,  # 0g 84s 99c
    "Dreamtonic": 8990,            # 0g 89s 90c
}

API_URL = "http://localhost:8000/api/consumes/prices"

print("Updating prices with correct internal IDs...")

for item_id, price in prices.items():
    try:
        resp = requests.post(API_URL, json={
            "itemId": item_id,
            "ahPrice": price,
            "source": "wowauctions.net"
        }, timeout=10)

        if resp.status_code == 200:
            gold = price // 10000
            silver = (price % 10000) // 100
            copper_amt = price % 100
            print(f"  Updated {item_id}: {gold}g {silver}s {copper_amt}c")
        else:
            print(f"  Failed {item_id}: HTTP {resp.status_code}")
    except Exception as e:
        print(f"  Error {item_id}: {e}")

print("\nDone!")

#!/usr/bin/env python3
"""
Check the raw WoWCombatLog.txt file for Onyxia death timestamp.
Run this on the server: python3 check_onyxia_death.py
"""

import re
import os

# Path to the combat log on the server
LOG_PATH = "/home/opc/tbc-website-uploads/WoWCombatLog.txt"

def main():
    if not os.path.exists(LOG_PATH):
        print(f"ERROR: File not found: {LOG_PATH}")
        return

    print(f"Reading: {LOG_PATH}")
    print("-" * 60)

    with open(LOG_PATH, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    print(f"Total lines: {len(lines)}")
    print()

    # Search for Onyxia death
    onyxia_lines = []
    for i, line in enumerate(lines):
        if "Onyxia" in line and "dies" in line:
            onyxia_lines.append((i + 1, line.rstrip()))

    if onyxia_lines:
        print("=== ONYXIA DEATH LINES FOUND ===")
        for line_num, content in onyxia_lines:
            print(f"Line {line_num}: {content}")

            # Parse the timestamp
            match = re.match(r'^(\d{1,2})/(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})', content)
            if match:
                month, day, hour, minute, second, ms = match.groups()
                print(f"  -> Timestamp: {month}/{day} {hour}:{minute}:{second}.{ms}")
                print(f"  -> 12-hour format: {int(hour) % 12 or 12}:{minute} {'PM' if int(hour) >= 12 else 'AM'}")
            print()
    else:
        print("NO ONYXIA DEATH LINES FOUND!")
        print()
        # Show any lines containing "Onyxia"
        print("=== LINES CONTAINING 'Onyxia' ===")
        onyxia_mentions = [(i + 1, line.rstrip()) for i, line in enumerate(lines) if "Onyxia" in line][:20]
        for line_num, content in onyxia_mentions:
            print(f"Line {line_num}: {content[:100]}...")

    print()
    print("=== FIRST AND LAST TIMESTAMPS IN FILE ===")

    # Find first timestamp
    for i, line in enumerate(lines[:100]):
        match = re.match(r'^(\d{1,2})/(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})', line)
        if match:
            print(f"First timestamp (line {i + 1}): {line[:30].rstrip()}")
            break

    # Find last timestamp
    for i, line in enumerate(reversed(lines[-100:])):
        match = re.match(r'^(\d{1,2})/(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})', line)
        if match:
            actual_line = len(lines) - i
            print(f"Last timestamp (line {actual_line}): {line[:30].rstrip()}")
            break

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Clear contributor data and merged_players.json after weekly reset.
Run this AFTER post-reset snapshot is taken (e.g., Tuesday 10:15 PM PST).
This ensures fresh data for the new week.
"""

import json
import os
import shutil
from datetime import datetime

CONTRIBUTORS_DIR = '/home/opc/HonorSpy/contributors'
DATA_DIR = '/home/opc/HonorSpy/data'
LOGS_DIR = '/home/opc/HonorSpy/logs'

def clear_weekly_data():
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M')
    log_file = os.path.join(LOGS_DIR, f'weekly_clear_{timestamp}.log')

    with open(log_file, 'w') as log:
        log.write(f"Weekly data clear started at {timestamp}\n")
        log.write("=" * 50 + "\n\n")

        # Clear contributor files
        log.write("Clearing contributor files:\n")
        cleared_count = 0
        for filename in os.listdir(CONTRIBUTORS_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(CONTRIBUTORS_DIR, filename)
                os.remove(filepath)
                log.write(f"  Removed: {filename}\n")
                cleared_count += 1
        log.write(f"Total contributors cleared: {cleared_count}\n\n")

        # Clear merged_players.json
        merged_file = os.path.join(DATA_DIR, 'merged_players.json')
        if os.path.exists(merged_file):
            os.remove(merged_file)
            log.write(f"Cleared: merged_players.json\n")

        # Create empty merged_players.json
        with open(merged_file, 'w') as f:
            json.dump({}, f)
        log.write(f"Created empty: merged_players.json\n\n")

        log.write(f"Weekly clear completed at {datetime.now().strftime('%Y-%m-%d_%H-%M')}\n")

    print(f"Weekly data cleared. Log: {log_file}")
    print(f"Cleared {cleared_count} contributor files")
    print("Ready for new week uploads!")

if __name__ == '__main__':
    clear_weekly_data()

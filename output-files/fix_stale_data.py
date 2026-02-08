#!/usr/bin/env python3
"""
Fix stale player data in Dec 9 snapshot and merged_players.json
Remove players not in current week's contributor uploads
"""

import json
import os
import time
from datetime import datetime

CONTRIBUTORS_DIR = '/home/opc/HonorSpy/contributors'
DATA_DIR = '/home/opc/HonorSpy/data'
SNAPSHOTS_DIR = '/home/opc/HonorSpy/snapshots'

def get_current_contributor_names():
    """Get all player names from current contributor uploads"""
    names = set()
    for filename in os.listdir(CONTRIBUTORS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(CONTRIBUTORS_DIR, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
                for player in data.get('players', []):
                    names.add(player['name'])
    return names

def calculate_bracket(standing, pool_size):
    """Calculate bracket based on standing and pool size."""
    if pool_size == 0:
        return 1
    brackets = [
        (0.003, 14), (0.006, 13), (0.012, 12), (0.025, 11), (0.05, 10),
        (0.10, 9), (0.15, 8), (0.20, 7), (0.35, 6), (0.50, 5),
        (0.65, 4), (0.80, 3), (0.95, 2), (1.0, 1)
    ]
    percentile = standing / pool_size
    for threshold, bracket in brackets:
        if percentile <= threshold:
            return bracket
    return 1

def calculate_rp_gain(bracket, honor):
    """Calculate RP gain based on bracket."""
    if honor < 15:
        return 0
    rp_values = {
        14: 13000, 13: 12000, 12: 11000, 11: 10000, 10: 9000,
        9: 8000, 8: 7000, 7: 6000, 6: 5000, 5: 4000,
        4: 3500, 3: 3000, 2: 2500, 1: 2000
    }
    return rp_values.get(bracket, 0)

def get_rank_from_rp(rp):
    """Calculate rank from RP."""
    rank_thresholds = [
        (60000, 14), (55000, 13), (50000, 12), (45000, 11), (40000, 10),
        (35000, 9), (30000, 8), (25000, 7), (20000, 6), (15000, 5),
        (10000, 4), (5000, 3), (2000, 2), (0, 1)
    ]
    for threshold, rank in rank_thresholds:
        if rp >= threshold:
            return rank
    return 1

def fix_snapshot(snapshot_file, current_names):
    """Remove stale players and recalculate projections"""
    filepath = os.path.join(SNAPSHOTS_DIR, snapshot_file)

    with open(filepath, 'r') as f:
        snapshot = json.load(f)

    original_count = len(snapshot.get('players', {}))

    # Filter to only players in current contributor uploads
    filtered_players = {}
    for name, data in snapshot.get('players', {}).items():
        if name in current_names:
            filtered_players[name] = data

    removed_count = original_count - len(filtered_players)
    print(f"Removed {removed_count} stale players from {snapshot_file}")
    print(f"New pool size: {len(filtered_players)}")

    # Sort by honor to get standings
    sorted_players = sorted(
        filtered_players.items(),
        key=lambda x: x[1].get('thisWeekHonor', 0),
        reverse=True
    )

    pool_size = len(sorted_players)

    # Recalculate projections with correct pool size
    new_players = {}
    for standing, (name, data) in enumerate(sorted_players, 1):
        rp = data.get('RP', 0)
        honor = data.get('thisWeekHonor', 0)
        bracket = calculate_bracket(standing, pool_size)
        decay = int(rp * 0.20)
        gain = calculate_rp_gain(bracket, honor)
        net = gain - decay
        projected_rp = rp + net
        projected_rank = get_rank_from_rp(projected_rp)

        data['standing'] = standing
        data['bracket'] = bracket
        data['decay'] = decay
        data['gain'] = gain
        data['net'] = net
        data['projected_rp'] = projected_rp
        data['projected_rank'] = projected_rank

        new_players[name] = data

    snapshot['players'] = new_players
    snapshot['player_count'] = len(new_players)
    snapshot['fixed_at'] = datetime.now().isoformat()
    snapshot['removed_stale_count'] = removed_count

    # Backup original
    backup_file = filepath.replace('.json', '_backup_stale.json')
    os.rename(filepath, backup_file)
    print(f"Backed up original to {backup_file}")

    # Save fixed snapshot
    with open(filepath, 'w') as f:
        json.dump(snapshot, f, indent=2)
    print(f"Saved fixed snapshot to {filepath}")

    return len(new_players)

def fix_merged_players(current_names):
    """Rebuild merged_players.json from only current contributors"""
    merged_file = os.path.join(DATA_DIR, 'merged_players.json')

    # Get original count
    original_count = 0
    if os.path.exists(merged_file):
        with open(merged_file, 'r') as f:
            original = json.load(f)
            original_count = len(original)

    # Rebuild from contributor files
    merged = {}
    for filename in os.listdir(CONTRIBUTORS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(CONTRIBUTORS_DIR, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
                for player in data.get('players', []):
                    name = player['name']
                    # Keep most recent data if duplicate
                    if name not in merged or player.get('last_checked', 0) > merged[name].get('last_checked', 0):
                        merged[name] = player

    print(f"\nRebuilt merged_players.json:")
    print(f"  Original: {original_count} players")
    print(f"  New: {len(merged)} players")
    print(f"  Removed: {original_count - len(merged)} stale players")

    # Backup and save
    if os.path.exists(merged_file):
        backup = merged_file.replace('.json', '_backup_stale.json')
        os.rename(merged_file, backup)

    with open(merged_file, 'w') as f:
        json.dump(merged, f, indent=2)

    return len(merged)

if __name__ == '__main__':
    print("=" * 60)
    print("Fixing stale player data")
    print("=" * 60)

    # Get current valid names
    current_names = get_current_contributor_names()
    print(f"\nFound {len(current_names)} unique players in current contributor uploads")

    # Fix Dec 9 snapshot
    print("\n" + "-" * 40)
    print("Fixing Dec 9 pre-reset snapshot...")
    new_pool = fix_snapshot('pre_reset_2025-12-09_15-55.json', current_names)

    # Fix merged_players.json
    print("\n" + "-" * 40)
    print("Fixing merged_players.json...")
    fix_merged_players(current_names)

    print("\n" + "=" * 60)
    print(f"DONE! New pool size: {new_pool}")
    print("=" * 60)

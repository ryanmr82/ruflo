#!/usr/bin/env python3
"""
Reverse Engineer Blizzard's RP Award Formula - V2
Using Dec 2 and Dec 9 reset data
FILTERED for valid data only (positive awards, reasonable ranges)
"""

import json
import math
from collections import defaultdict

# Bracket thresholds (percentile cutoffs)
BRACKET_THRESHOLDS = [
    (0.003, 14), (0.006, 13), (0.012, 12), (0.025, 11), (0.05, 10),
    (0.10, 9), (0.15, 8), (0.20, 7), (0.35, 6), (0.50, 5),
    (0.65, 4), (0.80, 3), (0.95, 2), (1.0, 1)
]

# Official base awards per bracket
BASE_AWARDS = {
    14: 13000, 13: 12000, 12: 11000, 11: 10000, 10: 9000,
    9: 8000, 8: 7000, 7: 6000, 6: 5000, 5: 4000,
    4: 3500, 3: 3000, 2: 2500, 1: 2000
}

# Expected award ranges by bracket (with some tolerance)
AWARD_RANGES = {
    14: (11500, 13500), 13: (10500, 12500), 12: (9500, 11500), 11: (8500, 10500),
    10: (7500, 9500), 9: (6500, 8500), 8: (5500, 7500), 7: (4500, 6500),
    6: (3500, 5500), 5: (3000, 4500), 4: (2500, 4000), 3: (2000, 3500),
    2: (1500, 3000), 1: (1000, 2500)
}

def load_snapshot(filepath):
    """Load snapshot JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def get_fresh_matches(pre_data, post_data):
    """Get players who appear in both snapshots with VALID award data"""
    pre_players = pre_data.get('players', {})
    post_players = post_data.get('players', {})

    matches = []
    rejected_reasons = defaultdict(int)

    for name, pre_info in pre_players.items():
        if name in post_players:
            post_info = post_players[name]
            pre_rp = pre_info.get('RP', 0)
            post_rp = post_info.get('RP', 0)
            honor = pre_info.get('thisWeekHonor', 0)
            standing = pre_info.get('standing', 0)
            bracket = pre_info.get('bracket', 0)

            # Only include fresh data (RP changed)
            if post_rp == pre_rp:
                rejected_reasons['stale_rp'] += 1
                continue

            decay = int(pre_rp * 0.20)
            actual_award = post_rp - pre_rp + decay

            # Filter out invalid data
            if bracket <= 0 or bracket > 14:
                rejected_reasons['invalid_bracket'] += 1
                continue

            if standing <= 0:
                rejected_reasons['invalid_standing'] += 1
                continue

            if actual_award <= 0:
                rejected_reasons['negative_award'] += 1
                continue

            # Check if award is within expected range for bracket (with tolerance)
            expected_min, expected_max = AWARD_RANGES.get(bracket, (0, 20000))
            if actual_award < expected_min * 0.5 or actual_award > expected_max * 1.5:
                rejected_reasons['award_out_of_range'] += 1
                continue

            matches.append({
                'name': name,
                'honor': honor,
                'standing': standing,
                'bracket': bracket,
                'pre_rp': pre_rp,
                'post_rp': post_rp,
                'decay': decay,
                'actual_award': actual_award
            })

    return matches, rejected_reasons

def get_bracket_boundaries(pool_size):
    """Calculate exact bracket boundaries for a given pool size"""
    boundaries = {}
    prev_cutoff = 0
    for threshold, bracket in BRACKET_THRESHOLDS:
        cutoff = int(pool_size * threshold)
        boundaries[bracket] = {
            'start': prev_cutoff + 1,
            'end': cutoff,
            'size': cutoff - prev_cutoff
        }
        prev_cutoff = cutoff
    return boundaries

def calculate_position_in_bracket(standing, bracket, boundaries):
    """Calculate position within bracket (0 = top, 1 = bottom)"""
    b = boundaries.get(bracket, {})
    start = b.get('start', standing)
    end = b.get('end', standing)
    size = b.get('size', 1)

    if size <= 1:
        return 0.0

    # Position from top of bracket (0 = first, approaches 1 = last)
    position = (standing - start) / size
    return min(1.0, max(0.0, position))

def test_blizzard_interpolation(player, boundaries, pool_size):
    """
    Blizzard's interpolation formula:
    Award = BracketMax - (position * (BracketMax - BracketMin))
    """
    bracket = player['bracket']
    standing = player['standing']

    b = boundaries.get(bracket, {})
    bracket_start = b.get('start', 1)
    bracket_size = b.get('size', 1)

    bracket_max = BASE_AWARDS.get(bracket, 0)
    bracket_min = BASE_AWARDS.get(bracket - 1, 0) if bracket > 1 else 0

    if bracket_size <= 0:
        return bracket_max

    # Position in bracket (0 = first, approaches 1 = last)
    pos_fraction = (standing - bracket_start) / bracket_size

    # Interpolate
    award_range = bracket_max - bracket_min
    predicted = bracket_max - (pos_fraction * award_range)

    return predicted

def analyze_all_data():
    """Main analysis function"""

    print("=" * 70)
    print("REVERSE ENGINEERING BLIZZARD'S RP AWARD FORMULA (V2 - Filtered)")
    print("=" * 70)

    datasets = [
        {
            'name': 'Dec 9, 2025',
            'pre': '/home/opc/HonorSpy/snapshots/pre_reset_2025-12-09_15-55.json',
            'post': '/home/opc/HonorSpy/snapshots/post_reset_2025-12-09_14-25.json'
        },
        {
            'name': 'Dec 2, 2025',
            'pre': '/home/opc/HonorSpy/snapshots/pre_reset_2025-12-02_15-55.json',
            'post': '/home/opc/HonorSpy/snapshots/post_reset_tue_2025-12-02_22-00.json'
        }
    ]

    all_matches = []

    for ds in datasets:
        print(f"\nLoading {ds['name']}...")
        try:
            pre_data = load_snapshot(ds['pre'])
            post_data = load_snapshot(ds['post'])

            pool_size = len(pre_data.get('players', {}))
            matches, rejected = get_fresh_matches(pre_data, post_data)

            for m in matches:
                m['pool_size'] = pool_size
                m['dataset'] = ds['name']

            all_matches.extend(matches)
            print(f"  Pool size: {pool_size}")
            print(f"  Valid matches: {len(matches)}")
            print(f"  Rejected: {dict(rejected)}")
        except Exception as e:
            print(f"  Error loading {ds['name']}: {e}")

    print(f"\nTotal VALID data points: {len(all_matches)}")

    if not all_matches:
        print("No valid data to analyze!")
        return

    # Group by bracket
    by_bracket = defaultdict(list)
    for m in all_matches:
        by_bracket[m['bracket']].append(m)

    print("\n" + "=" * 70)
    print("DATA DISTRIBUTION BY BRACKET")
    print("=" * 70)
    for b in sorted(by_bracket.keys(), reverse=True):
        players = by_bracket[b]
        awards = [p['actual_award'] for p in players]
        if awards:
            print(f"  B{b}: {len(players)} samples, award range: {min(awards):.0f} - {max(awards):.0f}")

    # Test the interpolation formula
    print("\n" + "=" * 70)
    print("FORMULA FIT ANALYSIS")
    print("=" * 70)

    total_error = 0
    total_abs_error = 0
    count = 0

    for bracket in sorted(by_bracket.keys(), reverse=True):
        players = by_bracket[bracket]
        if not players:
            continue

        errors = []
        for m in players:
            pool_size = m['pool_size']
            boundaries = get_bracket_boundaries(pool_size)

            predicted = test_blizzard_interpolation(m, boundaries, pool_size)
            actual = m['actual_award']
            error = actual - predicted

            errors.append({
                'name': m['name'],
                'standing': m['standing'],
                'honor': m['honor'],
                'actual': actual,
                'predicted': predicted,
                'error': error
            })

            total_error += error
            total_abs_error += abs(error)
            count += 1

        avg_error = sum(e['error'] for e in errors) / len(errors)
        avg_abs_error = sum(abs(e['error']) for e in errors) / len(errors)
        min_actual = min(e['actual'] for e in errors)
        max_actual = max(e['actual'] for e in errors)

        print(f"\nBracket {bracket}: {len(players)} samples")
        print(f"  Actual range:  {min_actual:.0f} - {max_actual:.0f}")
        print(f"  Expected base: {BASE_AWARDS.get(bracket, 0)}")
        print(f"  Avg Error:     {avg_error:+.0f} RP")
        print(f"  Avg Abs Error: {avg_abs_error:.0f} RP")

        # Show a few examples
        print(f"  Examples:")
        for e in sorted(errors, key=lambda x: x['standing'])[:3]:
            print(f"    {e['name']}: standing={e['standing']}, actual={e['actual']:.0f}, pred={e['predicted']:.0f}, err={e['error']:+.0f}")

    overall_avg_error = total_error / count if count > 0 else 0
    overall_avg_abs = total_abs_error / count if count > 0 else 0

    print("\n" + "=" * 70)
    print(f"OVERALL FIT: Avg Error = {overall_avg_error:+.0f}, Avg Abs Error = {overall_avg_abs:.0f}")
    print("=" * 70)

    # Check for systematic bias - is actual consistently higher/lower than predicted?
    print("\n" + "=" * 70)
    print("SYSTEMATIC BIAS ANALYSIS")
    print("=" * 70)

    for bracket in sorted(by_bracket.keys(), reverse=True):
        players = by_bracket[bracket]
        if len(players) < 3:
            continue

        errors = []
        for m in players:
            pool_size = m['pool_size']
            boundaries = get_bracket_boundaries(pool_size)
            predicted = test_blizzard_interpolation(m, boundaries, pool_size)
            errors.append(m['actual_award'] - predicted)

        # Check if consistently positive (actual > predicted)
        positive_count = sum(1 for e in errors if e > 0)
        negative_count = sum(1 for e in errors if e < 0)
        avg_bias = sum(errors) / len(errors)

        bias_direction = "HIGHER" if avg_bias > 50 else "LOWER" if avg_bias < -50 else "NEUTRAL"
        print(f"  B{bracket}: {positive_count}+ / {negative_count}- bias={avg_bias:+.0f} -> Actual is {bias_direction}")

    # Check if there's a floor boost
    print("\n" + "=" * 70)
    print("FLOOR BOOST DETECTION")
    print("=" * 70)

    for bracket in sorted(by_bracket.keys(), reverse=True):
        players = by_bracket[bracket]
        if len(players) < 3:
            continue

        pool_size = players[0]['pool_size']
        boundaries = get_bracket_boundaries(pool_size)
        bracket_min_award = BASE_AWARDS.get(bracket - 1, 0) if bracket > 1 else 0
        bracket_max_award = BASE_AWARDS.get(bracket, 0)

        # Check bottom-of-bracket players
        sorted_players = sorted(players, key=lambda x: x['standing'], reverse=True)
        bottom_players = sorted_players[:max(1, len(players) // 3)]

        if bottom_players:
            avg_bottom_actual = sum(p['actual_award'] for p in bottom_players) / len(bottom_players)
            expected_bottom = bracket_min_award + (bracket_max_award - bracket_min_award) * 0.1  # ~10% from bottom

            floor_boost = avg_bottom_actual - bracket_min_award
            print(f"  B{bracket}: Bottom players avg={avg_bottom_actual:.0f}, bracket_floor={bracket_min_award}, boost={floor_boost:+.0f}")

    # Final formula derivation
    print("\n" + "=" * 70)
    print("DERIVED FORMULA")
    print("=" * 70)

    print("""
Based on the analysis, the formula is:

BLIZZARD'S RP AWARD FORMULA:
===========================

Given:
  S = standing (1 = top)
  P = pool_size
  R = pre_rp (RP before reset)

STEP 1: Find Bracket
  percentile = S / P

  Bracket b where T[b-1] < percentile <= T[b]

  T = {14: 0.003, 13: 0.006, 12: 0.012, 11: 0.025, 10: 0.05,
       9: 0.10, 8: 0.15, 7: 0.20, 6: 0.35, 5: 0.50,
       4: 0.65, 3: 0.80, 2: 0.95, 1: 1.00}

STEP 2: Calculate Position Within Bracket
  bracket_start = floor(P * T[b-1]) + 1
  bracket_size = floor(P * T[b]) - floor(P * T[b-1])
  position = (S - bracket_start) / bracket_size

STEP 3: Calculate Award (Linear Interpolation)
  A = {14: 13000, 13: 12000, 12: 11000, 11: 10000, 10: 9000,
       9: 8000, 8: 7000, 7: 6000, 6: 5000, 5: 4000,
       4: 3500, 3: 3000, 2: 2500, 1: 2000}

  bracket_max = A[b]
  bracket_min = A[b-1]  (or 0 if b=1)

  award = bracket_max - (position * (bracket_max - bracket_min))

STEP 4: Apply Decay
  decay = floor(R * 0.20)

STEP 5: Calculate Final RP
  new_rp = R - decay + award
         = R * 0.80 + award

COMPACT ALGEBRAIC FORM:
======================
  new_rp = 0.80 * R + A[b] - pos(S,P,b) * (A[b] - A[b-1])

Where:
  pos(S,P,b) = (S - floor(P*T[b-1]) - 1) / (floor(P*T[b]) - floor(P*T[b-1]))
""")

if __name__ == '__main__':
    analyze_all_data()

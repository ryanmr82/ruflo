#!/usr/bin/env python3
"""
Reverse Engineer Blizzard's RP Award Formula - V3
Account for FLOOR BOOST mechanism discovered in V2
"""

import json
import math
from collections import defaultdict

BRACKET_THRESHOLDS = [
    (0.003, 14), (0.006, 13), (0.012, 12), (0.025, 11), (0.05, 10),
    (0.10, 9), (0.15, 8), (0.20, 7), (0.35, 6), (0.50, 5),
    (0.65, 4), (0.80, 3), (0.95, 2), (1.0, 1)
]

BASE_AWARDS = {
    14: 13000, 13: 12000, 12: 11000, 11: 10000, 10: 9000,
    9: 8000, 8: 7000, 7: 6000, 6: 5000, 5: 4000,
    4: 3500, 3: 3000, 2: 2500, 1: 2000
}

# From V2 analysis - biases by bracket
OBSERVED_BIAS = {
    14: 394, 13: 285, 12: 584, 11: 842, 10: 785,
    9: 449, 8: 559, 7: 692, 6: 484, 5: -84,
    4: -575, 3: -187, 2: -749
}

AWARD_RANGES = {
    14: (11500, 13500), 13: (10500, 12500), 12: (9500, 11500), 11: (8500, 10500),
    10: (7500, 10500), 9: (6500, 9500), 8: (5500, 8500), 7: (4500, 7000),
    6: (3500, 6500), 5: (2000, 5500), 4: (1500, 5500), 3: (1000, 5500),
    2: (500, 3000), 1: (500, 2500)
}

def load_snapshot(filepath):
    with open(filepath, 'r') as f:
        return json.load(f)

def get_fresh_matches(pre_data, post_data):
    pre_players = pre_data.get('players', {})
    post_players = post_data.get('players', {})
    matches = []

    for name, pre_info in pre_players.items():
        if name in post_players:
            post_info = post_players[name]
            pre_rp = pre_info.get('RP', 0)
            post_rp = post_info.get('RP', 0)
            honor = pre_info.get('thisWeekHonor', 0)
            standing = pre_info.get('standing', 0)
            bracket = pre_info.get('bracket', 0)

            if post_rp == pre_rp or bracket <= 0 or bracket > 14 or standing <= 0:
                continue

            decay = int(pre_rp * 0.20)
            actual_award = post_rp - pre_rp + decay

            if actual_award <= 0:
                continue

            expected_min, expected_max = AWARD_RANGES.get(bracket, (0, 20000))
            if actual_award < expected_min * 0.3 or actual_award > expected_max * 1.8:
                continue

            matches.append({
                'name': name, 'honor': honor, 'standing': standing,
                'bracket': bracket, 'pre_rp': pre_rp, 'post_rp': post_rp,
                'decay': decay, 'actual_award': actual_award
            })

    return matches

def get_bracket_boundaries(pool_size):
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

def formula_linear_interpolation(standing, bracket, boundaries, pool_size):
    """Basic linear interpolation between bracket max and min"""
    b = boundaries.get(bracket, {})
    bracket_start = b.get('start', 1)
    bracket_size = b.get('size', 1)

    bracket_max = BASE_AWARDS.get(bracket, 0)
    bracket_min = BASE_AWARDS.get(bracket - 1, 0) if bracket > 1 else 0

    if bracket_size <= 0:
        return bracket_max

    pos = (standing - bracket_start) / bracket_size
    return bracket_max - (pos * (bracket_max - bracket_min))

def formula_floor_boost(standing, bracket, boundaries, pool_size):
    """
    Hypothesis: Blizzard uses 80% interpolation range, not 100%
    The bottom of each bracket gets floor = bracket_max - 0.80 * (bracket_max - bracket_min)
    This creates a ~20% floor boost
    """
    b = boundaries.get(bracket, {})
    bracket_start = b.get('start', 1)
    bracket_size = b.get('size', 1)

    bracket_max = BASE_AWARDS.get(bracket, 0)
    bracket_min = BASE_AWARDS.get(bracket - 1, 0) if bracket > 1 else 0

    if bracket_size <= 0:
        return bracket_max

    pos = (standing - bracket_start) / bracket_size

    # Only use 80% of the range - bottom of bracket doesn't go all the way down
    range_factor = 0.80
    interpolation_range = (bracket_max - bracket_min) * range_factor

    return bracket_max - (pos * interpolation_range)

def formula_mid_boost(standing, bracket, boundaries, pool_size):
    """
    Hypothesis: Awards curve upward in the middle of each bracket
    Using a quadratic curve that peaks mid-bracket
    """
    b = boundaries.get(bracket, {})
    bracket_start = b.get('start', 1)
    bracket_size = b.get('size', 1)

    bracket_max = BASE_AWARDS.get(bracket, 0)
    bracket_min = BASE_AWARDS.get(bracket - 1, 0) if bracket > 1 else 0

    if bracket_size <= 0:
        return bracket_max

    pos = (standing - bracket_start) / bracket_size

    # Linear base
    linear = bracket_max - (pos * (bracket_max - bracket_min))

    # Add boost that peaks at middle of bracket
    boost = 500 * 4 * pos * (1 - pos)  # Parabola peaking at pos=0.5

    return linear + boost

def formula_rp_based(standing, bracket, boundaries, pool_size, pre_rp):
    """
    Hypothesis: Award is influenced by current RP
    Lower RP players get higher awards within their bracket
    """
    b = boundaries.get(bracket, {})
    bracket_start = b.get('start', 1)
    bracket_size = b.get('size', 1)

    bracket_max = BASE_AWARDS.get(bracket, 0)
    bracket_min = BASE_AWARDS.get(bracket - 1, 0) if bracket > 1 else 0

    if bracket_size <= 0:
        return bracket_max

    pos = (standing - bracket_start) / bracket_size
    linear = bracket_max - (pos * (bracket_max - bracket_min))

    # RP-based boost: lower RP = higher boost
    # At RP=0, boost = +500; at RP=65000, boost = 0
    max_rp = 65000
    rp_factor = 1 - (pre_rp / max_rp)
    rp_boost = 500 * rp_factor

    return linear + rp_boost

def formula_continuous_smooth(standing, bracket, boundaries, pool_size):
    """
    Hypothesis: Continuous percentile-based calculation with smooth curve
    """
    percentile = standing / pool_size

    # Map percentile to award smoothly
    # Use bracket thresholds as control points
    prev_threshold = 0
    for threshold, b in BRACKET_THRESHOLDS:
        if percentile <= threshold:
            bracket_max = BASE_AWARDS.get(b, 0)
            bracket_min = BASE_AWARDS.get(b - 1, 0) if b > 1 else 0

            # Position within this percentile range
            range_size = threshold - prev_threshold
            pos_in_range = (percentile - prev_threshold) / range_size if range_size > 0 else 0

            # Smooth interpolation using sine curve (starts fast, ends slow)
            smooth_pos = math.sin(pos_in_range * math.pi / 2)
            return bracket_max - (smooth_pos * (bracket_max - bracket_min))

        prev_threshold = threshold

    return BASE_AWARDS.get(1, 2000)

def analyze():
    print("=" * 70)
    print("REVERSE ENGINEERING - V3 (Testing Floor Boost Hypothesis)")
    print("=" * 70)

    # Load Dec 9 data
    pre_data = load_snapshot('/home/opc/HonorSpy/snapshots/pre_reset_2025-12-09_15-55.json')
    post_data = load_snapshot('/home/opc/HonorSpy/snapshots/post_reset_2025-12-09_14-25.json')

    pool_size = len(pre_data.get('players', {}))
    matches = get_fresh_matches(pre_data, post_data)

    print(f"\nPool size: {pool_size}")
    print(f"Valid samples: {len(matches)}")

    by_bracket = defaultdict(list)
    for m in matches:
        by_bracket[m['bracket']].append(m)

    # Test each formula
    formulas = {
        'Linear': lambda s, b, bd, p, r: formula_linear_interpolation(s, b, bd, p),
        'Floor Boost (80%)': lambda s, b, bd, p, r: formula_floor_boost(s, b, bd, p),
        'Mid Boost': lambda s, b, bd, p, r: formula_mid_boost(s, b, bd, p),
        'RP-Based': formula_rp_based,
        'Continuous Smooth': lambda s, b, bd, p, r: formula_continuous_smooth(s, b, bd, p),
    }

    boundaries = get_bracket_boundaries(pool_size)

    print("\n" + "=" * 70)
    print("FORMULA COMPARISON BY BRACKET")
    print("=" * 70)

    for formula_name, formula_func in formulas.items():
        total_error = 0
        total_abs = 0
        count = 0

        bracket_errors = {}

        for bracket in sorted(by_bracket.keys(), reverse=True):
            players = by_bracket[bracket]
            errors = []

            for m in players:
                pred = formula_func(m['standing'], m['bracket'], boundaries, pool_size, m['pre_rp'])
                err = m['actual_award'] - pred
                errors.append(err)
                total_error += err
                total_abs += abs(err)
                count += 1

            if errors:
                bracket_errors[bracket] = sum(errors) / len(errors)

        avg_err = total_error / count if count > 0 else 0
        avg_abs = total_abs / count if count > 0 else 0

        print(f"\n{formula_name}:")
        print(f"  Overall: Avg Error = {avg_err:+.0f}, Avg Abs = {avg_abs:.0f}")

    # Detailed analysis of best formula (Floor Boost)
    print("\n" + "=" * 70)
    print("DETAILED FLOOR BOOST (80%) ANALYSIS")
    print("=" * 70)

    for bracket in sorted(by_bracket.keys(), reverse=True):
        players = by_bracket[bracket]
        if not players:
            continue

        errors = []
        for m in players:
            pred = formula_floor_boost(m['standing'], m['bracket'], boundaries, pool_size)
            errors.append({
                'name': m['name'],
                'standing': m['standing'],
                'actual': m['actual_award'],
                'pred': pred,
                'error': m['actual_award'] - pred
            })

        avg_err = sum(e['error'] for e in errors) / len(errors)
        avg_abs = sum(abs(e['error']) for e in errors) / len(errors)

        print(f"\nB{bracket}: {len(players)} samples, Avg Error = {avg_err:+.0f}, Avg Abs = {avg_abs:.0f}")

    # Find optimal floor factor
    print("\n" + "=" * 70)
    print("OPTIMIZING FLOOR FACTOR")
    print("=" * 70)

    best_factor = 1.0
    best_abs_error = float('inf')

    for factor in [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00]:
        total_abs = 0
        count = 0

        for m in matches:
            b = boundaries.get(m['bracket'], {})
            bracket_start = b.get('start', 1)
            bracket_size = b.get('size', 1)

            bracket_max = BASE_AWARDS.get(m['bracket'], 0)
            bracket_min = BASE_AWARDS.get(m['bracket'] - 1, 0) if m['bracket'] > 1 else 0

            if bracket_size > 0:
                pos = (m['standing'] - bracket_start) / bracket_size
                interpolation_range = (bracket_max - bracket_min) * factor
                pred = bracket_max - (pos * interpolation_range)

                total_abs += abs(m['actual_award'] - pred)
                count += 1

        avg_abs = total_abs / count if count > 0 else float('inf')
        print(f"  Factor {factor:.2f}: Avg Abs Error = {avg_abs:.0f}")

        if avg_abs < best_abs_error:
            best_abs_error = avg_abs
            best_factor = factor

    print(f"\n  BEST FACTOR: {best_factor:.2f} (Avg Abs Error = {best_abs_error:.0f})")

    # Calculate optimal floor boost per bracket
    print("\n" + "=" * 70)
    print("OPTIMAL FACTOR PER BRACKET")
    print("=" * 70)

    bracket_factors = {}

    for bracket in sorted(by_bracket.keys(), reverse=True):
        players = by_bracket[bracket]
        if len(players) < 3:
            continue

        best_factor = 1.0
        best_abs = float('inf')

        for factor in [x/100 for x in range(50, 110, 5)]:
            total_abs = 0

            for m in players:
                b = boundaries.get(bracket, {})
                bracket_start = b.get('start', 1)
                bracket_size = b.get('size', 1)

                bracket_max = BASE_AWARDS.get(bracket, 0)
                bracket_min = BASE_AWARDS.get(bracket - 1, 0) if bracket > 1 else 0

                if bracket_size > 0:
                    pos = (m['standing'] - bracket_start) / bracket_size
                    interpolation_range = (bracket_max - bracket_min) * factor
                    pred = bracket_max - (pos * interpolation_range)
                    total_abs += abs(m['actual_award'] - pred)

            avg_abs = total_abs / len(players)
            if avg_abs < best_abs:
                best_abs = avg_abs
                best_factor = factor

        bracket_factors[bracket] = best_factor
        print(f"  B{bracket}: Best factor = {best_factor:.2f} (Avg Abs = {best_abs:.0f})")

    # Final formula output
    print("\n" + "=" * 70)
    print("FINAL FORMULA (Calibrated)")
    print("=" * 70)

    print("""
BLIZZARD'S RP AWARD FORMULA (Turtle WoW - Calibrated):
======================================================

STEP 1: Calculate Bracket (b) from standing (S) and pool size (P)
  percentile = S / P
  Find b where T[b-1] < percentile <= T[b]

STEP 2: Calculate Position Within Bracket
  bracket_start = floor(P * T[b-1]) + 1
  bracket_size = floor(P * T[b]) - floor(P * T[b-1])
  position = (S - bracket_start) / bracket_size

STEP 3: Calculate Award
  A[b] = Base award for bracket b
  range = A[b] - A[b-1]
  factor = interpolation factor (see table)

  award = A[b] - (position * range * factor)

STEP 4: Final RP Calculation
  decay = floor(pre_rp * 0.20)
  new_rp = pre_rp - decay + award

BRACKET THRESHOLDS (T):
  T[14] = 0.003, T[13] = 0.006, T[12] = 0.012, T[11] = 0.025, T[10] = 0.05
  T[9] = 0.10, T[8] = 0.15, T[7] = 0.20, T[6] = 0.35, T[5] = 0.50
  T[4] = 0.65, T[3] = 0.80, T[2] = 0.95, T[1] = 1.00

BASE AWARDS (A):
  A[14] = 13000, A[13] = 12000, A[12] = 11000, A[11] = 10000, A[10] = 9000
  A[9] = 8000, A[8] = 7000, A[7] = 6000, A[6] = 5000, A[5] = 4000
  A[4] = 3500, A[3] = 3000, A[2] = 2500, A[1] = 2000
""")

    print("\nCALIBRATED INTERPOLATION FACTORS:")
    for b in sorted(bracket_factors.keys(), reverse=True):
        factor = bracket_factors[b]
        bracket_max = BASE_AWARDS.get(b, 0)
        bracket_min = BASE_AWARDS.get(b - 1, 0) if b > 1 else 0
        floor = bracket_max - (factor * (bracket_max - bracket_min))
        print(f"  B{b}: factor={factor:.2f} -> range {bracket_max} to {floor:.0f}")

if __name__ == '__main__':
    analyze()

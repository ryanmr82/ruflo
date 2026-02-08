#!/usr/bin/env python3
"""
Reverse Engineer Blizzard's RP Award Formula
Using Dec 2 and Dec 9 reset data
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

def load_snapshot(filepath):
    """Load snapshot JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def get_fresh_matches(pre_data, post_data):
    """Get players who appear in both snapshots with different RP (fresh data)"""
    pre_players = pre_data.get('players', {})
    post_players = post_data.get('players', {})

    matches = []
    for name, pre_info in pre_players.items():
        if name in post_players:
            post_info = post_players[name]
            pre_rp = pre_info.get('RP', 0)
            post_rp = post_info.get('RP', 0)

            # Only include fresh data (RP changed)
            if post_rp != pre_rp:
                honor = pre_info.get('thisWeekHonor', 0)
                standing = pre_info.get('standing', 0)
                bracket = pre_info.get('bracket', 0)

                decay = int(pre_rp * 0.20)
                actual_award = post_rp - pre_rp + decay

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

    return matches

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

    # Position from top of bracket (0 = first, 1 = last)
    position = (standing - start) / (size - 1) if size > 1 else 0
    return min(1.0, max(0.0, position))

def test_formula_linear_interpolation(player, boundaries, pool_size):
    """
    Hypothesis 1: Linear interpolation between bracket awards
    Award = bracket_award - (position_in_bracket * (bracket_award - next_bracket_award))
    """
    bracket = player['bracket']
    position = calculate_position_in_bracket(player['standing'], bracket, boundaries)

    current_award = BASE_AWARDS.get(bracket, 0)
    next_award = BASE_AWARDS.get(bracket - 1, current_award) if bracket > 1 else 0

    # Interpolate between current and next bracket
    predicted = current_award - (position * (current_award - next_award))
    return predicted

def test_formula_percentile_based(player, boundaries, pool_size):
    """
    Hypothesis 2: Percentile-based calculation
    Award = base_award * (1 - standing/pool_size * factor)
    """
    bracket = player['bracket']
    base = BASE_AWARDS.get(bracket, 0)
    percentile = player['standing'] / pool_size

    # Factor based on bracket
    factor = 0.1  # 10% variance within bracket
    predicted = base * (1 - percentile * factor / 14)
    return predicted

def test_formula_honor_weighted(player, boundaries, pool_size, max_honor):
    """
    Hypothesis 3: Honor-weighted within bracket
    Award = base_award - (position * range)
    where range depends on bracket gap
    """
    bracket = player['bracket']
    position = calculate_position_in_bracket(player['standing'], bracket, boundaries)

    current_award = BASE_AWARDS.get(bracket, 0)
    next_award = BASE_AWARDS.get(bracket - 1, current_award - 1000)

    # Range between this bracket and next
    award_range = current_award - next_award

    # Position interpolation
    predicted = current_award - (position * award_range)
    return predicted

def test_formula_continuous_percentile(player, boundaries, pool_size):
    """
    Hypothesis 4: Continuous percentile calculation
    Award based purely on percentile position across entire ladder
    """
    percentile = player['standing'] / pool_size

    # Find where this percentile falls
    for threshold, bracket in BRACKET_THRESHOLDS:
        if percentile <= threshold:
            # Get previous threshold
            prev_threshold = 0
            prev_bracket = 15  # Theoretical max
            for t, b in BRACKET_THRESHOLDS:
                if b == bracket + 1:
                    prev_threshold = t
                    prev_bracket = b
                    break

            # Position within this bracket's percentile range
            bracket_range = threshold - prev_threshold
            pos_in_range = (percentile - prev_threshold) / bracket_range if bracket_range > 0 else 0

            current_award = BASE_AWARDS.get(bracket, 0)
            next_award = BASE_AWARDS.get(bracket - 1, 0)

            predicted = current_award - (pos_in_range * (current_award - next_award))
            return predicted

    return BASE_AWARDS.get(1, 2000)

def test_formula_blizzard_classic(player, boundaries, pool_size):
    """
    Hypothesis 5: Classic WoW formula (CP-based)
    Award = CP * BracketModifier
    where CP = ContributionPoints based on honor

    The formula from vanilla WoW:
    - RP_Gain = BonusPercent * (MaxRP * BracketPercent - CurrentRP)
    - Where BonusPercent typically 0.2 for high brackets
    """
    bracket = player['bracket']
    pre_rp = player['pre_rp']

    # Bracket percentage (how much of max RP you can gain)
    bracket_percents = {
        14: 1.00, 13: 0.923, 12: 0.846, 11: 0.769, 10: 0.692,
        9: 0.615, 8: 0.538, 7: 0.462, 6: 0.385, 5: 0.308,
        4: 0.269, 3: 0.231, 2: 0.192, 1: 0.154
    }

    max_rp = 65000  # Max RP in system
    bracket_percent = bracket_percents.get(bracket, 0.154)

    # Classic formula: gain based on distance to ceiling
    ceiling = max_rp * bracket_percent

    # The gain is proportional to how far below ceiling you are
    # At low RP, you gain more; at high RP, you gain less
    gain_factor = 0.2  # 20% of difference

    if pre_rp < ceiling:
        predicted = gain_factor * (ceiling - pre_rp)
    else:
        predicted = 0

    return max(0, predicted)

def test_formula_flat_bracket(player, boundaries, pool_size):
    """
    Hypothesis 6: Simple flat bracket award (no interpolation)
    Award = BASE_AWARDS[bracket]
    """
    return BASE_AWARDS.get(player['bracket'], 0)

def test_formula_standing_linear(player, boundaries, pool_size):
    """
    Hypothesis 7: Linear based on standing across entire pool
    Award = MaxAward * (1 - standing/pool_size)
    """
    max_award = 13000
    min_award = 2000

    percentile = player['standing'] / pool_size
    predicted = max_award - (percentile * (max_award - min_award))
    return predicted

def test_formula_blizzard_interpolation(player, boundaries, pool_size):
    """
    Hypothesis 8: Blizzard's actual interpolation formula

    Within each bracket, award interpolates from bracket ceiling to floor
    based on position within that bracket

    Award = BracketMax - ((Standing - BracketStart) / BracketSize) * (BracketMax - BracketMin)

    Where:
    - BracketMax = This bracket's max award
    - BracketMin = Next bracket's max award (the floor)
    - BracketStart = First standing in this bracket
    - BracketSize = Number of players in this bracket
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

    # Load all snapshots
    print("=" * 70)
    print("REVERSE ENGINEERING BLIZZARD'S RP AWARD FORMULA")
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
            matches = get_fresh_matches(pre_data, post_data)

            for m in matches:
                m['pool_size'] = pool_size
                m['dataset'] = ds['name']

            all_matches.extend(matches)
            print(f"  Pool size: {pool_size}")
            print(f"  Fresh matches: {len(matches)}")
        except Exception as e:
            print(f"  Error loading {ds['name']}: {e}")

    print(f"\nTotal fresh data points: {len(all_matches)}")

    if not all_matches:
        print("No data to analyze!")
        return

    # Group by bracket for analysis
    by_bracket = defaultdict(list)
    for m in all_matches:
        by_bracket[m['bracket']].append(m)

    # Test each formula hypothesis
    formulas = {
        'Linear Interpolation': test_formula_linear_interpolation,
        'Honor Weighted': test_formula_honor_weighted,
        'Continuous Percentile': test_formula_continuous_percentile,
        'Blizzard Classic': test_formula_blizzard_classic,
        'Flat Bracket': test_formula_flat_bracket,
        'Standing Linear': test_formula_standing_linear,
        'Blizzard Interpolation': test_formula_blizzard_interpolation,
    }

    print("\n" + "=" * 70)
    print("TESTING FORMULA HYPOTHESES")
    print("=" * 70)

    formula_errors = {}

    for name, formula_func in formulas.items():
        total_error = 0
        total_abs_error = 0
        count = 0
        errors_by_bracket = defaultdict(list)

        for m in all_matches:
            pool_size = m['pool_size']
            boundaries = get_bracket_boundaries(pool_size)
            max_honor = max(p['honor'] for p in all_matches if p['pool_size'] == pool_size)

            if name == 'Honor Weighted':
                predicted = formula_func(m, boundaries, pool_size, max_honor)
            else:
                predicted = formula_func(m, boundaries, pool_size)

            actual = m['actual_award']
            error = actual - predicted
            abs_error = abs(error)

            total_error += error
            total_abs_error += abs_error
            count += 1
            errors_by_bracket[m['bracket']].append(error)

        avg_error = total_error / count if count > 0 else 0
        avg_abs_error = total_abs_error / count if count > 0 else 0

        formula_errors[name] = {
            'avg_error': avg_error,
            'avg_abs_error': avg_abs_error,
            'by_bracket': {b: sum(e)/len(e) for b, e in errors_by_bracket.items()}
        }

        print(f"\n{name}:")
        print(f"  Avg Error: {avg_error:+.1f} RP")
        print(f"  Avg Abs Error: {avg_abs_error:.1f} RP")

    # Find best formula
    best = min(formula_errors.items(), key=lambda x: x[1]['avg_abs_error'])
    print("\n" + "=" * 70)
    print(f"BEST FIT: {best[0]} (Avg Abs Error: {best[1]['avg_abs_error']:.1f} RP)")
    print("=" * 70)

    # Deep dive on best formula
    print("\n" + "-" * 70)
    print(f"DETAILED ANALYSIS: {best[0]}")
    print("-" * 70)

    for bracket in sorted(by_bracket.keys(), reverse=True):
        players = by_bracket[bracket]
        if not players:
            continue

        errors = []
        for m in players:
            pool_size = m['pool_size']
            boundaries = get_bracket_boundaries(pool_size)
            max_honor = max(p['honor'] for p in all_matches if p['pool_size'] == pool_size)

            if best[0] == 'Honor Weighted':
                predicted = test_formula_honor_weighted(m, boundaries, pool_size, max_honor)
            elif best[0] == 'Blizzard Interpolation':
                predicted = test_formula_blizzard_interpolation(m, boundaries, pool_size)
            elif best[0] == 'Linear Interpolation':
                predicted = test_formula_linear_interpolation(m, boundaries, pool_size)
            elif best[0] == 'Continuous Percentile':
                predicted = test_formula_continuous_percentile(m, boundaries, pool_size)
            else:
                predicted = BASE_AWARDS.get(bracket, 0)

            errors.append({
                'actual': m['actual_award'],
                'predicted': predicted,
                'error': m['actual_award'] - predicted,
                'standing': m['standing'],
                'honor': m['honor']
            })

        avg_actual = sum(e['actual'] for e in errors) / len(errors)
        avg_predicted = sum(e['predicted'] for e in errors) / len(errors)
        avg_error = sum(e['error'] for e in errors) / len(errors)
        max_error = max(abs(e['error']) for e in errors)

        print(f"\nBracket {bracket}: {len(players)} samples")
        print(f"  Avg Actual Award: {avg_actual:.0f}")
        print(f"  Avg Predicted:    {avg_predicted:.0f}")
        print(f"  Avg Error:        {avg_error:+.0f}")
        print(f"  Max Abs Error:    {max_error:.0f}")

    # Output the derived formula
    print("\n" + "=" * 70)
    print("DERIVED FORMULA")
    print("=" * 70)

    print("""
BLIZZARD'S RP AWARD FORMULA (Reverse Engineered):

STEP 1: Calculate Bracket
    percentile = standing / pool_size

    Bracket thresholds:
    B14: 0.000 - 0.003 (top 0.3%)
    B13: 0.003 - 0.006 (next 0.3%)
    B12: 0.006 - 0.012 (next 0.6%)
    B11: 0.012 - 0.025 (next 1.3%)
    B10: 0.025 - 0.050 (next 2.5%)
    B9:  0.050 - 0.100 (next 5%)
    B8:  0.100 - 0.150 (next 5%)
    B7:  0.150 - 0.200 (next 5%)
    B6:  0.200 - 0.350 (next 15%)
    B5:  0.350 - 0.500 (next 15%)
    B4:  0.500 - 0.650 (next 15%)
    B3:  0.650 - 0.800 (next 15%)
    B2:  0.800 - 0.950 (next 15%)
    B1:  0.950 - 1.000 (bottom 5%)

STEP 2: Calculate Position Within Bracket
    bracket_start = first standing in bracket
    bracket_size = number of players in bracket
    position = (standing - bracket_start) / bracket_size

    position ranges from 0.0 (top of bracket) to ~1.0 (bottom of bracket)

STEP 3: Calculate Award via Interpolation
    BASE_AWARDS = {14: 13000, 13: 12000, 12: 11000, 11: 10000, 10: 9000,
                   9: 8000, 8: 7000, 7: 6000, 6: 5000, 5: 4000,
                   4: 3500, 3: 3000, 2: 2500, 1: 2000}

    bracket_max = BASE_AWARDS[bracket]        # Top of this bracket gets this
    bracket_min = BASE_AWARDS[bracket - 1]    # Bottom approaches next bracket's top

    award = bracket_max - (position * (bracket_max - bracket_min))

STEP 4: Calculate Final RP
    decay = floor(pre_rp * 0.20)
    gain = award - decay
    post_rp = pre_rp + gain

    Or equivalently:
    post_rp = pre_rp * 0.80 + award

ALGEBRAIC FORMULA (Single Equation):

    Let S = standing, P = pool_size, R = pre_rp
    Let T[b] = percentile threshold for bracket b
    Let A[b] = base award for bracket b

    1. Find bracket b where: T[b-1] < S/P <= T[b]

    2. bracket_start = floor(P * T[b-1]) + 1
       bracket_end = floor(P * T[b])

    3. position = (S - bracket_start) / (bracket_end - bracket_start)

    4. award = A[b] - position * (A[b] - A[b-1])

    5. new_rp = floor(R * 0.80) + award
""")

    # Verify with specific examples
    print("\n" + "=" * 70)
    print("FORMULA VERIFICATION (Sample Players)")
    print("=" * 70)

    # Pick some examples from different brackets
    for bracket in [14, 13, 12, 10, 8, 5]:
        players = by_bracket.get(bracket, [])
        if players:
            sample = players[0]
            pool_size = sample['pool_size']
            boundaries = get_bracket_boundaries(pool_size)

            b = boundaries.get(bracket, {})
            bracket_start = b.get('start', 1)
            bracket_size = b.get('size', 1)
            position = (sample['standing'] - bracket_start) / bracket_size if bracket_size > 0 else 0

            bracket_max = BASE_AWARDS.get(bracket, 0)
            bracket_min = BASE_AWARDS.get(bracket - 1, 0)
            predicted_award = bracket_max - (position * (bracket_max - bracket_min))

            print(f"\nBracket {bracket} Example: {sample['name']}")
            print(f"  Standing: {sample['standing']} / {pool_size}")
            print(f"  Bracket range: {bracket_start} - {b.get('end', bracket_start)}")
            print(f"  Position in bracket: {position:.3f}")
            print(f"  Award range: {bracket_max} -> {bracket_min}")
            print(f"  Predicted award: {predicted_award:.0f}")
            print(f"  Actual award: {sample['actual_award']}")
            print(f"  Error: {sample['actual_award'] - predicted_award:+.0f}")

if __name__ == '__main__':
    analyze_all_data()

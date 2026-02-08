#!/usr/bin/env python3
"""Update API to track all CC types with detailed breakdown"""

import sys
import re

# Read the file
with open(sys.argv[1], 'r') as f:
    content = f.read()

# 1. Update PlayerStats interface to use CC instead of interrupts
old_interface = '''  interrupts: Record<string, number>;
}'''

new_interface = '''  cc: {
    total: number;
    interrupts: Record<string, number>;  // spell interrupted -> count
    stuns: Record<string, number>;       // stun ability -> count
    polymorphs: Record<string, number>;  // poly target -> count
    fears: Record<string, number>;       // fear ability -> count
    roots: Record<string, number>;       // root ability -> count
    kicks: Record<string, number>;       // kick/pummel -> count
    other: Record<string, number>;       // other CC -> count
    byTarget: Record<string, number>;    // target name -> count
  };
}'''

if old_interface in content:
    content = content.replace(old_interface, new_interface)
    print("SUCCESS: Updated PlayerStats interface")
else:
    print("WARNING: Could not find PlayerStats interface to update")

# 2. Update the player stats initialization
old_init = '''      playerStats.set(name, {
        name,
        deaths: 0,
        totalConsumables: 0,
        food: {},
        potions: {},
        elixirs: {},
        flasks: {},
        jujus: {},
        scrolls: {},
        weaponEnhancements: {},
        worldBuffs: {},
        misc: {},
        dispels: {},
        protective: {},
        interrupts: {},
      });'''

new_init = '''      playerStats.set(name, {
        name,
        deaths: 0,
        totalConsumables: 0,
        food: {},
        potions: {},
        elixirs: {},
        flasks: {},
        jujus: {},
        scrolls: {},
        weaponEnhancements: {},
        worldBuffs: {},
        misc: {},
        dispels: {},
        protective: {},
        cc: {
          total: 0,
          interrupts: {},
          stuns: {},
          polymorphs: {},
          fears: {},
          roots: {},
          kicks: {},
          other: {},
          byTarget: {},
        },
      });'''

if old_init in content:
    content = content.replace(old_init, new_init)
    print("SUCCESS: Updated player stats initialization")
else:
    print("WARNING: Could not find player stats initialization to update")

# 3. Replace the interrupt parsing with comprehensive CC parsing
old_interrupt_parse = '''    // Pattern 5: "PlayerName interrupts Target 's SpellName."
    const interruptMatch = line.match(/(\\w+) interrupts (.+?) 's (.+?)\\./);
    if (interruptMatch) {
      const [, interrupter, , spellName] = interruptMatch;
      if (confirmedPlayers.has(interrupter)) {
        const stats = playerStats.get(interrupter)!;
        const key = spellName.trim();
        stats.interrupts[key] = (stats.interrupts[key] || 0) + 1;
      }
    }'''

new_cc_parse = '''    // Pattern 5: Comprehensive CC tracking

    // 5a: Spell interrupts - "PlayerName interrupts Target 's SpellName."
    const interruptMatch = line.match(/(\\w+) interrupts (.+?) 's (.+?)\\./);
    if (interruptMatch) {
      const [, player, target, spellName] = interruptMatch;
      if (confirmedPlayers.has(player)) {
        const stats = playerStats.get(player)!;
        const key = spellName.trim();
        stats.cc.interrupts[key] = (stats.cc.interrupts[key] || 0) + 1;
        stats.cc.byTarget[target] = (stats.cc.byTarget[target] || 0) + 1;
        stats.cc.total++;
      }
    }

    // 5b: Casts CC abilities - "PlayerName casts SpellName on Target." or "PlayerName casts SpellName."
    const castMatch = line.match(/(\\w+) casts (.+?)(?: on (.+?))?\\./);
    if (castMatch) {
      const [, player, spellName, target] = castMatch;
      if (confirmedPlayers.has(player)) {
        const stats = playerStats.get(player)!;
        const spell = spellName.trim();
        const targetName = target ? target.trim() : "AoE";

        // Categorize the CC type
        if (/Polymorph/i.test(spell)) {
          stats.cc.polymorphs[spell] = (stats.cc.polymorphs[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        } else if (/Fear|Psychic Scream|Howl of Terror|Intimidating Shout/i.test(spell)) {
          stats.cc.fears[spell] = (stats.cc.fears[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        } else if (/Frost Nova|Entangling Roots/i.test(spell)) {
          stats.cc.roots[spell] = (stats.cc.roots[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        } else if (/Kidney Shot|Cheap Shot|Gouge|Blind|Sap|Hammer of Justice|Repentance|Bash|War Stomp|Hibernate/i.test(spell)) {
          stats.cc.stuns[spell] = (stats.cc.stuns[spell] || 0) + 1;
          stats.cc.byTarget[targetName] = (stats.cc.byTarget[targetName] || 0) + 1;
          stats.cc.total++;
        }
      }
    }

    // 5c: Kick/Pummel/Shield Bash/Earth Shock usage - "PlayerName 's Kick hits Target for X."
    const kickMatch = line.match(/(\\w+) 's (Kick|Pummel|Shield Bash) (hits|crits) (.+?) for/);
    if (kickMatch) {
      const [, player, ability, , target] = kickMatch;
      if (confirmedPlayers.has(player)) {
        const stats = playerStats.get(player)!;
        stats.cc.kicks[ability] = (stats.cc.kicks[ability] || 0) + 1;
        stats.cc.byTarget[target] = (stats.cc.byTarget[target] || 0) + 1;
        stats.cc.total++;
      }
    }'''

if old_interrupt_parse in content:
    content = content.replace(old_interrupt_parse, new_cc_parse)
    print("SUCCESS: Updated CC parsing logic")
else:
    print("WARNING: Could not find interrupt parsing to update - searching for alternative...")
    # Try to find a simpler match
    if "Pattern 5:" in content and "interruptMatch" in content:
        print("Found Pattern 5 section but couldn't match exactly")
    else:
        print("Could not find Pattern 5 section at all")

# 4. Update summary generation
old_summary = '''    totalInterrupts: number;
    mostInterrupts: { player: string; count: number };'''

new_summary = '''    totalCC: number;
    mostCC: { player: string; count: number };'''

if old_summary in content:
    content = content.replace(old_summary, new_summary)
    print("SUCCESS: Updated summary interface")
else:
    print("WARNING: Could not find summary interface to update")

# 5. Update summary calculation
old_summary_calc = '''  // Calculate total interrupts
  let totalInterrupts = 0;
  let mostInterrupts = { player: "", count: 0 };

  for (const stats of playerStats) {
    const playerInterrupts = Object.values(stats.interrupts).reduce((a, b) => a + b, 0);
    totalInterrupts += playerInterrupts;
    if (playerInterrupts > mostInterrupts.count) {
      mostInterrupts = { player: stats.name, count: playerInterrupts };
    }
  }'''

new_summary_calc = '''  // Calculate total CC
  let totalCC = 0;
  let mostCC = { player: "", count: 0 };

  for (const stats of playerStats) {
    const playerCC = stats.cc.total;
    totalCC += playerCC;
    if (playerCC > mostCC.count) {
      mostCC = { player: stats.name, count: playerCC };
    }
  }'''

if old_summary_calc in content:
    content = content.replace(old_summary_calc, new_summary_calc)
    print("SUCCESS: Updated summary calculation")
else:
    print("WARNING: Could not find summary calculation to update")

# 6. Update summary return
old_return = '''    totalInterrupts,
    mostInterrupts,'''

new_return = '''    totalCC,
    mostCC,'''

if old_return in content:
    content = content.replace(old_return, new_return)
    print("SUCCESS: Updated summary return")
else:
    print("WARNING: Could not find summary return to update")

# Write the updated file
with open(sys.argv[1], 'w') as f:
    f.write(content)

print("\\nDone updating API file")

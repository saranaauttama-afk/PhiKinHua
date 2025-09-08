# Patch Notes

## 🔥 Latest: Equipment Card System (Major Update)

### Equipment Cards & Dynamic Installation System
**Date**: Current Session

#### 🎮 New Features
- **Equipment Cards in Starting Deck**: Added 2 equipment cards to starting deck
  - `Regeneration Charm Card` - Heal 1 HP at end of turn
  - `Start Shield Card` - Gain 5 Block at start of each turn (updated from combat-start only)
- **Dynamic Equipment Management**:
  - **Before Combat**: Equip/unequip through deck UI
  - **During Combat**: Play equipment cards for temporary installation
  - **Temporary Equipment Slots**: 5 additional slots during combat (6 total)

#### ⚔️ Combat Equipment System
- **Smart Card Removal**: Equipped cards removed from deck to prevent drawing
- **Temporary Installation**: Equipment cards played during combat install temporarily
- **Auto-cleanup**: Temporary equipment removed after combat ends
- **Slot Management**: Base(1) + Temp(5) = 6 slots during combat

#### 🎯 UI/UX Improvements  
- **Equipment Status Display**: Real-time equipment tracking during combat
- **Deck Management UI**: Equip/unequip interface with visual feedback
- **Combat Lock**: Deck modification disabled during combat
- **Smart Indicators**: Color-coded permanent vs temporary equipment

#### 🔧 Technical Improvements
- **Equipment State Tracking**: `sourceCard` system for proper card restoration
- **Slot Calculation**: Dynamic slot system with temporary expansion
- **Debug Integration**: Comprehensive logging for equipment operations
- **Save/Load System**: JSON-based save/load with version management and auto-save functionality

---

## Equipment & Battle Wiring (Previous)

### Summary
This patch wires equipment runtime hooks (battle start, start/end of turn, on card played) and fixes page-2 combat freeze. It keeps the core deterministic and pure.

### Key fixes
- **Equipment**
  - Robust once-per-turn gating with safe initialization.
  - `runEquipmentOnBattleStart` (alias of `runEquipmentOnEquip`) called on entering combat.
  - Player: hooks at start/end of player turn and on card played.
  - Enemy: hooks at start/end of enemy turn and on card played.
- **Battle/Pages**
  - Page 2 freeze addressed by fully resetting combat state and `nodePhase` when entering/leaving combat.
  - Consistent RNG threading.
  - Intent preview set from enemy draw pile top at battle start.

## Modified files (with `// PATCH:` comments in code)
- `src/core/equipmentRuntime.ts`
  - `ensureEquipFlags` to guard `turnFlags.equipmentOnce`
  - start/end/card/damage hooks; once-per-turn per side
  - `runEquipmentOnBattleStart` alias
- `src/core/engine/handlers/map_pages.ts`
  - Enter combat flow reset + `nodePhase='in_combat'`
  - Leave combat reset + `nodePhase='map_ready'`
  - `runEquipmentOnEquip` call after building decks & drawing
  - Intent preview set
- `src/core/commands.ts`
  - `startPlayerTurn` now resets equipment turn flags and fires `on_turn_start (player)`
- `src/core/engine/handlers/combat.ts`
  - End-turn fires `on_turn_end (player)` (play hook already present depending on build)
- `src/core/engine/handlers/enemy.ts`
  - New imports for equipment hooks
  - Start-turn reset + `on_turn_start (enemy)`
  - `runEquipmentCardPlayed` when enemy plays a card
  - End-turn `on_turn_end (enemy)`

## Quick test
1) Start a new run → index shows Equipment panel (1/1 slots).
2) Enter combat:
   - Battle-start equipment (e.g., `start_shield`) applies immediately.
3) Player turn:
   - First card played triggers `battle_rhythm_band` (+1 energy once per turn).
   - End turn triggers end-turn equipment (e.g., `regen_charm`).
4) Page 2 → choose monster → immediately enters combat (no freeze).
# PhiKinHua - Roguelike Card Game

A turn-based roguelike card game with equipment and blessing systems, built with React Native and TypeScript.

**Inspired by**: Night of the Full Moon (月圆之夜) - Following similar mechanics of card-based combat, equipment system, and roguelike progression.

## 🎮 Game Concept

**Genre**: Roguelike Deckbuilder (Night of the Full Moon style)  
**Core Loop**: Navigate pages → Choose encounters → Battle with cards → Collect equipment/blessings → Progress

### Core Mechanics
- **Card Combat**: Turn-based battles using attack/skill/equipment cards
- **Equipment System**: Permanent and temporary equipment with slot management  
- **Blessing System**: Passive abilities that trigger on various events
- **Pages Navigation**: Map system with multiple encounter types per page

### Similar to Night of the Full Moon
- **Equipment Cards**: Cards that install equipment when played
- **Temporary vs Permanent**: Equipment behaves differently based on installation context
- **Slot Management**: Limited equipment capacity with strategic choices
- **Page-based Progression**: Navigate through story pages with encounter choices
- **Blessing System**: Passive abilities similar to NOTM's blessing mechanics

## ⚔️ Equipment System

### Equipment Types
- **Regeneration Charm**: Heal 1 HP at end of turn
- **Start Shield**: Gain 5 Block at start of each turn  
- **Battle Rhythm Band**: First card played each turn grants +1 Energy

### Equipment Management
- **Starting Deck**: Contains 2 equipment cards by default
- **Base Slots**: 1 permanent equipment slot
- **Temporary Slots**: +5 additional slots during combat (6 total)
- **Dynamic Installation**:
  - **Outside Combat**: Use Deck UI to equip/unequip
  - **During Combat**: Play equipment cards for temporary installation
  - **Auto-cleanup**: Temporary equipment removed after combat

### Equipment Cards Behavior
- **Pre-Combat Equip**: Card removed from deck, equipment stays permanent
- **Combat Install**: Card consumed, equipment temporary until combat ends
- **Slot System**: Base(1) + Temp(5) = 6 equipment capacity during fights

## 🃏 Card System

### Card Types
- **Attack Cards**: Deal damage to enemies
- **Skill Cards**: Provide block, draw, energy, or utility
- **Equipment Cards**: Install equipment when played (NOTM-inspired)

### Deck Mechanics
- **Starting Deck**: 4 Strike, 4 Defend, 1 Focus, 2 Equipment cards
- **Master Deck**: Permanent collection that persists between combats
- **Combat Piles**: Draw/Hand/Discard/Exhaust system per combat
- **Smart Management**: Equipped cards automatically removed from circulation

## 🎯 Combat System

### Turn Structure
1. **Player Turn**: Draw to hand size, play cards, end turn
2. **Enemy Turn**: AI plays cards based on intent system
3. **Equipment Triggers**: Start/end turn effects activate
4. **Blessing Triggers**: Various event-based effects

### Resource Management
- **Energy**: Spend to play cards (default: 3 per turn)
- **Block**: Reduces incoming damage, resets each turn
- **HP**: Life total, permanent loss until healed

## 🗺️ Progression System

### Map Navigation (Pages Mode)
- **Page Structure**: Each page offers 3 encounter choices
- **Encounter Types**: 
  - **Monster/Elite/Boss**: Combat encounters
  - **Shop**: Buy cards, remove cards, upgrade cards
  - **Events**: Bonfire (heal), Shrine (blessing), Well, etc.

### Character Progression  
- **Level System**: Gain EXP from combat, level up for rewards
- **Blessing Collection**: Passive abilities from shrines and level rewards
- **Equipment Acquisition**: From starting deck and future shop purchases
- **Deck Building**: Add/remove/upgrade cards throughout the run

## 🏗️ Technical Architecture

### Core Structure
- **Pure Deterministic Core**: All game logic is deterministic and testable
- **Command Pattern**: All actions processed through command system
- **State Management**: Zustand store with immutable updates
- **Save System**: JSON-based save/load with version management

### Key Files
- `src/core/types.ts` - Game state and type definitions
- `src/core/engine/` - Game logic handlers (combat, map, equipment)
- `src/core/equipmentRuntime.ts` - Equipment behavior and hooks
- `src/core/blessingRuntime.ts` - Blessing behavior and triggers
- `src/data/packs/base/` - Game content (cards, equipment, enemies)

### Data Flow
1. **UI Interaction** → Command dispatched to store
2. **Command Processing** → Core engine applies changes
3. **State Update** → UI re-renders with new state
4. **Auto-save** → Important actions saved automatically

## 🎲 RNG & Determinism

- **Seeded RNG**: All randomness based on deterministic seed
- **Pure Functions**: Game logic completely reproducible
- **Save Compatibility**: Forward-compatible save system
- **Debug Tools**: QA commands for testing and development

## 🚀 Development Status

### ✅ Completed Systems
- Core card combat mechanics
- Equipment installation and management  
- Dynamic slot system with temporary expansion
- Pages-based map navigation
- Save/load system with auto-save
- Blessing system with event triggers
- Level progression and rewards

### 🔄 Current Focus
- Equipment card system refinement
- Combat balance and testing
- UI/UX polish and feedback

### 🎯 Future Plans
- Additional equipment types and effects
- More encounter types and events
- Advanced blessing combinations
- Equipment shop integration
- Enhanced AI and enemy variety

## 🛠️ Development Setup

The game uses React Native with Expo for cross-platform development. Core game logic is platform-agnostic TypeScript that can run in any JS environment.

For detailed changes, see [PATCH_NOTES.md](PATCH_NOTES.md).
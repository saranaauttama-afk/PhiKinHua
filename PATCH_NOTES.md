# Patch Notes

## 🆕 Latest: UI Refactoring & Critical Bug Fixes (Major Update)
**Date**: 2025-09-09
**Status**: Production Ready

### 🐛 **Critical Bug Fixes**
- **FIXED: Block Mechanics Bug**: Cards with block effects now properly stack instead of replacing
  - **Problem**: Playing ผ้าเย็น (5 block) + เสียงระฆัง (6 block) = 6 total block ❌
  - **Solution**: Playing ผ้าเย็น (5 block) + เสียงระฆัง (6 block) = 11 total block ✅
  - **Location**: `src/core/commands.ts:137` - Changed `state.player.block = card.block` to `state.player.block += card.block`

### 🏗️ **Major UI Refactoring**
- **Component Breakdown**: Split massive 944-line `index.tsx` into manageable components
  - `CombatView.tsx` (120 lines) - Combat interface, player/enemy stats, hand management
  - `ShopView.tsx` (150 lines) - Shop interface and equipment purchasing
  - `MapView.tsx` (180 lines) - Adventure map and navigation
  - `DeckView.tsx` (140 lines) - Deck viewing and equipment management
  - `EventView.tsx` (216 lines) - Events, level up, victory, starter blessing screens
- **Code Maintainability**: Reduced main file complexity by 68% (944 → 300 lines)

### 📱 **React Native Styling Migration**
- **Fixed Dark UI Issues**: Resolved black text on dark backgrounds across all components
- **Tailwind to Native Conversion**: Converted all CSS classes to React Native style objects
  - `text-white` → `color: '#FFFFFF'`
  - `bg-blue-600` → `backgroundColor: '#2563EB'`
  - `p-4` → `padding: 16`
- **Mobile Compatibility**: All components now render correctly on mobile devices

### 🔧 **TypeScript Error Resolution**
- **CombatView**: Fixed `enemyIntentCardId` property access with proper type casting
- **EventView**: Fixed level up and starter option property names
  - `lu.options` → `lu.blessingChoices` / `lu.cardChoices`
  - `starter.options` → `starter.choices`
- **Component Exports**: Converted all components to default exports for proper import handling

### 🎮 **Game Balance Enhancements**
- **Enhanced Map System**: Increased total pages from 12 to 16 for longer gameplay
- **Equipment System**: Added temporary equipment slots during combat (5 additional slots)
- **Encounter Variety**: Added support for healing shrines and equipment shops in map generation

### 🎨 **Content Integration**
- **Thai Mythology Complete**: All 14 enemies from Thai folklore fully integrated
- **Equipment System**: Thai-themed equipment with cultural significance
- **Card Balance**: 0-cost card design philosophy maintained across all Thai shaman cards

---

## 🆕 Previous: Thai Shaman (หมอผีไทย) Complete System (Major Update)

### 🎯 **Thai Shaman Card System - Full Implementation**
**Date**: 2025-09-08
**Status**: Ready for Testing

#### 🎴 **Starter Deck Changes**
- **ปาไผ่เผา** (Bamboo Dart): 4 ใบ - แทน Strike (5 damage + burn effect)
- **ผ้าเย็น** (Cooling Cloth): 4 ใบ - แทน Defend (5 block + cleanse debuffs)  
- **นั่งสมาธิ** (Meditation): 1 ใบ - แทน Focus (0 cost: draw 1, +1 energy)
- **Equipment Cards**: ผ้าเย็นถาวร + เครื่องรางหลวงปู่

#### 🏪 **Shop System Updates**
- เพิ่ม **Legendary** rarity (2% drop chance)
- ปรับราคา: Common 30-80, Uncommon 50-120, Rare 80-200, Legendary 150-300
- Thai cards มีราคาตาม complexity และ rarity

#### ⬆️ **Level Up Rewards (3-Card System)**
- เปลี่ยนจาก 2 ใบเป็น **3 ใบ**
- Level 1-3: Common only
- Level 4-6: 70% Common, 30% Uncommon  
- Level 7+: 50% Common, 40% Uncommon, 10% Rare, 0.5% Legendary

#### 🎯 **Thai Shaman Cards (40+ Cards)**

**0 Energy Cards (Free Play)**
- **ปาไผ่เผา**: 5 damage + burn 2/turn for 2 turns
- **ผงเจ้าพ่อ**: 4 block + curse enemy if they attack  
- **ผ้าเย็น**: 5 block + cleanse all debuffs
- **กระซิบผี**: 3 damage + draw 1
- **หลบผี**: 2 block + draw 1
- **ยาสมุนไพร**: heal 4 HP + cleanse 1 debuff

**1+ Energy Cards**
- **เสียงระฆัง**: 1 cost, 6 block + weaken enemy 1 turn
- **เสกเข็มปัก**: 1 cost, 7 damage (+4 if enemy has debuff)
- **นั่งสมาธิ**: 0 cost, draw 1 + gain 1 energy
- **เรียกผีเก่า**: 1 cost, summon Ghost Ally (3 HP, 4 attack, 3 turns)
- **ดูดวิญญาณ**: 1 cost, 5 damage + heal equal to damage (Uncommon)
- **เสกคาถาสาป**: 1 cost, 4 damage + Cursed 3 turns
- **พิธีบวงสรวง**: 1 cost, retrieve 3 cards from discard (Exhaust)

**Advanced Cards**
- **ทรงผี**: 2 cost, 0-cost cards unlimited this turn + draw 2 (Uncommon)
- **เปิดประตูนรก**: 3 cost, 20 damage + summon 2 Demon Minions (Rare)
- **ยาชาววัง**: 2 cost, heal 8 HP + permanent +2 Max HP (Exhaust, Uncommon)
- **สร้างกุมาร**: 2 cost, summon Kuman (8 HP, heal 2/turn) (Exhaust, Uncommon)
- **วงเกลือศักดิ์สิทธิ์**: 2 cost, 10 block + Sanctuary (-50% next damage) (Uncommon)

**Rare/Legendary Cards**  
- **ผีตายโหง**: 2 cost, 12 damage (x2 if HP < 50%) (Rare)
- **อาถรรพ์ดำ**: 3 cost, all enemies HP = 1 (Exhaust, once per fight) (Legendary)
- **เทพารักษ์**: 3 cost, full heal + immunity 3 turns (Exhaust) (Legendary)
- **วิญญาณบรรพบุรุษ**: 1 cost, copy last played card (free) (Legendary)

#### ⚙️ **Thai Shaman Equipment System**
- **ผ้าเย็นถาวร**: heal 2 HP per turn start (Common, Starter)
- **เครื่องรางหลวงปู่**: reduce all damage by 1 (Uncommon, Starter)
- **ลูกประคำ**: attack cards +1 damage (Uncommon)
- **กะโหลกนางตานี**: draw 1 when enemy dies (Rare)
- **ไม้เท้าหมอผี**: first card each turn costs -1 energy (Rare)

#### 🎮 **Playstyle Design**
หมอผีไทยเน้นการใช้การ์ดฟรี (0 energy) เป็นหลัก พร้อมด้วย:
- **Utility Focus**: การรักษา, การล้างสถานะ, การจั่วการ์ด
- **Minion Support**: เรียกผีและปีศาจมาช่วยสู้
- **Conditional Power**: การ์ดที่แรงขึ้นตามเงื่อนไข (debuffs, HP threshold)
- **Equipment Synergy**: อุปกรณ์ที่เสริมสร้าง playstyle

#### 🔧 **Technical Implementation**
- เพิ่ม Legendary rarity support ใน types, shop, pack, level systems
- เพิ่ม 5 Thai Equipment definitions และ runtime behaviors  
- ปรับ balance การ์ดใหม่ให้เหมาะกับ 0-energy playstyle
- แก้ไข JSON format errors และเพิ่ม Equipment เข้า registry
- ปรับ level-up เป็น 3-card system พร้อม level-based rarity scaling

#### 📝 **Balance Changes**
- **ผงเจ้าพ่อ**: ลด block 5→4 (การ์ดฟรีที่แรงเกินไป)
- **เสียงระฆัง**: เพิ่ม cost 0→1, เพิ่ม block 3→6 (ให้คุ้มค่า 1 energy)
- **เสกเข็มปัก**: ลด base damage 8→7, เพิ่ม conditional 3→4
- **ดูดวิญญาณ**: ลด damage 6→5, เปลี่ยนเป็น Uncommon (lifesteal แรงมาก)
- **ยาสมุนไพร**: ลด cost 1→0, ลด healing 6→4 (เป็นการ์ดฟรี utility)

---

## 🔥 Previous: Equipment Card System (Major Update)

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
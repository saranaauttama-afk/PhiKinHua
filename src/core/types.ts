// src/core/types.ts — CLEAN (Pages-first, no StartCombat, no reward)

export type BlessingFn = (tc: TurnCtx, card?: CardData, target?: any) => void;
export type BlessingCardHookConfig = { tag?: string; once_per_turn?: boolean; effects: BlessingFn[] };
export type BlessingDef = {
  id: string; name: string; rarity?: Rarity; desc?: string; oncePerTurn?: boolean;
  on_turn_start?: BlessingFn;
  on_turn_end?: BlessingFn;
  on_card_played?: BlessingFn | BlessingCardHookConfig;
};

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
export type CardType = 'attack' | 'skill' | 'equipment';

export type CardData = {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  dmg?: number;
  block?: number;
  draw?: number;
  energyGain?: number;
  tags?: string[];
  rarity?: Rarity;
  // Equipment card fields
  equipmentId?: string;  // ID of equipment to install
  slotCost?: number;     // Equipment slot cost
  desc?: string;         // Equipment description
};

// Enemy
export type EnemyCard = {
  id: string;
  name?: string;
  type: 'attack' | 'skill';
  dmg?: number;
  block?: number;
  energyCost?: number; // ถ้าไม่ใส่ จะ default = 1
  owner?: string | 'global';
  tags?: string[];
};

export type EnemyState = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  dmg: number;
  block: number;
  // ↓ เพิ่มใหม่ (E1)
  ai?: { cycle: string[]; index: number }; // อ้างถึง enemy card id
  intentCardId?: string;                    // ใบที่จะเล่น "เทิร์นนี้"
  maxEnergy?: number;  // ค่าพลังงานสูงสุดของศัตรู (ต่อเทิร์น)
  handSize?: number;   // จำนวนการ์ดที่จั่วตอนเริ่มเทิร์นศัตรู
  equipped?: EquipmentData[];  // ศัตรูก็มี equipment ได้เหมือนกัน
};

export type DeckPiles = {
  draw: CardData[];
  hand: CardData[];
  discard: CardData[];
  exhaust: CardData[];
};

export type EquipmentData = {
  id: string;
  name?: string;
  rarity?: Rarity;
  desc?: string;
  slotCost?: number; // default 1
  tags?: string[];
  temporary?: boolean; // For equipment installed temporarily during combat
  sourceCardId?: string; // ID of the equipment card that was consumed
  sourceCard?: CardData; // Full card data of the consumed card
};

export type Phase =
  | 'menu' | 'map' | 'combat' | 'victory' | 'defeat'
  | 'event' | 'shop' | 'levelup' | 'starter'; // ← ตัด 'reward' ออก

export type Bucket =
  | 'max_hp' | 'max_energy' | 'max_hand'
  | 'cards' | 'blessing' | 'remove' | 'upgrade' | 'gold';

export type PlayerState = {
  hp: number; maxHp: number; block: number; energy: number; gold: number;
  level: number; exp: number; expToNext: number;
  maxEnergy: number; maxHandSize: number;
};

export type RunCounters = {
  removed: number;
  removeShopCount?: number;
  upgradeShopCount?: number;
};

// ===== Events =====
export type EventState =
  | { type: 'bonfire'; healed?: boolean }
  | { type: 'shrine'; options: BlessingDef[]; chosenId?: string }
  | { type: 'remove'; capPerRun: number }
  | { type: 'gamble'; resolved?: { outcome: 'win' | 'lose'; gold?: number; hpLoss?: number } }
  | { type: 'treasure'; amount?: number }
  | { type: 'well'; used: boolean; dismissed: boolean };

// ===== Shop / Pages =====
export type ShopItem = { card: CardData; price: number };
export type ShopKind = 'card' | 'remove' | 'upgrade';

export type MapMode = 'pages';
export type MapStatePages = import('./map/pages').MapStatePages;

// Equipment
export type TurnSide = 'player' | 'enemy';

export type EquipmentHookEvent =
  | { type: 'battle_start' }
  | { type: 'turn_start'; side: TurnSide }
  | { type: 'turn_end'; side: TurnSide }
  | { type: 'card_played'; side: TurnSide; cardId: string; amount?: number }
  | { type: 'damage_dealt'; side: TurnSide; amount: number; target: 'player' | 'enemy' };

export interface EquipmentInstance {
  id: string; // unique per run
  modifierId: string; // refers to effect/behavior id (data-driven)
  oncePerTurn?: boolean; // simple gate; advanced rates can extend
}

export interface EquipmentRuntimeState {
  items: EquipmentInstance[];
  turnStamp: number; // increases every turn (player + enemy turns)
  onceGate: Record<string, number>; // equipment.id -> lastTurnStampUsed
}
export type GameState = {
  seed: string;
  phase: Phase;
  turn: number;

  player: PlayerState;
  enemy?: EnemyState;
  enemyPiles?: {
    draw: string[];
    hand: string[];
    discard: string[];
  };
  enemyEnergy?: number;

  piles: DeckPiles;
  masterDeck: CardData[];
  deckOpen?: boolean;

  blessings: BlessingDef[];
  log: string[];

  // Pages mode only
  mapMode?: MapMode;
  pages?: MapStatePages;

  // Shop / Events
  shopKind?: ShopKind;
  shopStock?: ShopItem[];
  event?: EventState;

  // flags & counters
  turnFlags: {
    blessingOnce: Record<string, boolean>;
    equipmentOnce?: Record<string, boolean>;
  };
  runCounters?: RunCounters;
  combatVictoryLock?: boolean;

  equipmentSlotsMax?: number;
  equipmentTempSlots?: number; // Additional slots available during combat
  equipped?: EquipmentData[];
  backpack?: EquipmentData[];
  // Level up
  levelUp?: {
    bucket: Bucket;
    cardChoices?: CardData[];
    blessingChoices?: BlessingDef[];
    consumed?: boolean;
  } | null;

  // Starter
  starter?: { choices: BlessingDef[]; consumed?: boolean } | null;

  runtime?: {
    equipment?: EquipmentRuntimeState;
  };
};

// ===== Commands =====
export type Command =
  // Run / Flow
  | { type: 'NewRun'; seed: string }
  | { type: 'ChooseStarterBlessing'; index: number }
  | { type: 'CompleteNode' }

  // Combat (no StartCombat)
  | { type: 'PlayCard'; index: number }
  | { type: 'EndTurn' }

  // Level Up
  | { type: 'ChooseLevelUp'; index?: number }
  | { type: 'SkipLevelUp' }

  // UI
  | { type: 'OpenDeck' }
  | { type: 'CloseDeck' }

  // Shop (card)
  | { type: 'TakeShop'; index: number }
  | { type: 'ShopReroll' }

  // Shop (remove/upgrade)
  | { type: 'ShopRemoveBuy'; index: number }
  | { type: 'ShopUpgradeBuy'; index: number }

  // Events
  | { type: 'DoBonfireHeal' }
  | { type: 'EventChooseBlessing'; index: number }
  | { type: 'EventRemoveCard'; pile: keyof DeckPiles; index: number }
  | { type: 'EventGambleRoll' }
  | { type: 'EventTreasureOpen' }
  | { type: 'DoWellUse' }
  | { type: 'DoWellDismiss' }
  | { type: 'DoHealingShrineUse' }
  | { type: 'DoHealingShrineDismiss' }
  | { type: 'TakeShopEquipment'; index: number }

  // Pages
  | { type: 'OpenPage' }
  | { type: 'ChooseOffer'; index: number }
  | { type: 'DismissOffer'; index: number }
  | { type: 'Proceed' }

  // Equipment Management
  | { type: 'EquipFromDeck'; cardId: string }
  | { type: 'UnequipToDeck'; equipmentId: string }

  // QA / Debug
  | { type: 'QA_KillEnemy' }
  | { type: 'QA_Draw'; count: number }
  | { type: 'QA_SetEnergy'; value: number }
  | { type: 'QA_AddBlessingDemo' }
  | { type: 'QA_AddEquipmentDemo' }
  | { type: 'QA_OpenShopHere' }
  | { type: 'QA_OpenShrine' }
  | { type: 'QA_OpenRemove' }
  | { type: 'QA_OpenGamble' }
  | { type: 'QA_OpenTreasure' }
  | { type: 'QA_InitPages' }
  | { type: 'QA_PrintPage' }
  | { type: 'QA_SpawnEquippedEnemy'; enemyId?: string };

export type TurnCtx = { state: GameState };

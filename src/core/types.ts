// src/core/types.ts — CLEAN (Pages-first, no StartCombat, no reward)

export type BlessingFn = (tc: TurnCtx, card?: CardData, target?: any) => void;
export type BlessingCardHookConfig = { tag?: string; once_per_turn?: boolean; effects: BlessingFn[] };
export type BlessingDef = {
  id: string; name: string; rarity?: Rarity; desc?: string; oncePerTurn?: boolean;
  on_turn_start?: BlessingFn;
  on_turn_end?: BlessingFn;
  on_card_played?: BlessingFn | BlessingCardHookConfig;
};

export type Rarity = 'Common' | 'Uncommon' | 'Rare';
export type CardType = 'attack' | 'skill';

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
  intentCardId?: string;                    // ใบที่จะเล่น “เทิร์นนี้”
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

export type GameState = {
  seed: string;
  phase: Phase;
  turn: number;

  player: PlayerState;
  enemy?: EnemyState;

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

  // Level up
  levelUp?: {
    bucket: Bucket;
    cardChoices?: CardData[];
    blessingChoices?: BlessingDef[];
    consumed?: boolean;
  } | null;

  // Starter
  starter?: { choices: BlessingDef[]; consumed?: boolean } | null;
};

// Enemy
export type EnemyCard = {
  id: string;
  name?: string;
  type: 'attack' | 'skill';
  dmg?: number;
  block?: number;
  // เผื่ออนาคต: energyCost/draw/debuff ฯลฯ
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

  // Pages
  | { type: 'OpenPage' }
  | { type: 'ChooseOffer'; index: number }
  | { type: 'DismissOffer'; index: number }
  | { type: 'Proceed' }

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
  | { type: 'QA_PrintPage' };

export type TurnCtx = { state: GameState };

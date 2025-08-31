import type { MapState } from './map';

// Blessings runtime types (ตามคอนแทรกต์)
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
  dmg?: number;    // for attacks
  block?: number;  // for skills
  draw?: number;   // draw N
  energyGain?: number; // gain N energy
  tags?: string[]; // สำหรับ match blessing hook (เช่น tag: 'attack')
  rarity?: Rarity; // ✅ ใช้สำหรับ bias rewards/shop
  heal?: number;
};

export type EnemyState = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  dmg: number;   // basic attack damage per turn
  block: number; // (reserved for later)
};

export type DeckPiles = {
  draw: CardData[];
  hand: CardData[];
  discard: CardData[];
  exhaust: CardData[];
};

export type Phase = 'menu' | 'map' | 'combat' | 'reward' | 'shop' | 'event' | 'victory' | 'defeat';

export type PlayerState = {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  gold: number;        // ✅ ทอง
};

// ===== Events =====
export type EventState =
  | { type: 'bonfire'; healed?: boolean }
  | { type: 'shrine'; options: BlessingDef[]; chosenId?: string }          // เลือกพร (no-dup)
  | { type: 'remove'; capPerRun: number }                                   // ลบการ์ด (จำกัดต่อ run)
  | { type: 'gamble'; resolved?: { outcome: 'win' | 'lose'; gold?: number; hpLoss?: number } }
  | { type: 'treasure'; amount?: number };                                  // กล่องสมบัติ (สุ่มช่วง)

export type ShopItem = { card: CardData; price: number }; // ✅ รายการขายในร้าน

export type GameState = {
  seed: string;
  phase: Phase;
  turn: number;
  player: PlayerState;
  enemy?: EnemyState;
  piles: DeckPiles;
  log: string[];
  rewardOptions?: CardData[]; // ตัวเลือกการ์ดตอนชนะคอมแบต
  map?: MapState;
  shopStock?: ShopItem[];     // ✅ สต็อกร้าน (มีราคา)
  event?: EventState;
  blessings: BlessingDef[];   // ✅ รายการพรที่ถืออยู่
  // ธงต่อเทิร์น (กัน once-per-turn และ re-entrancy win)
  turnFlags: {
    blessingOnce: Record<string, boolean>;
  };
  runCounters?: { removed: number };        // นับ remove ต่อ run
  combatVictoryLock?: boolean; // ✅ กัน re-entrancy “ชนะคอมแบต”  
};

export type Command =
  | { type: 'NewRun'; seed: string }
  | { type: 'StartCombat' }
  | { type: 'PlayCard'; index: number }
  | { type: 'EndTurn' }
  | { type: 'TakeReward'; index: number }
  | { type: 'CompleteNode' }
  | { type: 'EnterNode'; nodeId: string }
  | { type: 'TakeShop'; index: number }
  | { type: 'ShopReroll' }                 // ✅ รีโรลสต็อก (เสียทอง)  
  | { type: 'DoBonfireHeal' }
  | { type: 'EventChooseBlessing'; index: number }
  | { type: 'EventRemoveCard'; pile: keyof DeckPiles; index: number }
  | { type: 'EventGambleRoll' }
  | { type: 'EventTreasureOpen' }  
  // QA/Debug (ผ่าน commands เท่านั้น)
  | { type: 'QA_KillEnemy' }
  | { type: 'QA_Draw'; count: number }
  | { type: 'QA_SetEnergy'; value: number }
  | { type: 'QA_AddBlessingDemo' }
  | { type: 'QA_OpenShopHere' }
  | { type: 'QA_OpenShrine' }
  | { type: 'QA_OpenRemove' }
  | { type: 'QA_OpenGamble' }
  | { type: 'QA_OpenTreasure' };

  export type TurnCtx = { state: GameState };
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

// === Equipment ===
export type EquipmentData = {
  id: string;
  name?: string;
  rarity?: Rarity;
  desc?: string;
  slotCost?: number; // ดีฟอลต์ 1
  tags?: string[];
};

export type Phase = 'menu'|'map'|'combat'|'victory'|'defeat'|'reward'|'event'|'shop'|'levelup'|'starter';
export type Bucket = 'max_hp'|'max_energy'|'max_hand'|'cards'|'blessing'|'remove'|'upgrade'|'gold';

export type PlayerState = {     // ✅ ทอง
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
  | { type: 'shrine'; options: BlessingDef[]; chosenId?: string }          // เลือกพร (no-dup)
  | { type: 'remove'; capPerRun: number }                                   // ลบการ์ด (จำกัดต่อ run)
  | { type: 'gamble'; resolved?: { outcome: 'win' | 'lose'; gold?: number; hpLoss?: number } }
  | { type: 'treasure'; amount?: number }                                 // กล่องสมบัติ (สุ่มช่วง)
  | { type: 'well'; used: boolean; dismissed: boolean };

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
    equipmentOnce?: Record<string, boolean>;
  };
  // === Equipment slots & inventory (เบื้องต้น) ===
  equipmentSlotsMax?: number;     // จำนวนช่องสูงสุด
  equipped?: EquipmentData[];     // อุปกรณ์ที่สวมอยู่ (ใช้งานได้เมื่อรวม slotCost <= slots)
  backpack?: EquipmentData[];     // เก็บของที่ยังไม่สวม (ยังไม่ใช้ใน v1)  
  runCounters?: RunCounters;        // นับ remove ต่อ run
  combatVictoryLock?: boolean; // ✅ กัน re-entrancy “ชนะคอมแบต”  
  masterDeck: CardData[];
  deckOpen?: boolean;
  levelUp?: {
    // กล่องสุ่มหมวด (หนึ่งหมวดต่อการเลเวล)
    bucket: Bucket;
    // ตัวเลือกย่อย (สำหรับ cards/blessing)
    cardChoices?: CardData[];
    blessingChoices?: BlessingDef[];
    // สำหรับ remove/upgrade ต้องเลือกการ์ดจาก masterDeck → UI จะส่ง index กลับมาในคำสั่ง
    consumed?: boolean; // กดเลือกแล้ว แต่รอ CompleteNode ปิด modal
  } | null;  
  starter?: { choices: BlessingDef[]; consumed?: boolean } | null;
  mapMode?: 'grid' | 'pages';
  pages?: import('./map/pages').MapStatePages;  
  shopKind?: 'card' | 'remove' | 'upgrade';
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
  | { type: 'OpenDeck' }       // ✅ เปิดดูเด็ค
  | { type: 'CloseDeck' }     // ✅ ปิดดูเด็ค  
  | { type: 'ShopReroll' }                 // ✅ รีโรลสต็อก (เสียทอง)  
  | { type: 'DoBonfireHeal' }
  | { type: 'EventChooseBlessing'; index: number }
  | { type: 'EventRemoveCard'; pile: keyof DeckPiles; index: number }
  | { type: 'EventGambleRoll' }
  | { type: 'EventTreasureOpen' }  
  | { type: 'ChooseStarterBlessing'; index: number } // ✅ เลือกพรเริ่มเกม (ไม่มี skip/gold)
  | { type: 'OpenPage' }
  | { type: 'ChooseOffer'; index: number }
  | { type: 'DismissOffer'; index: number }
  | { type: 'Proceed' }  
  // เลเวลอัพ
  | { type: 'ChooseLevelUp'; index?: number } // index: สำหรับเลือกการ์ด/พร | สำหรับ remove/upgrade จะเป็น index ของ masterDeck
  | { type: 'SkipLevelUp' }
  | { type: 'ShopRemoveBuy'; index: number }   // index ใน masterDeck
  | { type: 'ShopUpgradeBuy'; index: number }  // index ใน masterDeck
  | { type: 'DoWellUse' }
  | { type: 'DoWellDismiss' }

  // QA/Debug (ผ่าน commands เท่านั้น)
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
  // QA สำหรับ pages
  | { type: 'QA_InitPages' }
  | { type: 'QA_PrintPage' };  

  export type TurnCtx = { state: GameState };
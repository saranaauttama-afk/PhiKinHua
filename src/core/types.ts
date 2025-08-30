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

export type Phase = 'menu' | 'combat' | 'reward' | 'victory' | 'defeat';

export type PlayerState = {
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
};

export type GameState = {
  seed: string;
  phase: Phase;
  turn: number;
  player: PlayerState;
  enemy?: EnemyState;
  piles: DeckPiles;
  log: string[];
  rewardOptions?: CardData[]; // ตัวเลือกการ์ดตอนชนะคอมแบต
};

export type Command =
  | { type: 'NewRun'; seed: string }
  | { type: 'StartCombat' }
  | { type: 'PlayCard'; index: number }
  | { type: 'EndTurn' }
  | { type: 'TakeReward'; index: number }
  | { type: 'CompleteNode' }; // ปิด modal/event แล้วไปต่อ (ตอนนี้กลับเมนูชั่วคราว)

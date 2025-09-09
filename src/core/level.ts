// Level/XP — weights & rolling for level-up rewards (buckets)
import type { RNG } from './rng';
import { int, shuffle } from './rng';
import type { GameState, CardData, BlessingDef } from './types';
import { BY_RARITY, BLESSINGS_BY_RARITY } from './pack';

export type LevelBucket =
  | 'max_hp' | 'max_energy' | 'max_hand'
  | 'cards' | 'blessing'
  | 'remove' | 'upgrade' | 'gold'
  | 'equipment_slot' | 'gold_skip';

const BASE_BUCKET_W: Record<LevelBucket, number> = {
  max_hp: 30, max_energy: 20, max_hand: 10, cards: 24, blessing: 12, 
  remove: 10, upgrade: 8, gold: 2, equipment_slot: 15, gold_skip: 8,
};

// ===== Choice System =====
export type LevelChoice = {
  optionA: LevelBucket;
  optionB: LevelBucket;
  contextDescription?: string;
};

// Strategic choice pairs that create meaningful decisions
const CHOICE_PAIRS: Array<[LevelBucket, LevelBucket]> = [
  // Power scaling choices
  ['max_energy', 'max_hand'],         // Energy for combos vs Hand size for options
  ['max_hp', 'equipment_slot'],       // Survivability vs Equipment power
  
  // Build direction choices  
  ['cards', 'blessing'],              // Direct cards vs Passive effects
  ['cards', 'gold_skip'],             // Cards now vs Gold for later
  
  // Deck refinement choices
  ['remove', 'upgrade'],              // Clean deck vs Improve cards
  ['remove', 'gold'],                 // Free removal vs Gold for shop
  
  // Value choices
  ['blessing', 'equipment_slot'],     // Passive power vs Equipment flexibility
  ['upgrade', 'gold_skip'],           // Improve cards vs Economic advantage
  
  // High-risk/reward
  ['max_energy', 'equipment_slot'],   // Raw power vs Equipment synergy
  ['max_hand', 'blessing'],           // Card advantage vs Passive power
];

function deriveWeights(s: GameState): Record<LevelBucket, number> {
  const w = { ...BASE_BUCKET_W };
  // Strategic hand size boosts at key levels for combo potential
  const lv = s.player?.level ?? 1;
  if (lv === 3) w.max_hand += 15; // Early game combo potential
  if (lv === 6) w.max_hand += 20; // Mid game strategy expansion  
  if (lv === 9) w.max_hand += 15; // Late game mastery
  return w;
}

// Legacy single bucket function (kept for compatibility)
export function rollLevelUpBucket(rng: RNG, s: GameState): { rng: RNG; bucket: LevelBucket } {
  const w = deriveWeights(s);
  const order: LevelBucket[] = ['max_hp','max_energy','max_hand','cards','blessing','remove','upgrade','gold'];
  const total = order.reduce((a,k)=>a + w[k], 0);
  const ro = int(rng, 0, Math.max(0, total - 1));
  let r = ro.rng;
  let roll = ro.value;
  let acc = 0;
  let bucket: LevelBucket = 'gold';
  for (const k of order) {
    acc += w[k];
    if (roll < acc) { bucket = k; break; }
  }
  return { rng: r, bucket };
}

// ===== New Choice-Based System =====
export function rollLevelUpChoice(rng: RNG, s: GameState): { rng: RNG; choice: LevelChoice } {
  // Filter choice pairs based on game state and level for more contextual choices
  const level = s.player?.level ?? 1;
  const viablePairs = getViableChoicePairs(s, level);
  
  // Select a weighted random choice pair
  const pairRoll = int(rng, 0, viablePairs.length - 1);
  let r = pairRoll.rng;
  const selectedPair = viablePairs[pairRoll.value];
  
  // Randomly assign which option goes to A vs B (prevent bias)
  const orderRoll = int(r, 0, 1);
  r = orderRoll.rng;
  const [first, second] = selectedPair;
  const [optionA, optionB] = orderRoll.value === 0 ? [first, second] : [second, first];
  
  // Create contextual description based on level and game state
  const contextDescription = generateChoiceContext(s, optionA, optionB);
  
  return {
    rng: r,
    choice: {
      optionA,
      optionB,
      contextDescription
    }
  };
}

function getViableChoicePairs(s: GameState, level: number): Array<[LevelBucket, LevelBucket]> {
  let pairs = [...CHOICE_PAIRS];
  
  // Early game (1-3): Focus on foundation building
  if (level <= 3) {
    // Prioritize basic power scaling and early game cards
    const earlyPairs = pairs.filter(pair => {
      const buckets = [...pair];
      return buckets.includes('max_hp') || buckets.includes('max_energy') || 
             buckets.includes('cards') || buckets.includes('max_hand');
    });
    // Include some early game gold for shop opportunities
    earlyPairs.push(['cards', 'gold_skip'], ['max_hp', 'gold']);
    return earlyPairs;
  }
  
  // Mid game (4-7): Strategic build direction
  if (level <= 7) {
    // Full variety with emphasis on build shaping
    return pairs;
  }
  
  // Late game (8+): Optimization and refinement
  // Focus on deck refinement and powerful upgrades
  const latePairs = pairs.filter(pair => {
    const buckets = [...pair];
    return buckets.includes('remove') || buckets.includes('upgrade') || 
           buckets.includes('blessing') || buckets.includes('equipment_slot');
  });
  // Add high-value late game choices
  latePairs.push(['blessing', 'gold_skip'], ['upgrade', 'equipment_slot']);
  return latePairs;
}

function generateChoiceContext(s: GameState, optionA: LevelBucket, optionB: LevelBucket): string {
  const level = s.player?.level ?? 1;
  const buckets = [optionA, optionB];
  
  // Context based on choice type and level
  if (buckets.includes('max_hp') && buckets.includes('equipment_slot')) {
    return level <= 3 ? "Early survival vs equipment power:" : "Durability vs versatility:";
  }
  
  if (buckets.includes('cards') && buckets.includes('blessing')) {
    return level <= 3 ? "Immediate cards vs passive power:" : "Direct strength vs ongoing effects:";
  }
  
  if (buckets.includes('remove') && buckets.includes('upgrade')) {
    return level <= 5 ? "Clean your deck or strengthen cards:" : "Perfect your deck strategy:";
  }
  
  if (buckets.includes('max_energy') && buckets.includes('max_hand')) {
    return level <= 4 ? "Power per turn vs options per turn:" : "Action economy optimization:";
  }
  
  if (buckets.includes('gold_skip')) {
    return level <= 3 ? "Power now vs resources later:" : "Immediate gain vs strategic flexibility:";
  }
  
  // Generic context based on level
  if (level <= 3) {
    return "Build your foundation:";
  } else if (level <= 7) {
    return "Shape your strategy:";
  } else {
    return "Optimize for victory:";
  }
}

export function rollThreeCards(rng: RNG, playerLevel = 1) {
  let r = rng;
  
  // ปรับน้ำหนักตาม level
  let commonWeight = 100;
  let uncommonWeight = 0;
  let rareWeight = 0;
  let legendaryWeight = 0;
  
  if (playerLevel >= 1 && playerLevel <= 3) {
    // Level 1-3: Common only
    commonWeight = 100;
  } else if (playerLevel >= 4 && playerLevel <= 6) {
    // Level 4-6: 70% Common, 30% Uncommon
    commonWeight = 70;
    uncommonWeight = 30;
  } else {
    // Level 7+: 50% Common, 40% Uncommon, 10% Rare, 0.5% Legendary
    commonWeight = 50;
    uncommonWeight = 40;
    rareWeight = 10;
    legendaryWeight = 0.5;
  }
  
  const cards: CardData[] = [];
  
  for (let i = 0; i < 3; i++) {
    const roll = Math.random() * 100;
    let selectedPool: CardData[] = BY_RARITY.Common;
    
    if (roll < legendaryWeight && BY_RARITY.Legendary.length > 0) {
      selectedPool = BY_RARITY.Legendary;
    } else if (roll < legendaryWeight + rareWeight && BY_RARITY.Rare.length > 0) {
      selectedPool = BY_RARITY.Rare;
    } else if (roll < legendaryWeight + rareWeight + uncommonWeight && BY_RARITY.Uncommon.length > 0) {
      selectedPool = BY_RARITY.Uncommon;
    }
    
    if (selectedPool.length > 0) {
      const cardRoll = int(r, 0, selectedPool.length - 1);
      r = cardRoll.rng;
      cards.push({ ...selectedPool[cardRoll.value] });
    }
  }
  
  return { rng: r, list: cards };
}

export function rollTwoBlessings(rng: RNG) {
  let r = rng;
  const pool: BlessingDef[] = [...BLESSINGS_BY_RARITY.Common, ...BLESSINGS_BY_RARITY.Uncommon, ...BLESSINGS_BY_RARITY.Rare, ...BLESSINGS_BY_RARITY.Legendary];
  const sh = shuffle(r, pool); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)).map(b => ({ ...b })) };
}

// ===== Choice Description System =====
export function getBucketDisplayInfo(bucket: LevelBucket): { name: string; description: string; icon: string } {
  switch (bucket) {
    case 'max_hp':
      return { name: '+8 Max HP', description: 'Survive longer encounters', icon: '❤️' };
    case 'max_energy':
      return { name: '+1 Max Energy', description: 'Play more cards each turn', icon: '⚡' };
    case 'max_hand':
      return { name: '+1 Hand Size', description: 'More options and combos', icon: '🎴' };
    case 'cards':
      return { name: 'Choose Cards', description: 'Add new abilities to deck', icon: '🃏' };
    case 'blessing':
      return { name: 'Choose Blessing', description: 'Permanent passive power', icon: '✨' };
    case 'remove':
      return { name: 'Remove Card', description: 'Purify your deck (Free)', icon: '🗑️' };
    case 'upgrade':
      return { name: 'Upgrade Card', description: 'Enhance existing card (Free)', icon: '⬆️' };
    case 'equipment_slot':
      return { name: '+1 Equipment Slot', description: 'More equipment flexibility', icon: '⚔️' };
    case 'gold_skip':
      return { name: '+50 Gold', description: 'Immediate buying power', icon: '💰' };
    case 'gold':
      return { name: '+25 Gold', description: 'Shop currency', icon: '🪙' };
    default:
      return { name: 'Unknown', description: 'Unknown reward', icon: '❓' };
  }
}

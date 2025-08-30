import type { CardData } from './types';
import { shuffle, type RNG } from './rng';
import { CARD_STRIKE, CARD_DEFEND, CARD_FOCUS, CARD_BASH, CARD_GUARD } from './balance';

const POOL: CardData[] = [CARD_STRIKE, CARD_DEFEND, CARD_FOCUS, CARD_BASH, CARD_GUARD];

export function rollRewardOptions(rng: RNG, count = 3): { rng: RNG; options: CardData[] } {
  const out = shuffle(rng, POOL);
  // เลือก 3 ใบแรกจากการสับ
  return { rng: out.rng, options: out.array.slice(0, count) };
}
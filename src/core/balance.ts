import type { CardData, EnemyState } from './types';

export const START_HP = 50;
export const START_ENERGY = 3;
export const HAND_SIZE = 5;

// === Base cards (deck of 5) ===
export const CARD_STRIKE: CardData = {
  id: 'strike', name: 'Strike', type: 'attack', cost: 1, dmg: 6,
};
export const CARD_DEFEND: CardData = {
  id: 'defend', name: 'Defend', type: 'skill', cost: 1, block: 5,
};
export const CARD_FOCUS: CardData = {
  id: 'focus', name: 'Focus', type: 'skill', cost: 0, draw: 1, energyGain: 1,
};
export const CARD_BASH: CardData = {
  id: 'bash', name: 'Bash', type: 'attack', cost: 2, dmg: 10,
};
export const CARD_GUARD: CardData = {
  id: 'guard', name: 'Guard', type: 'skill', cost: 1, block: 8,
};

export const START_DECK: CardData[] = [
  CARD_STRIKE, CARD_STRIKE, CARD_STRIKE, CARD_DEFEND, CARD_FOCUS,
];

// === Example enemy ===
export const ENEMY_SLIME: EnemyState = {
  id: 'slime', name: 'Slime',
  hp: 35, maxHp: 35,
  dmg: 6,
  block: 0,
};

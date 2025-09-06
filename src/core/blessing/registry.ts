// src/core/blessing/registry.ts
import type { CardData, GameState } from '../types';

type When = {
  hasTag?: string;
  type?: CardData['type'];
};

type OnPlaySpec = {
  when?: When;
  oncePerTurnKey?: string;
  effect: (s: GameState, card: CardData) => void; // ไม่มี RNG
};

export type BlessingBehavior = {
  on_turn_start?: (s: GameState) => void;
  on_turn_end?: (s: GameState) => void;
  on_card_played?: OnPlaySpec[];
};

const behaviors: Record<string, BlessingBehavior> = {
  regen_1: {
    on_turn_end: (s) => {
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1);
      s.log.push('Blessing: regen +1');
    },
  },
  bl_energy_first: {
    on_card_played: [
      {
        oncePerTurnKey: 'first',
        effect: (s) => {
          s.player.energy += 1;
          s.log.push('Blessing: +1 energy (first play)');
        },
      },
    ],
  },
  block_on_attack_2: {
    on_card_played: [
      {
        when: { type: 'attack' },
        effect: (s) => {
          s.player.block += 2;
          s.log.push('Blessing: +2 Block on attack');
        },
      },
    ],
  },
  start_block_3: {
    on_turn_start: (s) => {
      s.player.block += 3;
      s.log.push('Blessing: +3 Block at start');
    },
  },
  energy_on_skill_first: {
    on_card_played: [
      {
        when: { type: 'skill' },
        oncePerTurnKey: 'skill_first',
        effect: (s) => {
          s.player.energy += 1;
          s.log.push('Blessing: +1 energy on first skill');
        },
      },
    ],
  },
};

export function getBlessingBehavior(id: string): BlessingBehavior | undefined {
  return behaviors[id];
}

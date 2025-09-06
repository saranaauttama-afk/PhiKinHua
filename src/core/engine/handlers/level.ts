// src/core/engine/handlers/level.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { upgradeCard } from '../shared';

export function chooseLevelUp(s: GameState, cmd: Extract<Command, { type: 'ChooseLevelUp' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
  const b = s.levelUp.bucket;
  const idx = cmd.index ?? 0;
  switch (b) {
    case 'max_hp':
      s.player.maxHp += 5; s.player.hp = Math.min(s.player.hp + 5, s.player.maxHp);
      break;
    case 'max_energy':
      s.player.maxEnergy += 1;
      break;
    case 'max_hand':
      s.player.maxHandSize += 1;
      break;
    case 'cards': {
      const c = s.levelUp.cardChoices?.[idx]; if (!c) break;
      s.masterDeck.push(JSON.parse(JSON.stringify(c)));
      break;
    }
    case 'blessing': {
      const bsel = s.levelUp.blessingChoices?.[idx]; if (!bsel) break;
      s.blessings.push(bsel);
      break;
    }
    case 'remove': {
      const i = idx;
      if (i >= 0 && i < s.masterDeck.length) {
        s.masterDeck.splice(i, 1);
        s.runCounters = s.runCounters || { removed: 0 } as any;
        (s.runCounters as any).removed += 1;
      }
      break;
    }
    case 'upgrade': {
      const i = idx;
      if (i >= 0 && i < s.masterDeck.length) {
        s.masterDeck[i] = upgradeCard(s.masterDeck[i]);
      }
      break;
    }
    case 'gold':
    default:
      s.player.gold += 25;
      break;
  }
  s.levelUp.consumed = true;
  return { state: s, rng: r };
}

export function skipLevelUp(s: GameState, _cmd: Extract<Command, { type: 'SkipLevelUp' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
  s.player.gold += 25;
  s.levelUp.consumed = true;
  return { state: s, rng: r };
}

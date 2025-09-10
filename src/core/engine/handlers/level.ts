// src/core/engine/handlers/level.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { upgradeCard } from '../shared';

export function chooseLevelUp(s: GameState, cmd: Extract<Command, { type: 'ChooseLevelUp' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
  
  // Legacy support for old bucket system
  const b = s.levelUp.bucket;
  if (b) {
    const idx = cmd.index ?? 0;
    applyBucketChoice(s, b, idx);
    s.levelUp.consumed = true;
    s.phase = 'victory';
    return { state: s, rng: r };
  }
  
  return { state: s, rng: r };
}

export function chooseLevelUpOption(s: GameState, cmd: Extract<Command, { type: 'ChooseLevelUpOption' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed || !s.levelUp.choice) return { state: s, rng: r };
  
  const choice = s.levelUp.choice;
  const selectedBucket = cmd.option === 'A' ? choice.optionA : choice.optionB;
  const idx = cmd.index ?? 0;
  
  // Store the selected option for UI display
  choice.selectedOption = cmd.option;
  
  applyBucketChoice(s, selectedBucket, idx);
  s.levelUp.consumed = true;
  
  // After level up choice, go to victory phase
  s.phase = 'victory';
  return { state: s, rng: r };
}

function applyBucketChoice(s: GameState, bucket: string, idx: number) {
  switch (bucket) {
    case 'max_hp':
      s.player.maxHp += 8; s.player.hp = Math.min(s.player.hp + 8, s.player.maxHp);
      break;
    case 'max_energy':
      s.player.maxEnergy += 1;
      s.log.push(`Max energy size increased to ${s.player.maxEnergy}`);
      break;
    case 'max_hand':
      s.player.maxHandSize += 1;
      s.log.push(`Hand size: ${s.player.maxHandSize}`);
      break;
    case 'cards': {
      const c = s.levelUp?.cardChoices?.[idx]; if (!c) break;
      s.masterDeck.push(JSON.parse(JSON.stringify(c)));
      break;
    }
    case 'blessing': {
      const bsel = s.levelUp?.blessingChoices?.[idx]; if (!bsel) break;
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
    case 'equipment_slot':
      s.equipmentSlotsMax = (s.equipmentSlotsMax ?? 2) + 1;
      break;
    case 'gold_skip':
      s.player.gold += 50;
      break;
    case 'gold':
    default:
      s.player.gold += 25;
      break;
  }
}

export function cancelLevelUpChoice(s: GameState, _cmd: Extract<Command, { type: 'CancelLevelUpChoice' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed || !s.levelUp.choice) return { state: s, rng: r };
  
  // Reset the selected option to show main choices again
  if (s.levelUp.choice) {
    s.levelUp.choice.selectedOption = undefined;
  }
  
  s.log.push('Back to level up choices');
  return { state: s, rng: r };
}

export function skipLevelUp(s: GameState, _cmd: Extract<Command, { type: 'SkipLevelUp' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
  s.player.gold += 25;
  s.levelUp.consumed = true;
  
  // After skipping level up, go to victory phase
  s.phase = 'victory';
  return { state: s, rng: r };
}

// src/core/engine/shared.ts
import type { GameState, CardData } from '../types';
import type { RNG } from '../rng';
import { nextExpForLevel, EXP_KILL_NORMAL, EXP_KILL_ELITE, EXP_KILL_BOSS } from '../balance/progression';
import { rollLevelUpBucket, rollTwoBlessings, rollTwoCards, type LevelBucket } from '../level';
import { findNode } from '../map';

export function getCurrentNodeId(map?: any): string | undefined {
  if (!map) return undefined;
  return map.currentNodeId ?? map.currentId;
}

// keep functions pure / preserve function refs (blessings & shrine options)
export function cloneForReducer(prev: GameState): GameState {
  const s: GameState = JSON.parse(JSON.stringify(prev));
  s.blessings = (prev.blessings ?? []).slice();
  if (prev.event?.type === 'shrine' && s.event?.type === 'shrine') {
    s.event.options = prev.event.options;
  }
  return s;
}

export function upgradeCard(c: CardData): CardData {
  const up = { ...c, name: (c.name ?? c.id) + ' +' };
  if (typeof up.dmg === 'number') up.dmg += 3;
  if (typeof up.block === 'number') up.block += 3;
  return up;
}

export function grantExpAndQueueLevelUp(s: GameState, r: RNG): RNG {
  let gained = EXP_KILL_NORMAL;
  if (s.map?.currentNodeId) {
    const n = findNode(s.map, s.map.currentNodeId);
    if (n?.kind === 'elite') gained = EXP_KILL_ELITE;
    if (n?.kind === 'boss') gained = EXP_KILL_BOSS;
  }
  s.player.exp += gained;

  while (s.player.exp >= s.player.expToNext) {
    s.player.exp -= s.player.expToNext;
    s.player.level += 1;
    s.player.expToNext = nextExpForLevel(s.player.level);

    if (!s.levelUp) {
      const rolled = rollLevelUpBucket(r, s); r = rolled.rng;
      const bucket = rolled.bucket as LevelBucket;
      let cardChoices, blessingChoices;
      if (bucket === 'cards') { const rr = rollTwoCards(r); r = rr.rng; cardChoices = rr.list; }
      if (bucket === 'blessing') { const bb = rollTwoBlessings(r); r = bb.rng; blessingChoices = bb.list; }
      s.levelUp = { bucket, cardChoices, blessingChoices, consumed: false };
    } else {
      s.log.push('LevelUp queued (multiple levels).');
    }
  }
  return r;
}

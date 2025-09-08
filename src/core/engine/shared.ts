// src/core/engine/shared.ts
import type { GameState, CardData } from '../types';
import type { RNG } from '../rng';
import { nextExpForLevel, EXP_KILL_NORMAL, EXP_KILL_ELITE, EXP_KILL_BOSS } from '../balance/progression';
import { rollLevelUpBucket, rollTwoBlessings, rollThreeCards, type LevelBucket } from '../level';
import { findNode } from '../map';
import { goldRewardForVictory } from '../balance/economy';

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
  let tier: 'normal' | 'elite' | 'boss' = 'normal';
  
  // Determine enemy tier for rewards
  if (s.map?.currentNodeId) {
    // Old map mode
    const n = findNode(s.map, s.map.currentNodeId);
    if (n?.kind === 'elite') { gained = EXP_KILL_ELITE; tier = 'elite'; }
    if (n?.kind === 'boss') { gained = EXP_KILL_BOSS; tier = 'boss'; }
  } else if (s.pages?.current && s.pages._activeOfferIndex != null) {
    // Pages mode - get tier from active offer
    const offer = s.pages.current.offers[s.pages._activeOfferIndex];
    if (offer?.kind === 'monster') {
      if (offer.tier === 'elite') { gained = EXP_KILL_ELITE; tier = 'elite'; }
    } else if (offer?.kind === 'boss') {
      gained = EXP_KILL_BOSS; tier = 'boss';
    }
  }
  
  // Grant EXP
  s.player.exp += gained;
  
  // Grant Gold
  const goldResult = goldRewardForVictory(tier, s.player.level, r);
  if (goldResult.rng) r = goldResult.rng;
  s.player.gold = (s.player.gold || 0) + goldResult.amount;
  s.log.push(`Victory! +${gained} EXP, +${goldResult.amount} gold`);

  while (s.player.exp >= s.player.expToNext) {
    s.player.exp -= s.player.expToNext;
    s.player.level += 1;
    s.player.expToNext = nextExpForLevel(s.player.level);

    if (!s.levelUp) {
      const rolled = rollLevelUpBucket(r, s); r = rolled.rng;
      const bucket = rolled.bucket as LevelBucket;
      let cardChoices, blessingChoices;
      if (bucket === 'cards') { const rr = rollThreeCards(r, s.player.level); r = rr.rng; cardChoices = rr.list; }
      if (bucket === 'blessing') { const bb = rollTwoBlessings(r); r = bb.rng; blessingChoices = bb.list; }
      s.levelUp = { bucket, cardChoices, blessingChoices, consumed: false };
    } else {
      s.log.push('LevelUp queued (multiple levels).');
    }
  }
  return r;
}

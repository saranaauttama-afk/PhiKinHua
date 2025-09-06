// src/core/engine/handlers/combat.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo, applyCardEffect, endEnemyTurn, isVictory, isDefeat, startPlayerTurn } from '../../commands';
import { resetBlessingTurnFlags, runBlessingsTurnHook, getCardPlayedFns } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';
import { grantExpAndQueueLevelUp } from '../shared';

export function start(s: GameState, _cmd: Extract<Command, { type: 'StartCombat' }>, r: RNG) {
  if ((s.piles?.hand?.length ?? 0) > 0 || (s.piles?.draw?.length ?? 0) > 0 || (s.turn ?? 0) > 0) {
    return { state: s, rng: r };
  }
  s.phase = 'combat';
  s.turn = 1;
  {
    const res = pickEnemy(r, 'normal'); r = res.rng;
    s.enemy = res.enemy;
  }
  resetBlessingTurnFlags(s);
  runBlessingsTurnHook(s, 'on_turn_start');
  s.player.energy = s.player.maxEnergy ?? START_ENERGY;
  ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
  ({ state: s, rng: r } = drawUpTo(s, r));
  s.log.push(`Combat started vs ${s.enemy?.name ?? 'Enemy'}`);
  return { state: s, rng: r };
}

export function play(s: GameState, cmd: Extract<Command, { type: 'PlayCard' }>, r: RNG) {
  if (s.phase !== 'combat' || s.combatVictoryLock) return { state: s, rng: r };
  const idx = cmd.index;
  if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
  const played = s.piles.hand[idx];

  // energy paywall (basic=0, special>=1)
  const base = typeof (played as any).cost === 'number' ? (played as any).cost : 0;
  const cost = Math.max(0, Math.floor(base));
  if (cost > 0) {
    const cur = s.player.energy ?? 0;
    if (cur < cost) {
      s.log.push(`Not enough energy (need ${cost}).`);
      return { state: s, rng: r };
    }
    s.player.energy = cur - cost;
  }

  // effect
  applyCardEffect(s, idx);

  // blessings on_card_played
  try {
    for (const b of (s.blessings ?? [])) {
      const fns = getCardPlayedFns(b, played);
      const tc = { state: s };
      for (const f of fns) f(tc as any, played);
    }
  } catch (e: any) {
    s.log.push(`Blessing error: ${e?.message ?? String(e)}`);
  }

  // move to discard
  const [c] = s.piles.hand.splice(idx, 1);
  s.piles.discard.push(c);
  s.log.push(`Played ${played.name}`);

  // on-play draw
  if ((played as any).draw && (played as any).draw > 0) {
    const target = s.piles.hand.length + (played as any).draw;
    ({ state: s, rng: r } = drawUpTo(s, r, target));
  }

  if (isVictory(s)) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    s.phase = 'victory';
    s.log.push('Victory!');
  }
  return { state: s, rng: r };
}

export function endTurn(s: GameState, _cmd: Extract<Command, { type: 'EndTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  endEnemyTurn(s);
  if (isDefeat(s)) {
    s.phase = 'defeat';
    s.log.push('Defeat...');
    return { state: s, rng: r };
  }
  runBlessingsTurnHook(s, 'on_turn_end');
  s.turn = 1;
  ({ state: s, rng: r } = startPlayerTurn(s, r));
  resetBlessingTurnFlags(s);
  runBlessingsTurnHook(s, 'on_turn_start');
  return { state: s, rng: r };
}

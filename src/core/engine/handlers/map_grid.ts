// src/core/engine/handlers/map_grid.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { availableNodes, findNode, generateMap, completeAndAdvance } from '../../map';
import { rollShopStock } from '../../shop';
import { rollShrine, openRemoveEvent, rollGamble, rollTreasure,pickEventKind } from '../../events';
import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo } from '../../commands';
import { resetBlessingTurnFlags, runBlessingsTurnHook } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';
import { getCurrentNodeId } from '../shared';

export function enterNode(s: GameState, cmd: Extract<Command, { type: 'EnterNode' }>, r: RNG) {
  if (s.phase !== 'map' || !s.map) return { state: s, rng: r };
  const avail = availableNodes(s.map);
  const nodeId = (cmd as any).id ?? (cmd as any).nodeId;
  const ok = avail.find(n => n.id === nodeId);
  if (!ok) return { state: s, rng: r };
  s.map.currentNodeId = nodeId;

  if (ok.kind === 'shop') {
    const { SHOP_STOCK_SIZE, SHOP_POWER_BIAS } = require('../../balance/weights');
    const stock = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS); r = stock.rng;
    s.shopStock = stock.items;
    s.phase = 'shop';
    s.log.push(`Enter node ${nodeId} -> Shop`);
  } else if (ok.kind === 'bonfire') {
    s.event = { type: 'bonfire', healed: false } as any;
    s.phase = 'event';
    s.log.push(`Enter node ${nodeId} -> Bonfire`);
  } else if (ok.kind === 'event') {
    const pk = pickEventKind(r); r = pk.rng;
    if (pk.kind === 'shrine') {
      const sh = rollShrine(r, s, 3); r = sh.rng;
      s.event = sh.event;
      s.phase = 'event';
      s.log.push(`Enter node ${nodeId} -> Shrine`);
    } else if (pk.kind === 'remove') {
      s.event = openRemoveEvent();
      s.phase = 'event';
      s.log.push(`Enter node ${nodeId} -> Remove`);
    } else if (pk.kind === 'gamble') {
      s.event = { type: 'gamble' } as any;
      s.phase = 'event';
      s.log.push(`Enter node ${nodeId} -> Gamble`);
    } else {
      s.event = { type: 'treasure' } as any;
      s.phase = 'event';
      s.log.push(`Enter node ${nodeId} -> Treasure`);
    }
  } else {
    // combat: monster/elite/boss
    s.phase = 'combat';
    s.turn = 1;
    {
      let tier: 'normal' | 'elite' | 'boss' = 'normal';
      if (ok.kind === 'elite') tier = 'elite';
      if (ok.kind === 'boss') tier = 'boss';
      const res = pickEnemy(r, tier); r = res.rng;
      s.enemy = res.enemy;
    }
    s.player.energy = START_ENERGY;
    ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
    ({ state: s, rng: r } = drawUpTo(s, r));
    resetBlessingTurnFlags(s);
    runBlessingsTurnHook(s, 'on_turn_start');
    s.log.push(`Enter node ${nodeId} -> Combat vs ${s.enemy?.name ?? 'Enemy'}`);
  }
  return { state: s, rng: r };
}

export function completeNode(s: GameState, _cmd: Extract<Command, { type: 'CompleteNode' }>, r: RNG) {
  if (s.phase === 'victory') {
    if (s.levelUp && !s.levelUp.consumed) {
      s.phase = 'levelup';
      return { state: s, rng: r };
    }
    const curId = getCurrentNodeId(s.map);
    if (s.map && curId) s.map = completeAndAdvance(s.map, curId);
    s.phase = 'map';
    s.enemy = undefined;
    s.player.block = 0;
    s.player.energy = s.player.maxEnergy ?? START_ENERGY;
    return { state: s, rng: r };
  }

  if (s.phase === 'levelup') {
    s.levelUp = null;
    const curId = getCurrentNodeId(s.map);
    if (s.map && curId) s.map = completeAndAdvance(s.map, curId);
    s.phase = 'map';
    s.enemy = undefined;
    s.player.block = 0;
    s.player.energy = s.player.maxEnergy ?? START_ENERGY;
    return { state: s, rng: r };
  }

  if ((s.phase === 'event' || s.phase === 'shop') && s.map) {
    const curId = getCurrentNodeId(s.map);
    if (curId) s.map = completeAndAdvance(s.map, curId);
    s.phase = 'map';
    s.enemy = undefined;
    s.player.block = 0;
    s.player.energy = START_ENERGY;
    return { state: s, rng: r };
  }
  return { state: s, rng: r };
}

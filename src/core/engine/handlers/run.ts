// src/core/engine/handlers/run.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { baseNewState } from '../../commands';
import { generateMap } from '../../map';
import { rollTwoBlessings } from '../../level';
import { START_ENERGY } from '../../balance/core';
import { ENABLE_PAGES } from '../../balance/weights';
import { initPageMap } from '../../map/pages';

export function newRun(s: GameState, cmd: Extract<Command, { type: 'NewRun' }>, r: RNG) {
  s = baseNewState(cmd.seed);
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
 s.runCounters = { removed: 0, removeShopCount: 0, upgradeShopCount: 0 };

  const { START_DECK } = require('../../balance/core');
  s.masterDeck = JSON.parse(JSON.stringify(START_DECK));

  if (ENABLE_PAGES) {
    s.mapMode = 'pages';
    const m = initPageMap(r); r = m.rng; s.pages = m.map;
  } else {
    s.mapMode = 'grid';
    const g = generateMap(r); r = g.rng; s.map = g.map;
  }

  s.levelUp = null;
  const bb = rollTwoBlessings(r); r = bb.rng;
  s.starter = { choices: bb.list, consumed: false };
  s.phase = 'starter';
  return { state: s, rng: r };
}

export function chooseStarter(s: GameState, cmd: Extract<Command, { type: 'ChooseStarterBlessing' }>, r: RNG) {
  if (s.phase !== 'starter' || !s.starter || s.starter.consumed) return { state: s, rng: r };
  const b = s.starter.choices[cmd.index];
  if (b) {
    s.blessings.push(b);
    s.log.push(`Starter blessing: ${b.name ?? b.id}`);
  }
  s.starter = null;
  s.phase = 'map';
  s.enemy = undefined;
  s.player.block = 0;
  s.player.energy = s.player.maxEnergy ?? START_ENERGY;
  return { state: s, rng: r };
}

// src/core/engine/handlers/qa.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { drawUpTo } from '../../commands';
import { grantExpAndQueueLevelUp } from '../shared';

export function qaKillEnemy(s: GameState, _cmd: Extract<Command, { type: 'QA_KillEnemy' }>, r: RNG) {
  if (s.phase !== 'combat' || !s.enemy) return { state: s, rng: r };
  s.enemy.hp = 0;
  s.log.push('QA: kill enemy');
  if (s.enemy.hp <= 0) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    s.phase = 'victory';
    s.log.push('Victory!');
  }
  return { state: s, rng: r };
}

export function qaDraw(s: GameState, cmd: Extract<Command, { type: 'QA_Draw' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  for (let i = 0; i < (cmd.count ?? 1); i++) {
    ({ state: s, rng: r } = drawUpTo(s, r, s.piles.hand.length + 1));
  }
  s.log.push(`QA: draw ${cmd.count}`);
  return { state: s, rng: r };
}

export function qaSetEnergy(s: GameState, cmd: Extract<Command, { type: 'QA_SetEnergy' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  s.player.energy = cmd.value;
  s.log.push(`QA: set energy ${cmd.value}`);
  return { state: s, rng: r };
}

export function qaAddBlessingDemo(s: GameState, _cmd: Extract<Command, { type: 'QA_AddBlessingDemo' }>, r: RNG) {
  const demo = {
    id: 'bl_energy_first',
    name: 'Battle Rhythm',
    desc: 'First card each turn grants +1 energy.',
    oncePerTurn: true,
    on_card_played: (tc: any) => { tc.state.player.energy += 1; },
  };
  if (!s.blessings.find(b => b.id === demo.id)) s.blessings.push(demo as any);
  s.log.push('QA: added blessing "Battle Rhythm"');
  return { state: s, rng: r };
}

export function qaOpenShop(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenShopHere' }>, r: RNG) {
  const { rollShopStock } = require('../../shop');
  const { SHOP_STOCK_SIZE, SHOP_POWER_BIAS } = require('../../balance/weights');
  const stock = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS); r = stock.rng;
  s.shopStock = stock.items;
  s.phase = 'shop';
  s.shopKind = 'card';
  s.log.push('QA: opened Shop here');
  return { state: s, rng: r };
}

export function qaOpenShrine(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenShrine' }>, r: RNG) {
  const { rollShrine } = require('../../events');
  const sh = rollShrine(r, s, 3); r = sh.rng;
  s.event = sh.event;
  s.phase = 'event';
  s.log.push('QA: opened Shrine');
  return { state: s, rng: r };
}

export function qaOpenRemove(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenRemove' }>, r: RNG) {
  const { openRemoveEvent } = require('../../events');
  s.event = openRemoveEvent();
  s.phase = 'event';
  s.log.push('QA: opened Remove');
  return { state: s, rng: r };
}

export function qaOpenGamble(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenGamble' }>, r: RNG) {
  s.event = { type: 'gamble' } as any;
  s.phase = 'event';
  s.log.push('QA: opened Gamble');
  return { state: s, rng: r };
}

export function qaOpenTreasure(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenTreasure' }>, r: RNG) {
  s.event = { type: 'treasure' } as any;
  s.phase = 'event';
  s.log.push('QA: opened Treasure');
  return { state: s, rng: r };
}

// tail of src/core/engine/handlers/qa.ts (เพิ่มสองฟังก์ชัน)
export function qaInitPages(s: GameState, _cmd: Extract<Command, { type: 'QA_InitPages' }>, r: RNG) {
  const { initPageMap } = require('../../map/pages');
  s.mapMode = 'pages';
  const init = initPageMap(r); r = init.rng; s.pages = init.map;
  s.phase = 'map';
  const mapPages = require('./map_pages');
  return mapPages.open(s, { type: 'OpenPage' } as any, r);
}

export function qaPrintPage(s: GameState, _cmd: Extract<Command, { type: 'QA_PrintPage' }>, r: RNG) {
  if (!s.pages?.current) { s.log.push('No page open.'); return { state: s, rng: r }; }
  const list = s.pages.current.offers.map((o: any) => o.kind === 'monster' ? `monster:${o.tier}` : o.kind);
  s.log.push(`Offers: ${list.join(' | ')}`);
  return { state: s, rng: r };
}

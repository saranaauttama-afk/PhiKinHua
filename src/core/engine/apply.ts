// src/core/engine/apply.ts
import type { Command, GameState } from '../types';
import type { RNG } from '../rng';
import { cloneForReducer } from './shared';

import * as run from './handlers/run';
import * as combat from './handlers/combat';
import * as mapgrid from './handlers/map_grid';
import * as mappages from './handlers/map_pages';
import * as lvl from './handlers/level';
import * as se from './handlers/shops_events';
import * as qa from './handlers/qa';

const isPages = (s: GameState) => s.mapMode === 'pages';

type Handler<T extends Command['type']> =
  (s: GameState, cmd: Extract<Command, { type: T }>, r: RNG) => { state: GameState; rng: RNG };

const H: { [K in Command['type']]?: Handler<K> } = {
  NewRun: run.newRun,
  ChooseStarterBlessing: run.chooseStarter,

  StartCombat: combat.start,
  PlayCard: combat.play,
  EndTurn: combat.endTurn,

  EnterNode: (s, c, r) => isPages(s) ? { state: s, rng: r } : mapgrid.enterNode(s, c as any, r),
  CompleteNode: (s, c, r) => isPages(s) ? mappages.completeNode(s, c as any, r) : mapgrid.completeNode(s, c as any, r),

  ChooseLevelUp: lvl.chooseLevelUp,
  SkipLevelUp: lvl.skipLevelUp,

  TakeReward: se.takeReward,
  TakeShop: se.takeShop,
  ShopReroll: se.shopReroll,
  DoBonfireHeal: se.doBonfireHeal,
  EventChooseBlessing: se.eventChooseBlessing,
  EventRemoveCard: se.eventRemoveCard,
  EventGambleRoll: se.eventGambleRoll,
  EventTreasureOpen: se.eventTreasureOpen,

  ShopRemoveBuy: se.shopRemoveBuy,
  ShopUpgradeBuy: se.shopUpgradeBuy,
  DoWellUse: se.doWellUse,
  DoWellDismiss: se.doWellDismiss,
  // Pages mode
  OpenPage: mappages.open,
  ChooseOffer: mappages.choose,
  DismissOffer: mappages.dismiss,
  Proceed: mappages.proceed,  

  QA_KillEnemy: qa.qaKillEnemy,
  QA_Draw: qa.qaDraw,
  QA_SetEnergy: qa.qaSetEnergy,
  QA_AddBlessingDemo: qa.qaAddBlessingDemo,
  QA_OpenShopHere: qa.qaOpenShop,
  QA_OpenShrine: qa.qaOpenShrine,
  QA_OpenRemove: qa.qaOpenRemove,
  QA_OpenGamble: qa.qaOpenGamble,
  QA_OpenTreasure: qa.qaOpenTreasure,

  QA_InitPages: qa.qaInitPages,
  QA_PrintPage: qa.qaPrintPage,  
};

export function applyCommand(state: GameState, cmd: Command, rng: RNG) {
  let s = cloneForReducer(state);
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };

  const h = H[cmd.type] as any;
  if (h) return h(s, cmd as any, rng);
  return { state: s, rng };
}

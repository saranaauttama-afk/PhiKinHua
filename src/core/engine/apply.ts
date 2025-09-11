// src/core/engine/apply.ts
import type { Command, GameState } from '../types';
import type { RNG } from '../rng';
import { cloneForReducer } from './shared';

import * as run from './handlers/run';
import * as combat from './handlers/combat';
import * as mappages from './handlers/map_pages';
import * as lvl from './handlers/level';
import * as se from './handlers/shops_events';
import * as qa from './handlers/qa';
import * as ui from './handlers/ui';
import * as equipment from './handlers/equipment';

type Handler<T extends Command['type']> =
  (s: GameState, cmd: Extract<Command, { type: T }>, r: RNG) => { state: GameState; rng: RNG };

// Pages-only: บังคับใช้ handler ฝั่ง pages เสมอ
const H: { [K in Command['type']]?: Handler<K> } = {
  // Run lifecycle
  NewRun: run.newRun,
  ChooseStarterBlessing: run.chooseStarter,

  // Combat
  // StartCombat: combat.start, // (ไม่ใช้ใน pages mode)
  PlayCard: combat.play,
  EndTurn: combat.endTurn,

  // Node completion (victory/levelup/shop/event) → pages handler
  CompleteNode: mappages.completeNode,

  // Level up
  ChooseLevelUp: lvl.chooseLevelUp,
  ChooseLevelUpOption: lvl.chooseLevelUpOption,
  CancelLevelUpChoice: lvl.cancelLevelUpChoice,
  SkipLevelUp: lvl.skipLevelUp,

  // UI
  OpenDeck: ui.openDeck,
  CloseDeck: ui.closeDeck,

  // Equipment Management
  EquipFromDeck: equipment.equipFromDeck,
  UnequipToDeck: equipment.unequipToDeck,

  // Shops & Events
  // TakeReward: se.takeReward, // (เลิกใช้: reward-on-victory ถูกตัด)
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
  DoHealingShrineUse: se.doHealingShrineUse,
  DoHealingShrineDismiss: se.doHealingShrineDismiss,
  TakeShopEquipment: se.takeShopEquipment,

  // Pages mode
  OpenPage: mappages.open,
  ChooseOffer: mappages.choose,
  DismissOffer: mappages.dismiss,
  Proceed: mappages.proceed,

  // QA - Status Effects & Enemy Behavior
  QA_ApplyStatusToPlayer: qa.qaApplyStatusToPlayer,
  QA_ApplyStatusToEnemy: qa.qaApplyStatusToEnemy,
  QA_ClearPlayerStatus: qa.qaClearPlayerStatus,
  QA_ClearEnemyStatus: qa.qaClearEnemyStatus,
  QA_TriggerEnemyBehavior: qa.qaTriggerEnemyBehavior,
  QA_ForcePhase2: qa.qaForcePhase2,
  
  // QA - Environment & Minions  
  QA_SetEnvironment: qa.qaSetEnvironment,
  QA_SummonPlayerMinion: qa.qaSummonPlayerMinion,
  QA_SummonEnemyMinion: qa.qaSummonEnemyMinion,
  QA_ClearAllMinions: qa.qaClearAllMinions,
  
  // QA - Phase 4: Adaptive AI & Combos
  QA_DebugAdaptiveAI: qa.qaDebugAdaptiveAI,
  QA_ResetAILearning: qa.qaResetAILearning,
  QA_DebugCombos: qa.qaDebugCombos,
  QA_TriggerCombo: qa.qaTriggerCombo,
  QA_ClearCombos: qa.qaClearCombos,
  QA_LevelUp: qa.qaLevelUp,

  // QA - Original
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
  QA_SpawnEquippedEnemy: qa.qaSpawnEquippedEnemy,
};

export function applyCommand(state: GameState, cmd: Command, rng: RNG) {
  const s = cloneForReducer(state);
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };

  const h = H[cmd.type] as Handler<typeof cmd.type> | undefined;
  if (h) return h(s, cmd as any, rng);
  return { state: s, rng };
}

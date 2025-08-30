import type { Command, GameState } from './types';
import { ENEMY_SLIME, START_ENERGY } from './balance';
import { applyCardEffect, baseNewState, buildAndShuffleDeck, drawUpTo, endEnemyTurn, isDefeat, isVictory, startPlayerTurn } from './commands';
import type { RNG } from './rng';
import { rollRewardOptions } from './reward';

export function applyCommand(state: GameState, cmd: Command, rng: RNG): { state: GameState; rng: RNG } {
  // Always work on a copy to keep call-site expectations pure
  let s: GameState = JSON.parse(JSON.stringify(state));
  let r = rng;

  switch (cmd.type) {
    case 'NewRun': {
      s = baseNewState(cmd.seed);
      return { state: s, rng: r };
    }
    case 'StartCombat': {
      if (s.phase === 'combat') return { state: s, rng: r };
      s.phase = 'combat';
      s.turn = 1;
      s.enemy = JSON.parse(JSON.stringify(ENEMY_SLIME));
      s.player.energy = START_ENERGY;
      ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
      ({ state: s, rng: r } = drawUpTo(s, r));
      s.log.push(`Combat started vs ${s.enemy?.name ?? 'Enemy'}`);
      return { state: s, rng: r };
    }
    case 'PlayCard': {
      if (s.phase !== 'combat') return { state: s, rng: r };
      const idx = cmd.index;
      if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
      const played = s.piles.hand[idx];
      // Apply effect & move card to discard
      applyCardEffect(s, idx);
      // move to discard
      const [c] = s.piles.hand.splice(idx, 1);
      s.piles.discard.push(c);
      s.log.push(`Played ${played.name}`);
      // On-play draw (for cards that set draw)
      if (played.draw && played.draw > 0) {
        for (let i = 0; i < played.draw; i) {
          ({ state: s, rng: r } = drawUpTo(s, r, s.piles.hand.length + 1)); // draw exactly 1 each loop
        }
      }
      if (isVictory(s)) {
        // ไปหน้ารางวัล (M1 step 1)
        s.phase = 'reward';
        const rolled = rollRewardOptions(r, 3);
        r = rolled.rng;
        s.rewardOptions = rolled.options;
        s.log.push('Victory! Choose a card.');
      }
      return { state: s, rng: r };
    }
    case 'EndTurn': {
      if (s.phase !== 'combat') return { state: s, rng: r };
      // Enemy turn
      endEnemyTurn(s);
      if (isDefeat(s)) {
        s.phase = 'defeat';
        s.log.push('Defeat...');
        return { state: s, rng: r };
      }
      // Next player turn
      s.turn = 1;
      ({ state: s, rng: r } = startPlayerTurn(s, r));
      return { state: s, rng: r };
    }
    case 'TakeReward': {
      if (s.phase !== 'reward' || !s.rewardOptions) return { state: s, rng: r };
      const idx = cmd.index;
      const chosen = s.rewardOptions[idx];
      if (!chosen) return { state: s, rng: r };
      // ใส่การ์ดที่เลือกเข้ากองทิ้ง (จะเข้ามือรอบถัดไปตามปกติ)
      s.piles.discard.push(JSON.parse(JSON.stringify(chosen)));
      s.log.push(`Took reward: ${chosen.name}`);
      // ปิดตัวเลือก (ให้กด CompleteNode เพื่อปิด modal)
      s.rewardOptions = undefined;
      return { state: s, rng: r };
    }
    case 'CompleteNode': {
      // ปิด modal/event ทั้งหมด แล้ว “กลับเมนู” ชั่วคราว (ก่อนมี map)
      s.rewardOptions = undefined;
      s.enemy = undefined;
      s.phase = 'menu';
      s.turn = 0;
      s.log.push('Node completed.');
      return { state: s, rng: r };
    }    
    default:
      return { state: s, rng: r };
  }
}

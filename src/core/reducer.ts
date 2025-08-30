import type { Command, GameState } from './types';
import { ENEMY_SLIME, START_ENERGY } from './balance';
import { applyCardEffect, baseNewState, buildAndShuffleDeck, drawUpTo, endEnemyTurn, isDefeat, isVictory, startPlayerTurn } from './commands';
import type { RNG } from './rng';
import { rollRewardOptionsByTier, rollShopStock } from './reward';
import { availableNodes, completeAndAdvance, generateMap,findNode  } from './map';

export function applyCommand(state: GameState, cmd: Command, rng: RNG): { state: GameState; rng: RNG } {
  // Always work on a copy to keep call-site expectations pure
  let s: GameState = JSON.parse(JSON.stringify(state));
  let r = rng;

  switch (cmd.type) {
    case 'NewRun': {
      // สร้างแผนที่สำหรับ Act (deterministic ด้วย RNG)
      const g = generateMap(r);
      r = g.rng;
      s.map = g.map;
      s.phase = 'map';
      s.log.push(`New run: seed=${cmd.seed}. Map ready with ${s.map.totalCols} cols.`);
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
        // ไปหน้ารางวัล (ขึ้นกับชนิดโหนด: normal/elite/boss)
        s.phase = 'reward';
        let tier: 'normal' | 'elite' | 'boss' = 'normal';
        if (s.map) {
          const node = findNode(s.map, s.map.currentNodeId);
          if (node?.kind === 'elite') tier = 'elite';
          if (node?.kind === 'boss') tier = 'boss';
        }
        const rolled = rollRewardOptionsByTier(r, tier);
        r = rolled.rng;
        s.rewardOptions = rolled.options;
        s.log.push(`Victory! Choose a card (${tier}).`);
      }
      return { state: s, rng: r };
    }
    case 'EnterNode': {
      if (s.phase !== 'map' || !s.map) return { state: s, rng: r };
      // ตรวจว่า node ที่เลือกอยู่ในคอลัมน์ปัจจุบัน
      const avail = availableNodes(s.map);
      const ok = avail.find(n => n.id === cmd.nodeId);
      if (!ok) return { state: s, rng: r };
      s.map.currentNodeId = cmd.nodeId;
      // เริ่มคอมแบต (ตอนนี้มีแต่ monster/boss ตัวอย่างเดียว)
      // แตกตามชนิดโหนด
      if (ok.kind === 'shop') {
        const stock = rollShopStock(r, 5); r = stock.rng;
        s.shopOptions = stock.options;
        s.phase = 'shop';
        s.log.push(`Enter node ${cmd.nodeId} -> Shop`);
      } else if (ok.kind === 'bonfire') {
        s.event = { type: 'bonfire', healed: false };
        s.phase = 'event';
        s.log.push(`Enter node ${cmd.nodeId} -> Bonfire`);
      } else {
        // combat: monster/elite/boss
        s.phase = 'combat';
        s.turn = 1;
        s.enemy = JSON.parse(JSON.stringify(ENEMY_SLIME));
        s.player.energy = START_ENERGY;
        ({ state: s, rng: r } = buildAndShuffleDeck(s, r));
        ({ state: s, rng: r } = drawUpTo(s, r));
        s.log.push(`Enter node ${cmd.nodeId} -> Combat vs ${s.enemy?.name ?? 'Enemy'}`);
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
    case 'TakeShop': {
      if (s.phase !== 'shop' || !s.shopOptions) return { state: s, rng: r };
      const idx = cmd.index;
      const chosen = s.shopOptions[idx];
      if (!chosen) return { state: s, rng: r };
      // เวอร์ชันง่าย: รับฟรี 1 ใบ → ใส่กองทิ้ง
      s.piles.discard.push(JSON.parse(JSON.stringify(chosen)));
      s.log.push(`Shop: took ${chosen.name}`);
      // ปิดสต็อก รอ CompleteNode
      s.shopOptions = undefined;
      return { state: s, rng: r };
    }
    case 'DoBonfireHeal': {
      if (s.phase !== 'event' || !s.event || s.event.type !== 'bonfire') return { state: s, rng: r };
      if (!s.event.healed) {
        s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
        s.event.healed = true;
        s.log.push('Bonfire: healed +10');
      }
      return { state: s, rng: r };
    }
    case 'CompleteNode': {
      // ปิด modal/event ทั้งหมด แล้ว “กลับเมนู” ชั่วคราว (ก่อนมี map)
      // ปิด modal แล้วกลับแผนที่ + เลื่อนไปคอลัมน์ถัดไป
      // ปิด modal หลังคอมแบต และตัดสินว่าจะ "ชัยชนะจบ Act" หรือ "กลับแผนที่"
      s.rewardOptions = undefined;
      s.enemy = undefined;
      s.shopOptions = undefined;
      s.event = undefined;      
      if (s.map) {
        const node = findNode(s.map, s.map.currentNodeId);
        // ตีความ: ถ้าเป็น boss => จบวิ่ง (victory)
        if (node?.kind === 'boss') {
          s.map = completeAndAdvance(s.map, s.map.currentNodeId);
          s.phase = 'victory';
          s.turn = 0;
          s.log.push('Act cleared! 🎉');
          return { state: s, rng: r };
        }
        // ไม่ใช่บอส => กลับแผนที่ เลื่อนไปคอลัมน์ถัดไป
        s.map = completeAndAdvance(s.map, s.map.currentNodeId);
        s.log.push(`Node ${s.map.currentNodeId ?? ''} completed. Depth=${s.map.depth}/${s.map.totalCols}`);
      }
      s.phase = 'map';
      s.turn = 0;
      return { state: s, rng: r };
    }    
    default:
      return { state: s, rng: r };
  }
}

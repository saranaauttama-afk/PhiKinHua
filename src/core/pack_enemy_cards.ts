import type { EnemyCard } from './types';

// ใช้ require ให้ Metro bundle JSON ไปด้วย (match โครงปัจจุบัน)
const ENEMY_CARDS: EnemyCard[] = require('../data/packs/base/enemy_cards.json');

const byId = new Map<string, EnemyCard>();
for (const c of ENEMY_CARDS) byId.set(c.id, c);

export function enemyCardById(id: string): EnemyCard | undefined {
  const def = byId.get(id);
  return def ? { ...def } : undefined;
}

// src/core/engine/handlers/ui.ts
// UI-related commands (deck toggle, etc.)

import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';

export function openDeck(s: GameState, _cmd: Extract<Command, { type: 'OpenDeck' }>, r: RNG) {
  s.deckOpen = true;
  return { state: s, rng: r };
}

export function closeDeck(s: GameState, _cmd: Extract<Command, { type: 'CloseDeck' }>, r: RNG) {
  s.deckOpen = false;
  return { state: s, rng: r };
}
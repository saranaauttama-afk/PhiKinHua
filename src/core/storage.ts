// src/core/storage.ts
// React Native storage utilities for save/load game state

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from './types';
import { toSaveV1, fromSaveV1, type SaveV1 } from './save';

// Storage keys
const SAVE_SLOT_PREFIX = 'phikinhua_save_';
const AUTO_SAVE_KEY = 'phikinhua_autosave';
const SETTINGS_KEY = 'phikinhua_settings';

// Settings type
export type GameSettings = {
  autoSaveEnabled: boolean;
  maxSaveSlots: number;
  lastPlayedSlot?: number;
};

export const DEFAULT_SETTINGS: GameSettings = {
  autoSaveEnabled: true,
  maxSaveSlots: 3,
};

// === Save/Load Functions ===

export async function saveGame(state: GameState, slot: number = 0): Promise<void> {
  try {
    const saveData = toSaveV1(state);
    const key = slot === -1 ? AUTO_SAVE_KEY : `${SAVE_SLOT_PREFIX}${slot}`;
    
    // Add metadata
    const enrichedSave = {
      ...saveData,
      savedAt: new Date().toISOString(),
      slot: slot === -1 ? 'auto' : slot,
    };

    await AsyncStorage.setItem(key, JSON.stringify(enrichedSave));
    
    // Update last played slot if it's not auto-save
    if (slot !== -1) {
      const settings = await loadSettings();
      await saveSettings({ ...settings, lastPlayedSlot: slot });
    }
  } catch (error) {
    console.error('Failed to save game:', error);
    throw new Error(`Failed to save game: ${error}`);
  }
}

export async function loadGame(slot: number = 0): Promise<GameState> {
  try {
    const key = slot === -1 ? AUTO_SAVE_KEY : `${SAVE_SLOT_PREFIX}${slot}`;
    const saved = await AsyncStorage.getItem(key);
    
    if (!saved) {
      throw new Error(`No save found in slot ${slot === -1 ? 'auto' : slot}`);
    }

    const saveData = JSON.parse(saved) as SaveV1 & { savedAt?: string; slot?: string | number };
    return fromSaveV1(saveData);
  } catch (error) {
    console.error('Failed to load game:', error);
    throw new Error(`Failed to load game: ${error}`);
  }
}

export async function deleteSave(slot: number): Promise<void> {
  try {
    const key = slot === -1 ? AUTO_SAVE_KEY : `${SAVE_SLOT_PREFIX}${slot}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete save:', error);
    throw new Error(`Failed to delete save: ${error}`);
  }
}

// === Save Slot Management ===

export type SaveSlotInfo = {
  slot: number;
  exists: boolean;
  savedAt?: string;
  playerLevel?: number;
  gold?: number;
  currentPage?: number;
  totalPages?: number;
};

export async function getSaveSlots(maxSlots: number = 3): Promise<SaveSlotInfo[]> {
  const slots: SaveSlotInfo[] = [];

  for (let i = 0; i < maxSlots; i++) {
    const key = `${SAVE_SLOT_PREFIX}${i}`;
    try {
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved) as SaveV1 & { savedAt?: string };
        slots.push({
          slot: i,
          exists: true,
          savedAt: data.savedAt,
          playerLevel: data.player?.level,
          gold: data.gold,
          currentPage: (data.pages?.pageIndex ?? 0) + 1,
          totalPages: data.pages?.totalPages,
        });
      } else {
        slots.push({ slot: i, exists: false });
      }
    } catch (error) {
      console.error(`Failed to read save slot ${i}:`, error);
      slots.push({ slot: i, exists: false });
    }
  }

  return slots;
}

export async function hasAutoSave(): Promise<boolean> {
  try {
    const saved = await AsyncStorage.getItem(AUTO_SAVE_KEY);
    return saved !== null;
  } catch {
    return false;
  }
}

// === Settings ===

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export async function loadSettings(): Promise<GameSettings> {
  try {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// === Auto Save ===

export async function autoSave(state: GameState): Promise<void> {
  const settings = await loadSettings();
  if (settings.autoSaveEnabled) {
    await saveGame(state, -1); // -1 = auto save slot
  }
}

// === Utility Functions ===

export function formatSaveDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

export async function clearAllSaves(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const saveKeys = keys.filter(key => 
      key.startsWith(SAVE_SLOT_PREFIX) || 
      key === AUTO_SAVE_KEY
    );
    await AsyncStorage.multiRemove(saveKeys);
  } catch (error) {
    console.error('Failed to clear saves:', error);
    throw new Error(`Failed to clear saves: ${error}`);
  }
}
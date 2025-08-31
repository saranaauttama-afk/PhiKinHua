import { Audio } from 'expo-av';

// ใช้ไฟล์ในโปรเจกต์แทน data URI (ชัวร์สุด)
const SOURCES = {
  attack: require('../../assets/sfx/attack.wav'),
  block: require('../../assets/sfx/block.wav'),
} as const;
type SfxKey = keyof typeof SOURCES;

let inited = false;
let ENABLED = true;
let VOLUME = 0.9;

async function ensureInit() {
  if (inited) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    } as any);
  } catch {}
  inited = true;
}

// lazy-load แล้ว cache ไว้ ไม่ต้อง load ทุกครั้ง
const cache: Partial<Record<SfxKey, Audio.Sound>> = {};
async function getSound(key: SfxKey): Promise<Audio.Sound | null> {
  try {
    await ensureInit();
    if (cache[key]) return cache[key]!;
    const { sound } = await Audio.Sound.createAsync(SOURCES[key], { volume: VOLUME  });
    cache[key] = sound;
    return sound;
  } catch {
    return null;
  }
}

async function play(key: SfxKey) {
    if (!ENABLED) return;
  const snd = await getSound(key);
  if (!snd) return;
  try {
    // ถ้าเคยเล่นแล้ว ให้รีเพลย์จากต้น
    await snd.replayAsync();
  } catch {
    try { await snd.setPositionAsync(0); await snd.playAsync(); } catch {}
  }
}

export const sfx = {
  attack() { void play('attack'); },
  block()  { void play('block');  },
  setEnabled(v: boolean) { ENABLED = v; },
  isEnabled() { return ENABLED; },
  async setVolume(vol: number) {
    VOLUME = Math.max(0, Math.min(1, vol));
    // อัปเดตเสียงที่แคชอยู่
    await Promise.all(Object.values(cache).map(s => s?.setVolumeAsync?.(VOLUME)));
  },
  getVolume() { return VOLUME; },  
};
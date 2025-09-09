# 🧪 Phase 1-4 Complete Testing Checklist

## ✅ Phase 1: Status Effects System

### Core Status Effects (12 Types)
- [ ] **Strength** 💪 - เพิ่ม damage ที่ทำ
- [ ] **Weakness** 😵 - ลด damage ที่ทำ  
- [ ] **Vulnerable** 🛡️💔 - รับ damage เพิ่ม 50%
- [ ] **Poison** ☠️ - สูญเสีย HP ทุกเทิร์น
- [ ] **Regeneration** 💚 - ฟื้น HP ทุกเทิร์น
- [ ] **Fear** 😰 - ไม่สามารถโจมตีได้
- [ ] **Curse** 🖤 - ลดพลังโจมตีและป้องกัน
- [ ] **Corruption** 🌀 - HP สูงสุดลดลงทุกเทิร์น
- [ ] **Entangle** 🕸️ - ไม่สามารถเล่นการ์ด Attack ได้
- [ ] **Spell Charging** ⚡ - Enemy กำลัง cast spell
- [ ] **Block Next** 🛡️✨ - Block damage ครั้งถัดไป
- [ ] **Energy Drain** ⚡💔 - พลังงานสูงสุดลดลง

### UI Testing
- [ ] Status effects แสดงใน CombatView (ทั้ง player และ enemy)
- [ ] สีและ icon ถูกต้องตาม type (เขียว=buff, แดง=debuff)
- [ ] แสดง stacks และ duration correctly
- [ ] Log messages มีสีตาม status type

### Debug Commands  
- [ ] `QA_ApplyStatusToPlayer` - ใส่ poison ให้ตัวเอง
- [ ] `QA_ApplyStatusToEnemy` - ใส่ vulnerable ให้ศัตรู
- [ ] `QA_ClearPlayerStatus` - ล้าง status ของ player
- [ ] `QA_ClearEnemyStatus` - ล้าง status ของ enemy

---

## ✅ Phase 2: Enemy Behavior & Spell System

### Enemy Behaviors (Testing with Thai Enemies)
- [ ] **HP-based behaviors** - เมื่อ HP < 50% และ < 25%
- [ ] **Turn-based behaviors** - Turn 3+, Even/Odd turns
- [ ] **Conditional behaviors** - Player has curse, low HP
- [ ] **Phase 2 triggers** - Enemy เข้า Phase 2

### Enemy Spells (Multi-turn casting)
- [ ] **Spell charging** - แสดง "casting" status
- [ ] **Telegraphing** - บอกล่วงหน้าก่อน cast
- [ ] **Spell completion** - เอฟเฟกต์เกิดขึ้นตามกำหนด
- [ ] **Multiple spells** - Cast หลาย spell พร้อมกัน

### 14 Thai Enemies
**Normal Enemies:**
- [ ] **Phi Pop** (ผีปอบ) - Corruption specialist
- [ ] **Phi Tai Hong** (ผีตายโหง) - Fear attacks  
- [ ] **Krasue** (กระสือ) - Poison aura
- [ ] **Phi Phong Khang** (ผีโผงคาง) - Curse magic
- [ ] **Phi Kong Koi** (ผีกองกอย) - Entangle vines
- [ ] **Mae Nak** (แม่นาค) - Emotional manipulation

**Elite Enemies:**
- [ ] **Penanggalan** (ปีนังกลัน) - Advanced corruption
- [ ] **Phi Chamob** (ผีจะมอบ) - Energy drain
- [ ] **Kuman Thong** (กุมารทอง) - Minion summoning
- [ ] **Phi Kraik** (ผีกรายก์) - Multi-phase fighter
- [ ] **Banshee Thai** (ผีหวีด) - Sound attacks
- [ ] **Phi Dip** (ผีดิบ) - Undead resilience

**Boss Enemies:**
- [ ] **Thai Ghost Doctor** (หมอผีไทย) - Master shaman
- [ ] **Ancient Spirit** (วิญญาณโบราณ) - Ultimate challenge

### Debug Commands
- [ ] `QA_TriggerEnemyBehavior` - บังคับ trigger behavior
- [ ] `QA_StartSpellCasting` - เริ่ม cast spell
- [ ] `QA_ForcePhase2` - เปลี่ยนเป็น Phase 2

---

## ✅ Phase 3: Environment & Minion System

### 4 Thai Battle Environments
- [ ] **Haunted Temple** 🏯 - Spiritual energy boost
- [ ] **Cursed Forest** 🌲 - Dark magic amplification  
- [ ] **Ancient Graveyard** ⚰️ - Undead advantage
- [ ] **Spirit Realm** 👻 - Reality distortion effects

### Environment Effects
- [ ] **Damage modifiers** - เพิ่ม/ลด damage
- [ ] **Energy modifiers** - เปลี่ยนพลังงานต่อเทิร์น
- [ ] **Card cost modifiers** - ปรับราคาไพ่
- [ ] **Block modifiers** - เปลี่ยนค่า defense

### 8 Minion Types
**Player Minions:**
- [ ] **Ghost Ally** 👻 - Basic spirit helper
- [ ] **Ancestral Guardian** 🛡️ - Protective spirit
- [ ] **Demon Minion** 😈 - Summoned demon
- [ ] **Holy Spirit** ✨ - Divine protection

**Enemy Minions:**  
- [ ] **Shadow Clone** 🌑 - Enemy duplicate
- [ ] **Cursed Doll** 🪆 - Voodoo minion
- [ ] **Spirit Warrior** ⚔️ - Combat ghost
- [ ] **Dark Familiar** 🦇 - Evil companion

### Minion AI Behaviors
- [ ] **Aggressive AI** - โจมตีทันที
- [ ] **Defensive AI** - ป้องกัน owner
- [ ] **Support AI** - ช่วยเหลือ allies
- [ ] **Tactical AI** - วางแผนการต่อสู้

### UI & Debug Commands
- [ ] Environment แสดงใน CombatView
- [ ] Minions แสดงพร้อม HP
- [ ] `QA_SetEnvironment` - เปลี่ยน environment
- [ ] `QA_SummonPlayerMinion` - เรียก ally
- [ ] `QA_SummonEnemyMinion` - เรียก enemy minion
- [ ] `QA_ClearAllMinions` - ล้าง minions ทั้งหมด

---

## ✅ Phase 4: Adaptive AI & Card Combos

### Adaptive AI Learning System
- [ ] **Play Style Detection** - AI รู้จักรูปแบบการเล่น
  - Aggressive, Defensive, Balanced, Combo
- [ ] **Pattern Learning** - เรียนรู้จากการเล่นไพ่
- [ ] **Counter Strategies** - ปรับกลยุทธ์ตอบโต้
- [ ] **Dynamic Difficulty** - ปรับความยากตามฝีมือ
- [ ] **Real-time Adaptation** - เปลี่ยนแปลงทันที

### 12 Thai Shaman Card Combos
**Basic Combos (2 cards):**
- [ ] **Shaman's Focus** - Meditation + Thai card
- [ ] **Ghost Summoning Ritual** - Call Old Ghost + Spirit Whisper
- [ ] **Curse Amplification** - Curse Chant + Cursed Needle

**Advanced Combos (3+ cards):**
- [ ] **Protection Ritual** - Holy Powder + Cooling Cloth + Bell Sound
- [ ] **Spirit Possession Mastery** - Ghost Possession + Ancestral Spirits
- [ ] **Hell Gate Ritual** - Hell Gate + Soul Drain + Black Magic

**Legendary Combos:**
- [ ] **Divine Intervention** - Divine Protection + Royal Medicine + Sacred Ritual
- [ ] **Ultimate Thai Mastery** - 7+ different Thai cards

### Combo System Features
- [ ] **Multi-turn Windows** - Combos สามารถใช้ 1-5 เทิร์น
- [ ] **Progress Tracking** - แสดง progress real-time
- [ ] **Visual Feedback** - เอฟเฟกต์เมื่อ trigger
- [ ] **Powerful Effects** - Damage, heal, summon, special abilities

### UI Testing
- [ ] Active combos แสดงใน CombatView
- [ ] Progress counter ถูกต้อง (2/3)
- [ ] Combo completion messages
- [ ] AI adaptation messages ใน log

### Debug Commands
- [ ] `QA_DebugAdaptiveAI` - ดู AI patterns
- [ ] `QA_ResetAILearning` - รีเซ็ต AI learning
- [ ] `QA_DebugCombos` - ดู combo status  
- [ ] `QA_TriggerCombo` - บังคับ trigger combo
- [ ] `QA_ClearCombos` - ล้าง combo progress

---

## 🎮 Complete Integration Testing

### Game Flow Testing
- [ ] **New Game** - เริ่มเกมใหม่ทำงาน
- [ ] **Combat Flow** - การต่อสู้ครบถ้วน
- [ ] **Victory/Defeat** - จบเกมถูกต้อง
- [ ] **Level Up** - เพิ่มระดับมีตัวเลือก
- [ ] **Shop System** - ซื้อไพ่และอุปกรณ์
- [ ] **Event System** - เหตุการณ์ทำงาน

### All Systems Working Together
- [ ] **Status + Combo** - Status effects ส่งผลต่อ combo
- [ ] **Environment + AI** - Environment ส่งผลต่อ AI behavior  
- [ ] **Minions + Spells** - Minions โต้ตอบกับ spell system
- [ ] **AI + All Systems** - AI ปรับตัวกับทุกระบบ

### Performance Testing  
- [ ] **No Crashes** - เกมไม่ crash ระหว่างเล่น
- [ ] **Smooth UI** - UI ตอบสนองเร็ว
- [ ] **Memory Usage** - ไม่กิน memory มากเกินไป
- [ ] **Save/Load** - บันทึก/โหลดทำงาน

---

## 🔧 Debug Panel Complete Test

### Basic Commands
- [ ] Kill Enemy, Draw Cards, +Energy ทำงาน

### Status Effects Commands  
- [ ] Apply status ให้ player/enemy
- [ ] Clear status ทำงาน

### Phase 4 Commands
- [ ] AI Debug แสดงข้อมูล console
- [ ] Combo Debug แสดง combo state
- [ ] Force Combo ทำงาน

### Environment & Minion Commands
- [ ] Set Environment เปลี่ยน environment
- [ ] Summon minions ทำงาน
- [ ] Clear minions ลบทั้งหมด

### Advanced Commands
- [ ] Spawn equipped enemy
- [ ] Open shop anywhere
- [ ] All systems integration

---

## 🎯 Final Verification

- [ ] **25+ Thai Cards** ทำงานถูกต้อง
- [ ] **14 Thai Enemies** มี behavior เฉพาะ
- [ ] **12 Status Effects** เอฟเฟกต์ครบถ้วน
- [ ] **4 Environments** ส่งผลต่อ gameplay
- [ ] **8 Minion Types** AI ทำงานถูกต้อง  
- [ ] **12 Card Combos** trigger และ effect ถูกต้อง
- [ ] **Adaptive AI** เรียนรู้และปรับตัว
- [ ] **Enhanced UI** แสดงระบบใหม่ทั้งหมด
- [ ] **Debug Panel** ทุก command ใช้งานได้

**🎉 เมื่อครบทุกจุดแล้ว = Phase 1-4 สมบูรณ์!**
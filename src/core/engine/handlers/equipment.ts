// src/core/engine/handlers/equipment.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { getEquipmentById } from '../../pack';

export function equipFromDeck(s: GameState, cmd: Extract<Command, { type: 'EquipFromDeck' }>, r: RNG) {
  const cardId = cmd.cardId;
  
  // Find the equipment card in masterDeck
  const equipmentCard = s.masterDeck.find(card => card.id === cardId && card.type === 'equipment');
  if (!equipmentCard || !equipmentCard.equipmentId) {
    s.log.push('Equipment card not found in deck');
    return { state: s, rng: r };
  }

  // Get equipment data from pack
  const equipmentData = getEquipmentById(equipmentCard.equipmentId);
  if (!equipmentData) {
    s.log.push('Equipment data not found');
    return { state: s, rng: r };
  }

  // Check if already equipped
  const alreadyEquipped = (s.equipped || []).some(eq => eq.id === equipmentCard.equipmentId);
  if (alreadyEquipped) {
    s.log.push(`${equipmentData.name || equipmentData.id} is already equipped`);
    return { state: s, rng: r };
  }

  // Calculate slot usage
  const currentSlotUsage = (s.equipped || []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
  const maxSlots = s.equipmentSlotsMax || 1;
  const cardSlotCost = equipmentCard.slotCost || equipmentData.slotCost || 1;

  if (currentSlotUsage + cardSlotCost > maxSlots) {
    s.log.push(`Not enough equipment slots for ${equipmentData.name || equipmentData.id} (need ${cardSlotCost}, have ${maxSlots - currentSlotUsage})`);
    return { state: s, rng: r };
  }

  // Equip the equipment
  s.equipped = s.equipped || [];
  s.equipped.push({
    id: equipmentData.id,
    name: equipmentData.name,
    rarity: equipmentData.rarity,
    slotCost: equipmentData.slotCost,
    desc: equipmentData.desc,
    tags: equipmentData.tags,
    sourceCardId: cardId,
    sourceCard: { ...equipmentCard }
  });

  // Remove the equipment card from masterDeck
  const cardIndex = s.masterDeck.findIndex(card => card.id === cardId);
  if (cardIndex !== -1) {
    s.masterDeck.splice(cardIndex, 1);
    s.log.push(`Equipped: ${equipmentData.name || equipmentData.id} (card removed from deck)`);
  } else {
    s.log.push(`Equipped: ${equipmentData.name || equipmentData.id}`);
  }
  
  return { state: s, rng: r };
}

export function unequipToDeck(s: GameState, cmd: Extract<Command, { type: 'UnequipToDeck' }>, r: RNG) {
  const equipmentId = cmd.equipmentId;
  
  // Find the equipment in equipped list
  const equipmentIndex = (s.equipped || []).findIndex(eq => eq.id === equipmentId);
  if (equipmentIndex === -1) {
    s.log.push('Equipment not found in equipped list');
    return { state: s, rng: r };
  }

  // Check if equipment is temporary (can't be unequipped manually)
  const equipment = s.equipped![equipmentIndex];
  if (equipment.temporary) {
    s.log.push('Cannot unequip temporary equipment');
    return { state: s, rng: r };
  }

  // Remove from equipped
  const [removedEquipment] = s.equipped!.splice(equipmentIndex, 1);
  
  // Return equipment card to masterDeck if we have the source card data
  if (removedEquipment.sourceCard) {
    // Add the original card back to deck
    s.masterDeck.push({ ...removedEquipment.sourceCard });
    s.log.push(`Unequipped: ${removedEquipment.name || removedEquipment.id} (card returned to deck)`);
  } else {
    s.log.push(`Unequipped: ${removedEquipment.name || removedEquipment.id}`);
  }
  
  return { state: s, rng: r };
}
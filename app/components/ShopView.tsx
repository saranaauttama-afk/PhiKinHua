import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { GameState, Command } from '../../src/core/types';
import { removeCostForCount, upgradeCostForCount } from '../../src/core/balance/economy';

interface ShopViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

function ShopView({ state, dispatch }: ShopViewProps) {
  const inShop = state.phase === 'shop';
  const shopKind = state.shopKind;

  if (!inShop) return null;

  const renderCardShop = () => (
    <View style={{ marginTop: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(39, 39, 42, 0.8)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
      <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>🛒 Card Shop</Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>Gold: {state.player.gold}g</Text>
      
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {(state.shopStock ?? []).map((item, i) => (
          <Pressable
            key={i}
            onPress={() => dispatch({ type: 'TakeShop', index: i })}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1,
              backgroundColor: '#374151',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>{'card' in item ? item.card?.name || 'Unknown' : 'Unknown'}</Text>
            <Text style={{ color: '#fcd34d' }}>💰 {item.price}g</Text>
            {'card' in item && item.card?.dmg ? <Text style={{ color: '#fca5a5' }}>DMG {item.card.dmg}</Text> : null}
            {'card' in item && item.card?.block ? <Text style={{ color: '#7dd3fc' }}>Block {item.card.block}</Text> : null}
            {'card' in item && item.card?.energyGain ? <Text style={{ color: '#fcd34d' }}>Energy +{item.card.energyGain}</Text> : null}
            {'card' in item && item.card?.draw ? <Text style={{ color: '#86efac' }}>Draw {item.card.draw}</Text> : null}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => dispatch({ type: 'ShopReroll' })}
        className="px-4 py-2 rounded-xl bg-purple-700/40 border border-purple-500/40 active:opacity-70"
      >
        <Text className="text-purple-200 font-semibold">🎲 Reroll (50g)</Text>
      </Pressable>
    </View>
  );

  const renderEquipmentShop = () => (
    <View className="mt-4 rounded-2xl p-4 bg-zinc-800/80 border border-amber-500/20">
      <Text className="text-white text-lg font-semibold mb-2">⚔️ Equipment Shop</Text>
      <Text className="text-white/80 mb-2">Gold: {state.player.gold}g</Text>
      
      <View className="flex-row gap-2 flex-wrap">
        {(state.shopStock ?? []).map((item, i) => (
          <Pressable
            key={i}
            onPress={() => dispatch({ type: 'TakeShopEquipment', index: i })}
            className="px-3 py-2 rounded-xl border bg-amber-900/30 border-amber-500/30 active:opacity-70"
          >
            <Text className="text-amber-200 font-semibold">{'equipment' in item ? item.equipment?.name || 'Unknown' : 'Unknown'}</Text>
            <Text className="text-amber-300">💰 {item.price}g</Text>
            <Text className="text-amber-300/70 text-sm">{'equipment' in item ? item.equipment?.rarity : ''}</Text>
            <Text className="text-amber-200/70 text-xs">{'equipment' in item ? item.equipment?.desc : ''}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderRemoveShop = () => {
    const removeCount = state.runCounters?.removeShopCount ?? 0;
    const removeCost = removeCostForCount(removeCount);

    return (
      <View className="mt-4 rounded-2xl p-4 bg-red-900/30 border border-red-500/30">
        <Text className="text-white text-lg font-semibold mb-2">🗑️ Remove Cards</Text>
        <Text className="text-white/80 mb-2">Gold: {state.player.gold}g</Text>
        <Text className="text-red-300 mb-3">Cost: {removeCost}g (removed {removeCount} cards)</Text>
        
        <Text className="text-white font-semibold mb-2">Select card to remove:</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(state.masterDeck ?? []).map((card, i) => (
            <Pressable
              key={i}
              onPress={() => dispatch({ type: 'ShopRemoveBuy', index: i })}
              className="px-3 py-2 rounded-xl border bg-red-800/30 border-red-500/30 active:opacity-70"
            >
              <Text className="text-red-200">{card.name || card.id}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderUpgradeShop = () => {
    const upgradeCount = state.runCounters?.upgradeShopCount ?? 0;
    const upgradeCost = upgradeCostForCount(upgradeCount);

    return (
      <View className="mt-4 rounded-2xl p-4 bg-green-900/30 border border-green-500/30">
        <Text className="text-white text-lg font-semibold mb-2">⬆️ Upgrade Cards</Text>
        <Text className="text-white/80 mb-2">Gold: {state.player.gold}g</Text>
        <Text className="text-green-300 mb-3">Cost: {upgradeCost}g (upgraded {upgradeCount} cards)</Text>
        
        <Text className="text-white font-semibold mb-2">Select card to upgrade:</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(state.masterDeck ?? []).map((card, i) => (
            <Pressable
              key={i}
              onPress={() => dispatch({ type: 'ShopUpgradeBuy', index: i })}
              className="px-3 py-2 rounded-xl border bg-green-800/30 border-green-500/30 active:opacity-70"
            >
              <Text className="text-green-200">{card.name || card.id}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View>
      {shopKind === 'card' && renderCardShop()}
      {shopKind === 'equipment' && renderEquipmentShop()}
      {shopKind === 'remove' && renderRemoveShop()}
      {shopKind === 'upgrade' && renderUpgradeShop()}
      
      {/* Close Shop Button */}
      <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center' }}>
        <Pressable
          onPress={() => dispatch({ type: 'CompleteNode' })}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: 'rgba(63, 63, 70, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>🚪 Leave Shop</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default ShopView;
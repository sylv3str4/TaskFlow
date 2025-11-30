/**
 * Pet Sanctuary Component
 * Dedicated page for virtual pet collection and spins
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { getThemeColors } from '../utils/theme';
import {
  PawPrint,
  Coins,
  Sparkles,
  Wand2,
  Gift,
  RefreshCcw,
  Heart,
  Bone,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Star,
  Backpack,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { FOOD_ITEMS } from './Shop';

const rarityStyles = {
  Common: 'text-gray-500 bg-gray-100 dark:bg-gray-800/60',
  Rare: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40',
  Epic: 'text-purple-500 bg-purple-100 dark:bg-purple-900/40',
  Legendary: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  Mythical: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
  Secret: 'text-gray-900 dark:text-gray-100 bg-gray-800 dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-500',
};

const rarityChances = [
  { rarity: 'Secret', chance: 0.5, color: 'text-gray-900 dark:text-gray-100' },
  { rarity: 'Mythical', chance: 3.5, color: 'text-pink-500' },
  { rarity: 'Legendary', chance: 5, color: 'text-yellow-500' },
  { rarity: 'Epic', chance: 18, color: 'text-purple-500' },
  { rarity: 'Rare', chance: 30, color: 'text-blue-500' },
  { rarity: 'Common', chance: 43, color: 'text-gray-500' },
];

const SPIN_COST = 25;
const PITY_THRESHOLD = 10;

// Helper function to scale buffs/debuffs for level (same as in AppContext)
const scaleBuffsForLevel = (buffs, level) => {
  if (!buffs || level <= 1) return buffs || {};
  const multiplier = Math.min(1 + (level - 1) * 0.02, 2);
  const scaled = {};
  for (const [key, value] of Object.entries(buffs)) {
    scaled[key] = Math.floor(value * multiplier);
  }
  return scaled;
};

const scaleDebuffsForLevel = (debuffs, level) => {
  if (!debuffs || level <= 1) return debuffs || {};
  const multiplier = Math.max(1 - (level - 1) * 0.01, 0.5);
  const scaled = {};
  for (const [key, value] of Object.entries(debuffs)) {
    scaled[key] = Math.floor(value * multiplier);
  }
  return scaled;
};

// Helper to calculate combined buffs from all equipped pets
const getCombinedBuffs = (equippedPets) => {
  const combinedBuffs = {
    xpBoost: 0,
    coinBoost: 0,
    discount: 0,
    luckBoost: 0,
  };
  const combinedDebuffs = {
    xpPenalty: 0,
    coinPenalty: 0,
    priceIncrease: 0,
    luckPenalty: 0,
  };

  equippedPets.forEach(pet => {
    const scaledBuffs = scaleBuffsForLevel(pet.buffs || {}, pet.level || 1);
    const scaledDebuffs = scaleDebuffsForLevel(pet.debuffs || {}, pet.level || 1);
    
    combinedBuffs.xpBoost += scaledBuffs.xpBoost || 0;
    combinedBuffs.coinBoost += scaledBuffs.coinBoost || 0;
    combinedBuffs.discount += scaledBuffs.discount || 0;
    combinedBuffs.luckBoost += scaledBuffs.luckBoost || 0;
    
    combinedDebuffs.xpPenalty += scaledDebuffs.xpPenalty || 0;
    combinedDebuffs.coinPenalty += scaledDebuffs.coinPenalty || 0;
    combinedDebuffs.priceIncrease += scaledDebuffs.priceIncrease || 0;
    combinedDebuffs.luckPenalty += scaledDebuffs.luckPenalty || 0;
  });

  return { buffs: combinedBuffs, debuffs: combinedDebuffs };
};

const PetSanctuary = () => {
  const { gamification, spinForPet, feedPet, playWithPet, equipPet, unequipPet, getFoodCost, getSpinCost, setActiveTab } = useApp();
  const { success, error } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryTab, setInventoryTab] = useState('pets'); // 'pets' or 'food'
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const petInventory = gamification.petInventory || [];
  const equippedPets = useMemo(() => {
    return (gamification.equippedPets || [])
      .map(id => petInventory.find(p => p.id === id))
      .filter(Boolean);
  }, [gamification.equippedPets, petInventory]);

  const combinedEffects = useMemo(() => getCombinedBuffs(equippedPets), [equippedPets]);

  const handleSpin = () => {
    if (isSpinning) return;
    const spinCost = getSpinCost ? getSpinCost() : SPIN_COST;
    if (gamification.coins < spinCost) {
      error(`You need ${spinCost} coins to spin.`);
      return;
    }
    setIsSpinning(true);
    setTimeout(() => {
      const result = spinForPet();
      if (result.success) {
        setLastReward(result.reward);
        const wasPityUsed = (gamification.pityCounter || 0) >= PITY_THRESHOLD;
        if (wasPityUsed) {
          success(`Pity system activated! Guaranteed rare+ pet! You got ${result.reward.name}!`);
        } else {
          success(`You got ${result.reward.name}! Check your inventory.`);
        }
        setInventoryTab('pets');
        setShowInventory(true);
      } else {
        error(result.message);
      }
      setIsSpinning(false);
    }, 1200);
  };

  const inventory = gamification.inventory || {};
  const hasFood = Object.keys(inventory).some(id => (inventory[id] || 0) > 0);

  const openFeedModal = (petId, foodId = null) => {
    if (!petId) {
      error('Please select a pet to feed.');
      return;
    }
    
    if (!hasFood) {
      setSelectedPetId(petId);
      setShowFeedModal(true);
      return;
    }

    const availableFood = FOOD_ITEMS.find(food => {
      const qty = inventory[food.id] || 0;
      return qty > 0;
    });

    const initialFoodId = foodId && (inventory[foodId] || 0) > 0 ? foodId : availableFood?.id;
    if (!initialFoodId) {
      setSelectedPetId(petId);
      setShowFeedModal(true);
      return;
    }

    setSelectedPetId(petId);
    setSelectedFoodId(initialFoodId);
    setSelectedQuantity(1);
    setShowFeedModal(true);
  };

  const handleConfirmFeed = () => {
    if (!selectedPetId || !selectedFoodId) return;
    const available = inventory[selectedFoodId] || 0;
    if (available <= 0) {
      error('You do not have this food in your inventory.');
      return;
    }
    const quantity = Math.max(1, Math.min(selectedQuantity || 1, available));
    const result = feedPet(selectedPetId, selectedFoodId, quantity);
    if (result.success) {
      success(result.message);
      setShowFeedModal(false);
      setSelectedPetId(null);
    } else {
      error(result.message);
    }
  };

  const handlePlay = (petId) => {
    if (!petId) {
      error('Please select a pet to play with.');
      return;
    }
    const pet = petInventory.find(p => p.id === petId);
    if (!pet) {
      error('Pet not found.');
      return;
    }
    const result = playWithPet(petId);
    result.success ? success(result.message) : error(result.message);
  };

  const handleEquipPet = (petId) => {
    if (equippedPets.length >= 3) {
      error('You can only equip up to 3 pets at a time.');
      return;
    }
    equipPet(petId);
    success('Pet equipped!');
  };

  const handleUnequipPet = (petId) => {
    unequipPet(petId);
    success('Pet unequipped!');
  };

  const currentTheme = gamification?.currentTheme || 'default';
  const themeColors = getThemeColors(currentTheme);

  return (
    <div className="space-y-6 animate-fade-in page-enter">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PawPrint className="icon-theme" size={28} />
            Pet Sanctuary
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Collect adorable study buddies and keep them happy! Equip up to 3 pets for combined effects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setInventoryTab('pets');
              setShowInventory(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/80 shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            title="View Inventory"
          >
            <Backpack className="icon-theme" size={20} />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Inventory
              {(petInventory.length > 0 || hasFood) && (
                <span 
                  className="ml-2 px-2 py-0.5 text-white rounded-full text-xs"
                  style={{ backgroundColor: 'var(--theme-icon-color)' }}
                >
                  {petInventory.length + (hasFood ? Object.values(inventory).reduce((sum, qty) => sum + qty, 0) : 0)}
                </span>
              )}
            </span>
          </button>
          <div 
            className="flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-gray-800/80 px-4 py-2 shadow"
            style={{
              border: '1px solid',
              borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.2)',
            }}
          >
            <Coins className="text-yellow-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {gamification.coins} Coins
            </span>
          </div>
        </div>
      </div>

      {/* Equipped Pets Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="icon-theme" size={20} />
            Equipped Pets ({equippedPets.length}/3)
          </h3>
          {equippedPets.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Equip pets from your inventory to activate their effects
            </p>
          )}
        </div>

        {equippedPets.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            <PawPrint className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No pets equipped</p>
            <button
              onClick={() => setShowInventory(true)}
              className="btn-primary inline-flex items-center gap-2 mt-4"
            >
              <Plus size={18} />
              Equip Pets
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => {
              const pet = equippedPets[index];
              if (!pet) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px]"
                  >
                    <Plus className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Empty Slot</p>
                    <button
                      onClick={() => setShowInventory(true)}
                      className="btn-secondary mt-2 text-xs"
                    >
                      Equip Pet
                    </button>
                  </div>
                );
              }

              const rarityStyle = rarityStyles[pet.rarity] || rarityStyles.Common;
              return (
                <div
                  key={pet.id}
                  className="card p-4 border-2"
                  style={{
                    borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center text-2xl">
                        {pet.species || '🐾'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{pet.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rarityStyle}`}>
                          {pet.rarity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnequipPet(pet.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Unequip"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Level</p>
                      <p className="font-bold icon-theme">{pet.level || 1}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-gray-500 dark:text-gray-400">Mood</p>
                      <p className="font-semibold icon-theme text-xs">{pet.mood}</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Energy</span>
                      <span className="font-medium">{pet.energy || 70}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pet.energy || 70}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Hunger</span>
                      <span className="font-medium">{pet.hunger || 30}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pet.hunger || 30}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openFeedModal(pet.id)}
                      disabled={!hasFood}
                      className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
                      title={!hasFood ? 'Buy food from shop first!' : 'Feed pet'}
                    >
                      <Bone size={14} />
                      <span>Feed</span>
                    </button>
                    <button
                      onClick={() => handlePlay(pet.id)}
                      disabled={(pet.energy || 0) <= 0}
                      className="btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
                      title={(pet.energy || 0) <= 0 ? 'No energy' : 'Play with pet'}
                    >
                      <Heart size={14} />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Combined Effects */}
        {(combinedEffects.buffs && Object.keys(combinedEffects.buffs).some(k => combinedEffects.buffs[k] > 0)) ||
         (combinedEffects.debuffs && Object.keys(combinedEffects.debuffs).some(k => combinedEffects.debuffs[k] > 0)) ? (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Combined Effects from Equipped Pets
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {combinedEffects.buffs.xpBoost > 0 && (
                <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                    <TrendingUp size={12} />
                    <span className="font-medium">XP Boost</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">+{combinedEffects.buffs.xpBoost}%</span>
                </div>
              )}
              {combinedEffects.buffs.coinBoost > 0 && (
                <div className="flex items-center justify-between text-xs bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                    <DollarSign size={12} />
                    <span className="font-medium">Coin Boost</span>
                  </div>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{combinedEffects.buffs.coinBoost}%</span>
                </div>
              )}
              {combinedEffects.buffs.discount > 0 && (
                <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                    <Percent size={12} />
                    <span className="font-medium">Discount</span>
                  </div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">-{combinedEffects.buffs.discount}%</span>
                </div>
              )}
              {combinedEffects.buffs.luckBoost > 0 && (
                <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-purple-700 dark:text-purple-400">
                    <Star size={12} />
                    <span className="font-medium">Luck Boost</span>
                  </div>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">+{combinedEffects.buffs.luckBoost}%</span>
                </div>
              )}
              {combinedEffects.debuffs.xpPenalty > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">XP Penalty</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{combinedEffects.debuffs.xpPenalty}%</span>
                </div>
              )}
              {combinedEffects.debuffs.coinPenalty > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">Coin Penalty</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{combinedEffects.debuffs.coinPenalty}%</span>
                </div>
              )}
              {combinedEffects.debuffs.priceIncrease > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">Price Increase</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">+{combinedEffects.debuffs.priceIncrease}%</span>
                </div>
              )}
              {combinedEffects.debuffs.luckPenalty > 0 && (
                <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <TrendingDown size={12} />
                    <span className="font-medium">Luck Penalty</span>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">-{combinedEffects.debuffs.luckPenalty}%</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spin Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pet Gacha</p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Lucky Spin
                <Sparkles className="icon-theme" size={20} />
              </h3>
            </div>
          </div>

          <div 
            className="h-40 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--theme-color-from, rgb(14, 165, 233)) 0%, var(--theme-color-via, rgb(14, 165, 233)) 50%, var(--theme-color-to, rgb(3, 105, 161)) 100%)`
            }}
          >
            <div className={`text-7xl ${isSpinning ? 'animate-spin-slow' : 'animate-bounce-subtle'}`}>
              {isSpinning ? '🎁' : (equippedPets[0]?.species || '🐾')}
            </div>
            <div className="absolute inset-0 bg-white/10 animate-pulse-slow" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</p>
              <p className="font-semibold text-yellow-600 dark:text-yellow-300">
                {getSpinCost ? getSpinCost() : SPIN_COST} coins
                {getSpinCost && getSpinCost() !== SPIN_COST && (
                  <span className="text-xs text-gray-400 ml-1 line-through">{SPIN_COST}</span>
                )}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pity Counter</p>
              <p className="font-semibold text-purple-600 dark:text-purple-400">
                {(gamification.pityCounter || 0)}/{PITY_THRESHOLD}
                {(gamification.pityCounter || 0) >= PITY_THRESHOLD && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✨</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning || gamification.coins < (getSpinCost ? getSpinCost() : SPIN_COST)}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSpinning ? (
              <>
                <RefreshCcw className="animate-spin" size={18} />
                Spinning...
              </>
            ) : (
              <>
                <Gift size={18} />
                Spin for new pet
              </>
            )}
          </button>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Rarity Chances</p>
            <div className="grid grid-cols-2 gap-2">
              {rarityChances.map((rarity) => (
                <div 
                  key={rarity.rarity} 
                  className="flex items-center justify-between text-xs bg-white dark:bg-gray-900 px-3 py-2 rounded-lg"
                >
                  <span className={`${rarity.color} font-semibold`}>{rarity.rarity}</span>
                  <span className="text-gray-500 dark:text-gray-400">{rarity.chance}%</span>
                </div>
              ))}
            </div>
          </div>

          {lastReward && (
            <div className="rounded-xl border border-dashed p-3 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
              <Wand2 size={16} className="icon-theme" />
              <span>Recently adopted <span className="font-semibold">{lastReward.name}</span> ({lastReward.rarity})</span>
            </div>
          )}
        </div>

        {/* Quick Stats Card */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="icon-theme" size={20} />
            Collection Stats
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Pets</span>
              <span className="text-lg font-bold icon-theme">{petInventory.length}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Equipped</span>
              <span className="text-lg font-bold icon-theme">{equippedPets.length}/3</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['Common', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Secret'].map(rarity => {
                const count = petInventory.filter(p => p.rarity === rarity).length;
                if (count === 0) return null;
                return (
                  <div key={rarity} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${rarityStyles[rarity] || ''}`}>{rarity}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Backpack className="icon-theme" size={28} />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h3>
              </div>
              <button
                onClick={() => setShowInventory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 transform hover:rotate-90 hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setInventoryTab('pets')}
                className={`px-4 py-2 font-semibold text-sm transition-colors relative ${
                  inventoryTab === 'pets'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <PawPrint size={18} />
                  Pets ({petInventory.length})
                </span>
                {inventoryTab === 'pets' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                )}
              </button>
              <button
                onClick={() => setInventoryTab('food')}
                className={`px-4 py-2 font-semibold text-sm transition-colors relative ${
                  inventoryTab === 'food'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bone size={18} />
                  Food ({Object.values(inventory).reduce((sum, qty) => sum + qty, 0)})
                </span>
                {inventoryTab === 'food' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                )}
              </button>
            </div>

            {/* Pets Section */}
            {inventoryTab === 'pets' && (
              <>
                {petInventory.length === 0 ? (
                  <div className="text-center py-12">
                    <PawPrint className="text-gray-400 mx-auto mb-4" size={64} />
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Your pet inventory is empty
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Spin for pets to start your collection!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {petInventory.map((pet) => {
                      const isEquipped = equippedPets.some(ep => ep.id === pet.id);
                      const rarityStyle = rarityStyles[pet.rarity] || rarityStyles.Common;
                      
                      return (
                        <div
                          key={pet.id}
                          className={`card p-4 border-2 transition-all ${
                            isEquipped 
                              ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center text-xl">
                                {pet.species || '🐾'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{pet.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rarityStyle}`}>
                                  {pet.rarity}
                                </span>
                              </div>
                            </div>
                            {isEquipped && (
                              <Check className="text-green-600 dark:text-green-400" size={18} />
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <p className="text-gray-500 dark:text-gray-400">Level</p>
                              <p className="font-bold">{pet.level || 1}</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <p className="text-gray-500 dark:text-gray-400">Mood</p>
                              <p className="font-semibold text-xs">{pet.mood}</p>
                            </div>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 dark:text-gray-400">Energy</span>
                              <span className="font-medium">{pet.energy || 70}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                              <div
                                className="bg-green-500 h-1 rounded-full"
                                style={{ width: `${pet.energy || 70}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            {isEquipped ? (
                              <button
                                onClick={() => handleUnequipPet(pet.id)}
                                className="btn-secondary flex-1 text-xs py-1.5"
                              >
                                Unequip
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEquipPet(pet.id)}
                                disabled={equippedPets.length >= 3}
                                className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {equippedPets.length >= 3 ? 'Full' : 'Equip'}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowInventory(false);
                                openFeedModal(pet.id);
                              }}
                              disabled={!hasFood}
                              className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
                              title={!hasFood ? 'Buy food first' : 'Feed'}
                            >
                              <Bone size={14} />
                              <span>Feed</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowInventory(false);
                                handlePlay(pet.id);
                              }}
                              disabled={(pet.energy || 0) <= 0}
                              className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
                              title={(pet.energy || 0) <= 0 ? 'No energy' : 'Play'}
                            >
                              <Heart size={14} />
                              <span>Play</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Food Section */}
            {inventoryTab === 'food' && (
              <>
                {hasFood ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your food inventory ({Object.values(inventory).reduce((sum, qty) => sum + qty, 0)} items)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {FOOD_ITEMS.map((food) => {
                        const qty = inventory[food.id] || 0;
                        if (qty <= 0) return null;
                        return (
                          <div
                            key={food.id}
                            className="card p-4 border-2 transition-all duration-200"
                            style={{
                              borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="text-3xl">{food.icon}</div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{food.name}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{food.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold" style={{ color: 'var(--theme-icon-color, rgb(14, 165, 233))' }}>
                                  {qty}x
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <div className="flex items-center justify-between">
                                <span>Hunger Reduction:</span>
                                <span className="font-medium text-orange-600 dark:text-orange-400">-{food.hungerReduction}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Energy Boost:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">+{food.energyBoost}%</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setInventoryTab('pets');
                              }}
                              className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                              <Bone size={16} />
                              Select Pet to Feed
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bone className="text-gray-400 mx-auto mb-4" size={64} />
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Your food inventory is empty
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Buy food from the shop to add items to your inventory
                    </p>
                    <button
                      onClick={() => {
                        setShowInventory(false);
                        sessionStorage.setItem('showFoodTab', 'true');
                        setActiveTab('shop');
                      }}
                      className="btn-primary flex items-center gap-2 mx-auto"
                    >
                      <ShoppingCart size={18} />
                      Go to Shop
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Feed Modal */}
      {showFeedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bone className="icon-theme" size={22} />
                Feed Pet
              </h3>
              <button
                onClick={() => setShowFeedModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 transform hover:rotate-90 hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>

            {!hasFood ? (
              <div className="text-center py-8">
                <Bone className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  No food available
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                  You need to buy food from the shop to feed your pet.
                </p>
                <button
                  onClick={() => {
                    setShowFeedModal(false);
                    sessionStorage.setItem('showFoodTab', 'true');
                    setActiveTab('shop');
                  }}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <ShoppingCart size={18} />
                  Go to Shop
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Choose food</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FOOD_ITEMS.map((food) => {
                      const qty = inventory[food.id] || 0;
                      if (qty <= 0) return null;
                      const isSelected = selectedFoodId === food.id;
                      return (
                        <button
                          key={food.id}
                          onClick={() => {
                            setSelectedFoodId(food.id);
                            setSelectedQuantity(1);
                          }}
                          className={`text-left border rounded-xl p-3 flex flex-col gap-1 transition-all duration-200 ${
                            isSelected
                              ? 'bg-gray-50 dark:bg-gray-800/60'
                              : 'bg-gray-50 dark:bg-gray-800/60'
                          }`}
                          style={{
                            borderColor: isSelected 
                              ? 'var(--theme-icon-color, rgb(14, 165, 233))' 
                              : 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)',
                            borderWidth: isSelected ? '2px' : '1px',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{food.icon}</span>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {food.name}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {food.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            <span>Owned: <span className="font-semibold text-gray-800 dark:text-gray-200">{qty}</span></span>
                            <span>
                              -{food.hungerReduction}% Hunger • +{food.energyBoost}% Energy
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedFoodId && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Choose quantity
                      </p>
                      {(() => {
                        const maxQty = inventory[selectedFoodId] || 0;
                        const clampedQuantity = Math.max(1, Math.min(selectedQuantity || 1, maxQty));
                        if (clampedQuantity !== selectedQuantity) {
                          setSelectedQuantity(clampedQuantity);
                        }
                        const food = FOOD_ITEMS.find(f => f.id === selectedFoodId) || FOOD_ITEMS[0];
                        const totalHunger = food.hungerReduction * clampedQuantity;
                        const totalEnergy = food.energyBoost * clampedQuantity;
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="1"
                                max={maxQty}
                                value={clampedQuantity}
                                onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
                                className="flex-1"
                              />
                              <input
                                type="number"
                                min="1"
                                max={maxQty}
                                value={clampedQuantity}
                                onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
                                className="input-field w-20 text-center"
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Feeding <span className="font-semibold text-gray-800 dark:text-gray-200">{clampedQuantity}</span>{' '}
                              time{clampedQuantity !== 1 ? 's' : ''} will reduce hunger by{' '}
                              <span className="font-semibold text-orange-500">-{totalHunger}%</span> and increase energy by{' '}
                              <span className="font-semibold text-green-500">+{totalEnergy}%</span> (before caps).
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleConfirmFeed}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Bone size={18} />
                        Feed Pet
                      </button>
                      <button
                        onClick={() => setShowFeedModal(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetSanctuary;

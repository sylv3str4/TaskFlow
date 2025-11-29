/**
 * Pet Sanctuary Component
 * Dedicated page for virtual pet collection and spins
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { FOOD_ITEMS } from './Shop';

const rarityStyles = {
  Common: 'text-gray-500 bg-gray-100 dark:bg-gray-800/60',
  Rare: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40',
  Epic: 'text-purple-500 bg-purple-100 dark:bg-purple-900/40',
  Legendary: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
};

const rarityChances = [
  { rarity: 'Legendary', chance: 5, color: 'text-yellow-500' },
  { rarity: 'Epic', chance: 18, color: 'text-purple-500' },
  { rarity: 'Rare', chance: 30, color: 'text-blue-500' },
  { rarity: 'Common', chance: 47, color: 'text-gray-500' },
];

const SPIN_COST = 25;
const PITY_THRESHOLD = 10;

const PetSanctuary = () => {
  const { gamification, spinForPet, feedPet, playWithPet, switchToNewPet, getFoodCost, getSpinCost, setActiveTab } = useApp();
  const { success, error } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [newPet, setNewPet] = useState(null);
  const [oldPet, setOldPet] = useState(null);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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
        setNewPet(result.reward);
        setOldPet(result.oldPet);
        setShowPetSelection(true);
        setLastReward(result.reward);
        // Check if pity was used (pity counter would have been reset if rare+ was obtained)
        const wasPityUsed = (gamification.pityCounter || 0) >= PITY_THRESHOLD;
        if (wasPityUsed) {
          success(`Pity system activated! Guaranteed rare+ pet!`);
        } else {
          success(`You got ${result.reward.name}! Choose to keep or switch.`);
        }
      } else {
        error(result.message);
      }
      setIsSpinning(false);
    }, 1200);
  };
  
  const handleKeepOldPet = () => {
    setShowPetSelection(false);
    setNewPet(null);
    setOldPet(null);
    success('Kept your current pet!');
  };
  
  const handleSwitchToNewPet = () => {
    if (newPet) {
      switchToNewPet(newPet);
      setShowPetSelection(false);
      setNewPet(null);
      setOldPet(null);
      success(`Switched to ${newPet.name}!`);
    }
  };

  const inventory = gamification.inventory || {};
  const hasFood = Object.keys(inventory).some(id => (inventory[id] || 0) > 0);

  const openFeedModal = (foodId = null) => {
    if (!hasFood) {
      // Show feed modal with "go to shop" message instead of error
      setShowFeedModal(true);
      return;
    }

    const availableFood = FOOD_ITEMS.find(food => {
      const qty = inventory[food.id] || 0;
      return qty > 0;
    });

    const initialFoodId = foodId && (inventory[foodId] || 0) > 0 ? foodId : availableFood?.id;
    if (!initialFoodId) {
      // Show feed modal with "go to shop" message instead of error
      setShowFeedModal(true);
      return;
    }

    setSelectedFoodId(initialFoodId);
    setSelectedQuantity(1);
    setShowFeedModal(true);
  };

  const handleConfirmFeed = () => {
    if (!selectedFoodId) return;
    const available = inventory[selectedFoodId] || 0;
    if (available <= 0) {
      error('You do not have this food in your inventory.');
      return;
    }
    const quantity = Math.max(1, Math.min(selectedQuantity || 1, available));
    const result = feedPet(selectedFoodId, quantity);
    if (result.success) {
      success(result.message);
      setShowFeedModal(false);
    } else {
      error(result.message);
    }
  };

  const handlePlay = () => {
    const result = playWithPet();
    result.success ? success(result.message) : error(result.message);
  };

  const currentPet = gamification.pet;
  const rarityStyle = rarityStyles[currentPet.rarity] || rarityStyles.Common;
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
            Collect adorable study buddies and keep them happy!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBackpack(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/80 shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            title="View Inventory"
          >
            <Backpack className="icon-theme" size={20} />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Backpack
              {hasFood && (
                <span 
                  className="ml-2 px-2 py-0.5 text-white rounded-full text-xs"
                  style={{ backgroundColor: 'var(--theme-icon-color)' }}
                >
                  {Object.values(inventory).reduce((sum, qty) => sum + qty, 0)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Pet Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Companion</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentPet.name}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rarityStyle}`}>
                  {currentPet.rarity}
                </span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-3xl animate-bounce-subtle">
              {currentPet.species || '🐾'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Level</p>
              <p className="text-2xl font-bold icon-theme">{currentPet.level || 1}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mood</p>
              <p className="text-lg font-semibold icon-theme">{currentPet.mood}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 dark:text-gray-400">Experience</span>
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {currentPet.exp || 0} / {currentPet.expForNextLevel || 50}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, ((currentPet.exp || 0) / (currentPet.expForNextLevel || 50)) * 100)}%`,
                  background: `linear-gradient(to right, var(--theme-progress-from), var(--theme-progress-via), var(--theme-progress-to))`
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">Energy</span>
                <span className="text-gray-600 dark:text-gray-300 font-medium">{currentPet.energy}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentPet.energy}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">Hunger</span>
                <span className="text-gray-600 dark:text-gray-300 font-medium">{currentPet.hunger}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentPet.hunger}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => openFeedModal()}
              disabled={!hasFood}
              className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
                !hasFood ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!hasFood ? 'Buy food from the shop first!' : 'Feed your pet'}
            >
              <Bone size={18} />
              Feed {hasFood && `(${Object.values(inventory).reduce((sum, qty) => sum + qty, 0)})`}
            </button>
            <button onClick={handlePlay} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Heart size={18} />
              Play
            </button>
          </div>

          {/* Buffs and Debuffs */}
          {((currentPet.buffs && Object.keys(currentPet.buffs).length > 0) || 
            (currentPet.debuffs && Object.keys(currentPet.debuffs).length > 0)) && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Pet Effects</p>
              <div className="space-y-2">
                {currentPet.buffs?.xpBoost && (
                  <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <TrendingUp size={14} />
                      <span className="font-medium">XP Boost</span>
                    </div>
                    <span className="font-semibold text-green-600 dark:text-green-400">+{currentPet.buffs.xpBoost}%</span>
                  </div>
                )}
                {currentPet.buffs?.coinBoost && (
                  <div className="flex items-center justify-between text-xs bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                      <DollarSign size={14} />
                      <span className="font-medium">Coin Boost</span>
                    </div>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{currentPet.buffs.coinBoost}%</span>
                  </div>
                )}
                {currentPet.buffs?.discount && (
                  <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Percent size={14} />
                      <span className="font-medium">Discount</span>
                    </div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">-{currentPet.buffs.discount}%</span>
                  </div>
                )}
                {currentPet.buffs?.luckBoost && (
                  <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <Star size={14} />
                      <span className="font-medium">Luck Boost</span>
                    </div>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">+{currentPet.buffs.luckBoost}%</span>
                  </div>
                )}
                {currentPet.debuffs?.xpPenalty && (
                  <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <TrendingDown size={14} />
                      <span className="font-medium">XP Penalty</span>
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">-{currentPet.debuffs.xpPenalty}%</span>
                  </div>
                )}
                {currentPet.debuffs?.coinPenalty && (
                  <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <TrendingDown size={14} />
                      <span className="font-medium">Coin Penalty</span>
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">-{currentPet.debuffs.coinPenalty}%</span>
                  </div>
                )}
                {currentPet.debuffs?.priceIncrease && (
                  <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <TrendingDown size={14} />
                      <span className="font-medium">Price Increase</span>
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">+{currentPet.debuffs.priceIncrease}%</span>
                  </div>
                )}
                {currentPet.debuffs?.luckPenalty && (
                  <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <TrendingDown size={14} />
                      <span className="font-medium">Luck Penalty</span>
                    </div>
                    <span className="font-semibold text-red-600 dark:text-red-400">-{currentPet.debuffs.luckPenalty}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
              {isSpinning ? '🎁' : currentPet.species || '🐾'}
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
      </div>

      {/* Pet Selection Modal */}
      {showPetSelection && newPet && oldPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Choose Your Pet!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Old Pet */}
              <div 
                className="card p-4 border-2"
                style={{
                  borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)'
                }}
              >
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{oldPet.species}</div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">{oldPet.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-block ${rarityStyles[oldPet.rarity] || rarityStyles.Common}`}>
                    {oldPet.rarity}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Current Pet</p>
                </div>
                
                {/* Old Pet Stats */}
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Effects</p>
                  
                  {/* Buffs */}
                  {oldPet.buffs && Object.keys(oldPet.buffs).length > 0 && (
                    <div className="space-y-1">
                      {oldPet.buffs.xpBoost && (
                        <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                          <span className="text-green-700 dark:text-green-400">XP Boost</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">+{oldPet.buffs.xpBoost}%</span>
                        </div>
                      )}
                      {oldPet.buffs.coinBoost && (
                        <div className="flex items-center justify-between text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                          <span className="text-yellow-700 dark:text-yellow-400">Coin Boost</span>
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{oldPet.buffs.coinBoost}%</span>
                        </div>
                      )}
                      {oldPet.buffs.discount && (
                        <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          <span className="text-blue-700 dark:text-blue-400">Discount</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">-{oldPet.buffs.discount}%</span>
                        </div>
                      )}
                      {oldPet.buffs.luckBoost && (
                        <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                          <span className="text-purple-700 dark:text-purple-400">Luck Boost</span>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">+{oldPet.buffs.luckBoost}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Debuffs */}
                  {oldPet.debuffs && Object.keys(oldPet.debuffs).length > 0 && (
                    <div className="space-y-1 mt-2">
                      {oldPet.debuffs.xpPenalty && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">XP Penalty</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">-{oldPet.debuffs.xpPenalty}%</span>
                        </div>
                      )}
                      {oldPet.debuffs.coinPenalty && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">Coin Penalty</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">-{oldPet.debuffs.coinPenalty}%</span>
                        </div>
                      )}
                      {oldPet.debuffs.priceIncrease && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">Price Increase</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">+{oldPet.debuffs.priceIncrease}%</span>
                        </div>
                      )}
                      {oldPet.debuffs.luckPenalty && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">Luck Penalty</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">-{oldPet.debuffs.luckPenalty}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(!oldPet.buffs || Object.keys(oldPet.buffs).length === 0) && 
                   (!oldPet.debuffs || Object.keys(oldPet.debuffs).length === 0) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">No effects</p>
                  )}
                </div>
              </div>
              
              {/* New Pet */}
              <div className="card p-4 border-2 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{newPet.species}</div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">{newPet.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-block ${rarityStyles[newPet.rarity] || rarityStyles.Common}`}>
                    {newPet.rarity}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">New Pet</p>
                </div>
                
                {/* New Pet Stats */}
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Effects</p>
                  
                  {/* Buffs */}
                  {newPet.buffs && Object.keys(newPet.buffs).length > 0 && (
                    <div className="space-y-1">
                      {newPet.buffs.xpBoost && (
                        <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                          <span className="text-green-700 dark:text-green-400">XP Boost</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">+{newPet.buffs.xpBoost}%</span>
                        </div>
                      )}
                      {newPet.buffs.coinBoost && (
                        <div className="flex items-center justify-between text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                          <span className="text-yellow-700 dark:text-yellow-400">Coin Boost</span>
                          <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{newPet.buffs.coinBoost}%</span>
                        </div>
                      )}
                      {newPet.buffs.discount && (
                        <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          <span className="text-blue-700 dark:text-blue-400">Discount</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">-{newPet.buffs.discount}%</span>
                        </div>
                      )}
                      {newPet.buffs.luckBoost && (
                        <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                          <span className="text-purple-700 dark:text-purple-400">Luck Boost</span>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">+{newPet.buffs.luckBoost}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Debuffs */}
                  {newPet.debuffs && Object.keys(newPet.debuffs).length > 0 && (
                    <div className="space-y-1 mt-2">
                      {newPet.debuffs.xpPenalty && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">XP Penalty</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">-{newPet.debuffs.xpPenalty}%</span>
                        </div>
                      )}
                      {newPet.debuffs.coinPenalty && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">Coin Penalty</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">-{newPet.debuffs.coinPenalty}%</span>
                        </div>
                      )}
                      {newPet.debuffs.priceIncrease && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">Price Increase</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">+{newPet.debuffs.priceIncrease}%</span>
                        </div>
                      )}
                      {newPet.debuffs.luckPenalty && (
                        <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          <span className="text-red-700 dark:text-red-400">Luck Penalty</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">-{newPet.debuffs.luckPenalty}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(!newPet.buffs || Object.keys(newPet.buffs).length === 0) && 
                   (!newPet.debuffs || Object.keys(newPet.debuffs).length === 0) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">No effects</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stat Comparison */}
            <div 
              className="card p-4 mb-6 bg-gray-50 dark:bg-gray-900/50"
              style={{
                borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.2)',
              }}
            >
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 text-center">Stat Comparison</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* XP Boost Comparison */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">XP Boost</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {oldPet.buffs?.xpBoost || 0}%
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={`text-sm font-bold ${
                      (newPet.buffs?.xpBoost || 0) > (oldPet.buffs?.xpBoost || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : (newPet.buffs?.xpBoost || 0) < (oldPet.buffs?.xpBoost || 0)
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {newPet.buffs?.xpBoost || 0}%
                    </span>
                  </div>
                  {(newPet.buffs?.xpBoost || 0) !== (oldPet.buffs?.xpBoost || 0) && (
                    <span className={`text-xs ${
                      (newPet.buffs?.xpBoost || 0) > (oldPet.buffs?.xpBoost || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {((newPet.buffs?.xpBoost || 0) - (oldPet.buffs?.xpBoost || 0)) > 0 ? '+' : ''}
                      {((newPet.buffs?.xpBoost || 0) - (oldPet.buffs?.xpBoost || 0))}%
                    </span>
                  )}
                </div>
                
                {/* Coin Boost Comparison */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coin Boost</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {oldPet.buffs?.coinBoost || 0}%
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={`text-sm font-bold ${
                      (newPet.buffs?.coinBoost || 0) > (oldPet.buffs?.coinBoost || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : (newPet.buffs?.coinBoost || 0) < (oldPet.buffs?.coinBoost || 0)
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {newPet.buffs?.coinBoost || 0}%
                    </span>
                  </div>
                  {(newPet.buffs?.coinBoost || 0) !== (oldPet.buffs?.coinBoost || 0) && (
                    <span className={`text-xs ${
                      (newPet.buffs?.coinBoost || 0) > (oldPet.buffs?.coinBoost || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {((newPet.buffs?.coinBoost || 0) - (oldPet.buffs?.coinBoost || 0)) > 0 ? '+' : ''}
                      {((newPet.buffs?.coinBoost || 0) - (oldPet.buffs?.coinBoost || 0))}%
                    </span>
                  )}
                </div>
                
                {/* Discount Comparison */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Discount</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {oldPet.buffs?.discount || 0}%
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={`text-sm font-bold ${
                      (newPet.buffs?.discount || 0) > (oldPet.buffs?.discount || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : (newPet.buffs?.discount || 0) < (oldPet.buffs?.discount || 0)
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {newPet.buffs?.discount || 0}%
                    </span>
                  </div>
                  {(newPet.buffs?.discount || 0) !== (oldPet.buffs?.discount || 0) && (
                    <span className={`text-xs ${
                      (newPet.buffs?.discount || 0) > (oldPet.buffs?.discount || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {((newPet.buffs?.discount || 0) - (oldPet.buffs?.discount || 0)) > 0 ? '+' : ''}
                      {((newPet.buffs?.discount || 0) - (oldPet.buffs?.discount || 0))}%
                    </span>
                  )}
                </div>
                
                {/* Luck Boost Comparison */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Luck Boost</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {oldPet.buffs?.luckBoost || 0}%
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={`text-sm font-bold ${
                      (newPet.buffs?.luckBoost || 0) > (oldPet.buffs?.luckBoost || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : (newPet.buffs?.luckBoost || 0) < (oldPet.buffs?.luckBoost || 0)
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {newPet.buffs?.luckBoost || 0}%
                    </span>
                  </div>
                  {(newPet.buffs?.luckBoost || 0) !== (oldPet.buffs?.luckBoost || 0) && (
                    <span className={`text-xs ${
                      (newPet.buffs?.luckBoost || 0) > (oldPet.buffs?.luckBoost || 0) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {((newPet.buffs?.luckBoost || 0) - (oldPet.buffs?.luckBoost || 0)) > 0 ? '+' : ''}
                      {((newPet.buffs?.luckBoost || 0) - (oldPet.buffs?.luckBoost || 0))}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleKeepOldPet}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                Keep Current Pet
              </button>
              <button
                onClick={handleSwitchToNewPet}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Switch to New Pet
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Backpack Modal */}
      {showBackpack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Backpack className="icon-theme" size={28} />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Backpack</h3>
              </div>
              <button
                onClick={() => setShowBackpack(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 transform hover:rotate-90 hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>
            
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--theme-icon-color, rgb(14, 165, 233))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)';
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
                            setShowBackpack(false);
                            openFeedModal(food.id);
                          }}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                          <Bone size={16} />
                          Feed Pet
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Backpack className="text-gray-400 mx-auto mb-4" size={64} />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Your backpack is empty
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                  Buy food from the shop to add items to your inventory
                </p>
                <button
                  onClick={() => {
                    setShowBackpack(false);
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
                Feed {currentPet.name}
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
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--theme-icon-color, rgb(14, 165, 233))';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)';
                            }
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
                          // keep state in sync
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
                        Feed {currentPet.name}
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


/**
 * Pet Sanctuary Component
 * Dedicated page for virtual pet collection and spins
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
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
  Apple,
  Cookie,
  Cherry,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Percent,
  Star,
} from 'lucide-react';

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

const FOOD_ITEMS = [
  {
    id: 'basic',
    name: 'Basic Meal',
    icon: '🍎',
    cost: 5,
    hungerReduction: 25,
    energyBoost: 12,
    mood: 'Content',
    description: 'A simple, nutritious meal',
  },
  {
    id: 'premium',
    name: 'Premium Feast',
    icon: '🍖',
    cost: 15,
    hungerReduction: 50,
    energyBoost: 25,
    mood: 'Happy',
    description: 'A delicious feast that fills your pet',
  },
  {
    id: 'treat',
    name: 'Special Treat',
    icon: '🍪',
    cost: 10,
    hungerReduction: 15,
    energyBoost: 20,
    mood: 'Excited',
    description: 'A special treat that boosts energy',
  },
  {
    id: 'super',
    name: 'Super Snack',
    icon: '🍒',
    cost: 20,
    hungerReduction: 40,
    energyBoost: 35,
    mood: 'Ecstatic',
    description: 'The ultimate snack for your pet',
  },
];

const PetSanctuary = () => {
  const { gamification, spinForPet, feedPet, playWithPet, buyFood, getFoodCost, getSpinCost } = useApp();
  const { success, error } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);

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
        success(`You adopted ${result.reward.name}!`);
        setLastReward(result.reward);
      } else {
        error(result.message);
      }
      setIsSpinning(false);
    }, 1200);
  };

  const handleFeed = () => {
    const result = feedPet();
    result.success ? success(result.message) : error(result.message);
  };

  const handlePlay = () => {
    const result = playWithPet();
    result.success ? success(result.message) : error(result.message);
  };

  const handleBuyFood = (foodItem) => {
    const result = buyFood(foodItem);
    result.success ? success(result.message) : error(result.message);
  };

  const currentPet = gamification.pet;
  const rarityStyle = rarityStyles[currentPet.rarity] || rarityStyles.Common;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PawPrint className="text-primary-500" size={28} />
            Pet Sanctuary
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Collect adorable study buddies and keep them happy!
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-gray-800/80 px-4 py-2 shadow">
          <Coins className="text-yellow-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {gamification.coins} Coins
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Pet Card */}
        <div className="card space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-4">
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mood: <span className="font-medium text-primary-600 dark:text-primary-300">{currentPet.mood}</span>
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Energy</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentPet.energy}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hunger</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentPet.hunger}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleFeed} className="btn-secondary flex-1 flex items-center justify-center gap-2 ripple">
                <Bone size={18} />
                Feed
              </button>
              <button onClick={handlePlay} className="btn-primary flex-1 flex items-center justify-center gap-2 ripple">
                <Heart size={18} />
                Play
              </button>
            </div>
            
            {/* Buffs and Debuffs */}
            {(currentPet.buffs && Object.keys(currentPet.buffs).length > 0) || 
             (currentPet.debuffs && Object.keys(currentPet.debuffs).length > 0) ? (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pet Effects</p>
                
                {/* Buffs */}
                {currentPet.buffs && Object.keys(currentPet.buffs).length > 0 && (
                  <div className="space-y-2">
                    {currentPet.buffs.xpBoost && (
                      <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <TrendingUp size={14} />
                          <span className="font-medium">XP Boost</span>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">+{currentPet.buffs.xpBoost}%</span>
                      </div>
                    )}
                    {currentPet.buffs.coinBoost && (
                      <div className="flex items-center justify-between text-xs bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                          <DollarSign size={14} />
                          <span className="font-medium">Coin Boost</span>
                        </div>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{currentPet.buffs.coinBoost}%</span>
                      </div>
                    )}
                    {currentPet.buffs.discount && (
                      <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <Percent size={14} />
                          <span className="font-medium">Discount</span>
                        </div>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">-{currentPet.buffs.discount}%</span>
                      </div>
                    )}
                    {currentPet.buffs.luckBoost && (
                      <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                          <Star size={14} />
                          <span className="font-medium">Luck Boost</span>
                        </div>
                        <span className="font-semibold text-purple-600 dark:text-purple-400">+{currentPet.buffs.luckBoost}%</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Debuffs */}
                {currentPet.debuffs && Object.keys(currentPet.debuffs).length > 0 && (
                  <div className="space-y-2">
                    {currentPet.debuffs.xpPenalty && (
                      <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                          <TrendingDown size={14} />
                          <span className="font-medium">XP Penalty</span>
                        </div>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{currentPet.debuffs.xpPenalty}%</span>
                      </div>
                    )}
                    {currentPet.debuffs.coinPenalty && (
                      <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                          <TrendingDown size={14} />
                          <span className="font-medium">Coin Penalty</span>
                        </div>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{currentPet.debuffs.coinPenalty}%</span>
                      </div>
                    )}
                    {currentPet.debuffs.priceIncrease && (
                      <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                          <TrendingDown size={14} />
                          <span className="font-medium">Price Increase</span>
                        </div>
                        <span className="font-semibold text-red-600 dark:text-red-400">+{currentPet.debuffs.priceIncrease}%</span>
                      </div>
                    )}
                    {currentPet.debuffs.luckPenalty && (
                      <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                          <TrendingDown size={14} />
                          <span className="font-medium">Luck Penalty</span>
                        </div>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{currentPet.debuffs.luckPenalty}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Spin Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pet Gacha</p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Lucky Spin
                <Sparkles className="text-yellow-400" size={20} />
              </h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Cost: <span className="font-semibold text-yellow-600 dark:text-yellow-300">
                {getSpinCost ? getSpinCost() : SPIN_COST} coins
                {getSpinCost && getSpinCost() !== SPIN_COST && (
                  <span className="text-xs text-gray-400 ml-1 line-through">{SPIN_COST}</span>
                )}
              </span>
            </div>
          </div>
          <div className="h-36 rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 flex items-center justify-center relative overflow-hidden">
            <div className={`text-6xl ${isSpinning ? 'animate-spin-slow' : 'animate-bounce-subtle'}`}>
              {isSpinning ? '🎁' : currentPet.species || '🐾'}
            </div>
            <div className="absolute inset-0 bg-white/10 animate-pulse-slow" />
          </div>
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="btn-primary w-full flex items-center justify-center gap-2 ripple disabled:opacity-60 disabled:cursor-not-allowed"
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
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Rarity chances</p>
            <div className="grid grid-cols-2 gap-2">
              {rarityChances.map((rarity) => (
                <div key={rarity.rarity} className="flex items-center justify-between text-xs bg-white dark:bg-gray-900 px-3 py-2 rounded-xl shadow-sm">
                  <span className={`${rarity.color} font-semibold`}>{rarity.rarity}</span>
                  <span className="text-gray-500 dark:text-gray-400">{rarity.chance}%</span>
                </div>
              ))}
            </div>
          </div>
          {lastReward && (
            <div className="rounded-2xl border border-dashed border-primary-300 dark:border-primary-600 p-3 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Wand2 size={16} className="text-primary-500" />
              Recently adopted {lastReward.name} ({lastReward.rarity})
            </div>
          )}
        </div>
      </div>

      {/* Food Shop */}
      <div className="card space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-primary-500" size={24} />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Food Shop</h3>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Keep your pet well-fed and happy!
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FOOD_ITEMS.map((food) => (
            <div
              key={food.id}
              className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <div className="text-center space-y-3">
                <div className="text-4xl mb-2">{food.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{food.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{food.description}</p>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Hunger:</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">-{food.hungerReduction}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Energy:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">+{food.energyBoost}%</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyFood(food)}
                  disabled={gamification.coins < (getFoodCost ? getFoodCost(food.cost) : food.cost)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    gamification.coins >= (getFoodCost ? getFoodCost(food.cost) : food.cost)
                      ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Coins size={16} />
                    <span>
                      {getFoodCost ? getFoodCost(food.cost) : food.cost} Coins
                      {getFoodCost && getFoodCost(food.cost) !== food.cost && (
                        <span className="text-xs opacity-75 ml-1 line-through">{food.cost}</span>
                      )}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PetSanctuary;


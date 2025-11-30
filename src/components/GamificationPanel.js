/**
 * GamificationPanel Component
 * Displays level, currency, and virtual pet interactions
 */

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Coins, PawPrint, TrendingUp, DollarSign, Percent, Star } from 'lucide-react';

const rarityBadgeStyles = {
  Common: 'text-gray-500 bg-gray-100 dark:bg-gray-800/60',
  Rare: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40',
  Epic: 'text-purple-500 bg-purple-100 dark:bg-purple-900/40',
  Legendary: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  Mythical: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30',
  Secret: 'text-gray-900 dark:text-gray-100 bg-gray-800 dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-500',
};

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
    
    combinedDebuffs.xpPenalty += scaledDebuffs.xpPenalty || 0;
    combinedDebuffs.coinPenalty += scaledDebuffs.coinPenalty || 0;
    combinedDebuffs.priceIncrease += scaledDebuffs.priceIncrease || 0;
    combinedDebuffs.luckPenalty += scaledDebuffs.luckPenalty || 0;
  });

  return { buffs: combinedBuffs, debuffs: combinedDebuffs };
};

const GamificationPanel = () => {
  const { gamification, setActiveTab } = useApp();

  const petInventory = gamification.petInventory || [];
  const equippedPets = useMemo(() => {
    return (gamification.equippedPets || [])
      .map(id => petInventory.find(p => p.id === id))
      .filter(Boolean);
  }, [gamification.equippedPets, petInventory]);

  const firstEquippedPet = equippedPets[0];
  const combinedEffects = useMemo(() => getCombinedBuffs(equippedPets), [equippedPets]);

  const xpRange = gamification.xpForNextLevel - gamification.xpForCurrentLevel;
  const xpProgress = xpRange > 0 ? ((gamification.xp - gamification.xpForCurrentLevel) / xpRange) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Level & Currency */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent pointer-events-none animate-shimmer" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Level</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold">
                  <Trophy size={18} />
                  Level {gamification.level}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.floor(xpProgress)}% to next level
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/40 rounded-full text-yellow-700 dark:text-yellow-200">
              <Coins size={18} />
              <span className="font-semibold">{gamification.coins}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min(100, xpProgress)}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {gamification.xp - gamification.xpForCurrentLevel} XP / {gamification.xpForNextLevel - gamification.xpForCurrentLevel} XP
          </p>
        </div>
      </div>

      {/* Pet Panel */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {equippedPets.length > 0 ? `Equipped Pets (${equippedPets.length}/3)` : 'No Pets Equipped'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('pets')}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Manage
          </button>
        </div>

        {firstEquippedPet ? (
          <>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl animate-bounce-subtle shadow-inner"
                style={{ background: `${firstEquippedPet.color || '#0ea5e9'}20` }}
              >
                {firstEquippedPet.species || '🐾'}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{firstEquippedPet.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rarityBadgeStyles[firstEquippedPet.rarity] || rarityBadgeStyles.Common}`}>
                    {firstEquippedPet.rarity}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Energy</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${firstEquippedPet.energy || 70}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hunger</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${firstEquippedPet.hunger || 30}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {equippedPets.length > 1 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                +{equippedPets.length - 1} more pet{equippedPets.length - 1 > 1 ? 's' : ''} equipped
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <PawPrint className="mx-auto mb-2" size={32} />
            <p className="text-sm">No pets equipped</p>
            <button
              onClick={() => setActiveTab('pets')}
              className="btn-primary mt-3 text-xs"
            >
              Equip Pets
            </button>
          </div>
        )}

        {/* Combined Effects */}
        {equippedPets.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Combined Effects
            </p>
            <div className="grid grid-cols-2 gap-2">
              {combinedEffects.buffs.xpBoost > 0 && (
                <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  <div className="flex items-center gap-1 text-green-700 dark:text-green-400">
                    <TrendingUp size={10} />
                    <span>XP</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">+{combinedEffects.buffs.xpBoost}%</span>
                </div>
              )}
              {combinedEffects.buffs.coinBoost > 0 && (
                <div className="flex items-center justify-between text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                  <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                    <DollarSign size={10} />
                    <span>Coins</span>
                  </div>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">+{combinedEffects.buffs.coinBoost}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamificationPanel;


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

const PetSanctuary = () => {
  const { gamification, spinForPet, feedPet, playWithPet } = useApp();
  const { success, error } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastReward, setLastReward] = useState(null);

  const handleSpin = () => {
    if (isSpinning) return;
    if (gamification.coins < SPIN_COST) {
      error(`You need ${SPIN_COST} coins to spin.`);
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
              Cost: <span className="font-semibold text-yellow-600 dark:text-yellow-300">{SPIN_COST} coins</span>
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
    </div>
  );
};

export default PetSanctuary;


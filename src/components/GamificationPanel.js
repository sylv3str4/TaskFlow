/**
 * GamificationPanel Component
 * Displays level, currency, and virtual pet interactions
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Trophy, Coins, PawPrint, Bone, Wand2, Star } from 'lucide-react';

const rarityBadgeStyles = {
  Common: 'text-gray-500 bg-gray-100 dark:bg-gray-800/60',
  Rare: 'text-blue-500 bg-blue-100 dark:bg-blue-900/40',
  Epic: 'text-purple-500 bg-purple-100 dark:bg-purple-900/40',
  Legendary: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
};

const GamificationPanel = () => {
  const { gamification, feedPet, playWithPet, renamePet } = useApp();
  const { success, error } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);
  const [petNameInput, setPetNameInput] = useState(gamification.pet.name);

  useEffect(() => {
    setPetNameInput(gamification.pet.name);
  }, [gamification.pet.name]);

  const xpRange = gamification.xpForNextLevel - gamification.xpForCurrentLevel;
  const xpProgress = xpRange > 0 ? ((gamification.xp - gamification.xpForCurrentLevel) / xpRange) * 100 : 0;

  const handleFeed = () => {
    const result = feedPet();
    result.success ? success(result.message) : error(result.message);
  };

  const handlePlay = () => {
    const result = playWithPet();
    result.success ? success(result.message) : error(result.message);
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (!petNameInput.trim()) {
      error('Pet name cannot be empty');
      return;
    }
    renamePet(petNameInput.trim());
    success('Pet renamed!');
    setIsRenaming(false);
  };

  const moodColor = gamification.pet.energy > 70 ? 'text-green-500' : gamification.pet.energy > 40 ? 'text-yellow-500' : 'text-red-500';

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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <PawPrint className="text-primary-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {gamification.pet.name}
                </h3>
                <span className={`text-xs font-medium ${moodColor}`}>
                  {gamification.pet.mood}
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rarityBadgeStyles[gamification.pet.rarity] || rarityBadgeStyles.Common}`}>
                {gamification.pet.rarity}
              </span>
            </div>
          <button
            onClick={() => setIsRenaming(!isRenaming)}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            {isRenaming ? 'Cancel' : 'Rename'}
          </button>
        </div>
        {isRenaming && (
          <form onSubmit={handleRename} className="flex gap-2">
            <input
              type="text"
              value={petNameInput}
              onChange={(e) => setPetNameInput(e.target.value)}
              className="input-field"
              placeholder="Pet name"
            />
            <button type="submit" className="btn-primary">
              Save
            </button>
          </form>
        )}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl animate-bounce-subtle shadow-inner"
            style={{ background: `${gamification.pet.color || '#0ea5e9'}20` }}
          >
            {gamification.pet.species || '🐾'}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Energy</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${gamification.pet.energy}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hunger</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${gamification.pet.hunger}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleFeed} className="btn-secondary flex-1 flex items-center justify-center gap-2 ripple">
            <Bone size={16} />
            Feed (-5 coins)
          </button>
          <button onClick={handlePlay} className="btn-primary flex-1 flex items-center justify-center gap-2 ripple">
            <Wand2 size={16} />
            Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamificationPanel;


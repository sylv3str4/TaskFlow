/**
 * Dev Panel Component
 * Testing tools for development accounts
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Code,
  X,
  RotateCcw,
  Star,
  Target,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { generateDailyQuests, generateWeeklyQuests } from '../context/AppContext';
import { saveGamification, saveQuests } from '../utils/storage';

const DevPanel = () => {
  const { user } = useAuth();
  const {
    quests,
    gamification,
    tasks,
    studyLogs,
    addXP,
    checkQuestProgress,
    resetDailyQuests,
    resetWeeklyQuests,
  } = useApp();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [xpAmount, setXpAmount] = useState(100);
  const [coinAmount, setCoinAmount] = useState(50);

  const isDevAccount = () => {
    if (!user?.email) return false;
    const email = user.email.toLowerCase();
    return email.includes('dev') || email.includes('test') || email === 'dev@test.com' || email === 'admin@test.com';
  };

  if (!isDevAccount()) {
    return null;
  }

  const handleResetDailyQuests = () => {
    const dailyQuests = generateDailyQuests().map(q => ({ ...q, completed: false }));
    resetDailyQuests(dailyQuests);
    showToast('Daily quests reset', 'success');
  };

  const handleResetWeeklyQuests = () => {
    const weeklyQuests = generateWeeklyQuests().map(q => ({ ...q, completed: false }));
    resetWeeklyQuests(weeklyQuests);
    showToast('Weekly quests reset', 'success');
  };

  const handleAddXPAndCoins = () => {
    addXP({ xp: xpAmount, coins: coinAmount, reason: 'Dev panel: Manual XP/Coins' });
    showToast(`Added ${xpAmount} XP and ${coinAmount} coins`, 'success');
  };

  const handleCompleteAllQuests = () => {
    const allQuests = [
      ...(quests.daily?.quests || []),
      ...(quests.weekly?.quests || []),
    ].filter(q => !q.completed);

    allQuests.forEach(quest => {
      checkQuestProgress(quest.category, quest.target);
    });

    showToast(`Completed ${allQuests.length} quests`, 'success');
  };

  const handleResetGamification = () => {
    if (window.confirm('Reset all gamification data? This cannot be undone.')) {
      const userId = user?.id || null;
      const defaultGamification = {
        xp: 0,
        level: 1,
        xpForCurrentLevel: 0,
        xpForNextLevel: 500,
        coins: 0,
        pityCounter: 0,
        inventory: {},
        equippedTitle: null,
        unlockedTitles: [],
        feedCount: 0,
        currentTheme: 'default',
        unlockedThemes: ['default'],
        currentProfileFrame: null,
        unlockedProfileFrames: [],
        petInventory: [],
        equippedPets: [],
        lastRewardReason: null,
      };
      saveGamification(defaultGamification, userId);
      window.location.reload();
    }
  };

  const handleResetQuests = () => {
    if (window.confirm('Reset all quest progress? This cannot be undone.')) {
      const userId = user?.id || null;
      const defaultQuests = {
        daily: {
          lastReset: null,
          quests: [],
        },
        weekly: {
          lastReset: null,
          quests: [],
        },
        achievements: [],
        progress: {},
      };
      saveQuests(defaultQuests, userId);
      window.location.reload();
    }
  };

  const handleForceLevelUp = () => {
    const currentXP = gamification?.xp || 0;
    const nextLevelXP = gamification?.xpForNextLevel || 500;
    const xpNeeded = nextLevelXP - currentXP;
    addXP({ xp: xpNeeded, coins: 0, reason: 'Dev panel: Force level up' });
    showToast('Leveled up!', 'success');
  };

  const handleAddCoins = (amount) => {
    addXP({ xp: 0, coins: amount, reason: 'Dev panel: Add coins' });
    showToast(`Added ${amount} coins`, 'success');
  };

  const handleAddXP = (amount) => {
    addXP({ xp: amount, coins: 0, reason: 'Dev panel: Add XP' });
    showToast(`Added ${amount} XP`, 'success');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
        title="Dev Panel"
      >
        <Code size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-red-500">
      <div className="sticky top-0 bg-red-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code size={20} />
          <h3 className="font-bold">Dev Panel</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-red-700 rounded p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Account: {user?.email}
        </div>

        <div className="space-y-3">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Star className="text-yellow-500" size={16} />
              XP & Coins
            </h4>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                placeholder="XP amount"
              />
              <button
                onClick={() => handleAddXP(xpAmount)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
              >
                Add XP
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                placeholder="Coins amount"
              />
              <button
                onClick={() => handleAddCoins(coinAmount)}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm transition-colors"
              >
                Add Coins
              </button>
            </div>

            <button
              onClick={handleAddXPAndCoins}
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors"
            >
              Add Both (XP + Coins)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddXP(100)}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs transition-colors"
              >
                +100 XP
              </button>
              <button
                onClick={() => handleAddCoins(100)}
                className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-xs transition-colors"
              >
                +100 Coins
              </button>
              <button
                onClick={handleForceLevelUp}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs transition-colors col-span-2"
              >
                Force Level Up
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Target className="text-primary-500" size={16} />
              Quests
            </h4>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleResetDailyQuests}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Reset Daily Quests
            </button>
            <button
              onClick={handleResetWeeklyQuests}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Reset Weekly Quests
            </button>
            <button
              onClick={handleCompleteAllQuests}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Complete All Quests
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Trash2 className="text-red-500" size={16} />
              Reset Data
            </h4>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleResetQuests}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
            >
              Reset All Quests
            </button>
            <button
              onClick={handleResetGamification}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
            >
              Reset Gamification
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>Level: {gamification?.level || 1}</div>
            <div>XP: {gamification?.xp || 0} / {gamification?.xpForNextLevel || 500}</div>
            <div>Coins: {gamification?.coins || 0}</div>
            <div>Tasks: {tasks?.length || 0}</div>
            <div>Study Logs: {studyLogs?.length || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevPanel;


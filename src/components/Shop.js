/**
 * Shop Component
 * Allows users to purchase and equip themes and profile frames
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ShoppingBag, Palette, Frame, Coins, Check, Lock, Sparkles, ShoppingCart } from 'lucide-react';
import { getThemeColors } from '../utils/theme';

// Theme definitions with gradients
const THEMES = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and minimal',
    gradient: 'from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950',
    cost: 0,
    icon: '🎨',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Calming blue gradients',
    gradient: 'from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900 dark:via-cyan-900 dark:to-blue-950',
    cost: 500,
    icon: '🌊',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm orange and pink tones',
    gradient: 'from-orange-50 via-pink-50 to-red-50 dark:from-orange-900 dark:via-pink-900 dark:to-red-950',
    cost: 500,
    icon: '🌅',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural green shades',
    gradient: 'from-green-50 via-emerald-50 to-teal-50 dark:from-green-900 dark:via-emerald-900 dark:to-teal-950',
    cost: 500,
    icon: '🌲',
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    description: 'Vibrant purple gradients',
    gradient: 'from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-900 dark:via-violet-900 dark:to-fuchsia-950',
    cost: 500,
    icon: '💜',
  },
  {
    id: 'gold',
    name: 'Golden Hour',
    description: 'Luxurious gold tones',
    gradient: 'from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900 dark:via-amber-900 dark:to-orange-950',
    cost: 1000,
    icon: '✨',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Night',
    description: 'Deep space vibes',
    gradient: 'from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950',
    cost: 1500,
    icon: '🌌',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Northern lights inspired',
    gradient: 'from-teal-50 via-cyan-50 to-green-50 dark:from-teal-950 dark:via-cyan-950 dark:to-green-950',
    cost: 2000,
    icon: '🌠',
  },
];

// Profile Frame definitions (placeholders)
const PROFILE_FRAMES = [
  {
    id: 'none',
    name: 'No Frame',
    description: 'Default profile appearance',
    cost: 0,
    icon: '⚪',
    preview: '⚪',
  },
  {
    id: 'frame_classic',
    name: 'Classic Frame',
    description: 'Elegant classic border',
    cost: 300,
    icon: '🖼️',
    preview: '🖼️',
  },
  {
    id: 'frame_gold',
    name: 'Golden Frame',
    description: 'Luxurious gold border',
    cost: 500,
    icon: '⭐',
    preview: '⭐',
  },
  {
    id: 'frame_crystal',
    name: 'Crystal Frame',
    description: 'Sparkling crystal border',
    cost: 800,
    icon: '💎',
    preview: '💎',
  },
  {
    id: 'frame_rainbow',
    name: 'Rainbow Frame',
    description: 'Colorful rainbow border',
    cost: 1000,
    icon: '🌈',
    preview: '🌈',
  },
  {
    id: 'frame_star',
    name: 'Starry Frame',
    description: 'Twinkling stars border',
    cost: 1200,
    icon: '✨',
    preview: '✨',
  },
  {
    id: 'frame_crown',
    name: 'Crown Frame',
    description: 'Royal crown border',
    cost: 1500,
    icon: '👑',
    preview: '👑',
  },
  {
    id: 'frame_neon',
    name: 'Neon Frame',
    description: 'Glowing neon border',
    cost: 1800,
    icon: '💡',
    preview: '💡',
  },
  {
    id: 'frame_galaxy',
    name: 'Galaxy Frame',
    description: 'Cosmic galaxy border',
    cost: 2000,
    icon: '🌌',
    preview: '🌌',
  },
];

// Food items for pets (exported for use in PetSanctuary)
export const FOOD_ITEMS = [
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

const Shop = () => {
  const { gamification, buyTheme, buyProfileFrame, equipTheme, equipProfileFrame, unequipProfileFrame, buyFood, getFoodCost, activeTab: appActiveTab } = useApp();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('themes');
  
  // If navigating from pet sanctuary (when shop tab becomes active), default to food tab
  useEffect(() => {
    if (appActiveTab === 'shop' && activeTab === 'themes') {
      // Check if we should default to food tab (could be enhanced with state/context)
      const shouldShowFood = sessionStorage.getItem('showFoodTab') === 'true';
      if (shouldShowFood) {
        setActiveTab('food');
        sessionStorage.removeItem('showFoodTab');
      }
    }
  }, [appActiveTab, activeTab]);
  const currentTheme = gamification?.currentTheme || 'default';
  const themeColors = getThemeColors(currentTheme);

  const handleBuyTheme = (theme) => {
    const result = buyTheme(theme);
    if (result.success) {
      success(result.message);
    } else {
      error(result.message);
    }
  };

  const handleEquipTheme = (themeId) => {
    equipTheme(themeId);
    success('Theme equipped!');
  };

  const handleBuyFrame = (frame) => {
    const result = buyProfileFrame(frame);
    if (result.success) {
      success(result.message);
    } else {
      error(result.message);
    }
  };

  const handleEquipFrame = (frameId) => {
    if (frameId === 'none') {
      unequipProfileFrame();
      success('Profile frame removed!');
    } else {
      equipProfileFrame(frameId);
      success('Profile frame equipped!');
    }
  };

  const handleBuyFood = (foodItem) => {
    const result = buyFood(foodItem);
    result.success ? success(result.message) : error(result.message);
  };

  const unlockedThemes = gamification.unlockedThemes || ['default'];
  const unlockedFrames = gamification.unlockedProfileFrames || [];
  const currentFrame = gamification.currentProfileFrame || null;

  return (
    <div className="space-y-6 animate-fade-in page-enter">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className={themeColors.iconColor} size={28} />
            Shop
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your experience with themes and profile frames
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-gray-800/80 px-4 py-2 shadow">
          <Coins className="text-yellow-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {gamification.coins} Coins
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('themes')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'themes'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Palette size={18} />
            Themes
          </div>
        </button>
        <button
          onClick={() => setActiveTab('frames')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'frames'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Frame size={18} />
            Profile Frames
          </div>
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'food'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            Pet Food
          </div>
        </button>
      </div>

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEMES.map((theme) => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            const isEquipped = currentTheme === theme.id;
            const canAfford = gamification.coins >= theme.cost;

            return (
              <div
                key={theme.id}
                className={`card relative overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1 ${
                  isEquipped ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Theme Preview */}
                <div className={`h-32 rounded-xl mb-4 bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-4xl shadow-inner`}>
                  {theme.icon}
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {theme.name}
                      {isEquipped && (
                        <span 
                          className="text-xs px-2 py-1 text-white rounded-full"
                          style={{ backgroundColor: 'var(--theme-icon-color)' }}
                        >
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {theme.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Coins className="text-yellow-500" size={16} />
                      {theme.cost === 0 ? 'Free' : `${theme.cost} coins`}
                    </div>
                    {isUnlocked ? (
                      <div className="flex gap-2">
                        {!isEquipped && (
                          <button
                            onClick={() => handleEquipTheme(theme.id)}
                            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                          >
                            <Sparkles size={14} />
                            Equip
                          </button>
                        )}
                        {isEquipped && (
                          <button
                            disabled
                            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
                          >
                            <Check size={14} />
                            Equipped
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyTheme(theme)}
                        disabled={!canAfford}
                        className={`btn-primary px-4 py-2 text-sm flex items-center gap-2 ${
                          !canAfford ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <ShoppingBag size={14} />
                            Buy
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            Locked
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Frames Tab */}
      {activeTab === 'frames' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROFILE_FRAMES.map((frame) => {
            const isUnlocked = frame.id === 'none' || unlockedFrames.includes(frame.id);
            const isEquipped = (frame.id === 'none' && !currentFrame) || currentFrame === frame.id;
            const canAfford = gamification.coins >= frame.cost;

            return (
              <div
                key={frame.id}
                className={`card relative overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1 ${
                  isEquipped ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {/* Frame Preview */}
                <div className="h-32 rounded-xl mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-6xl shadow-inner border-4 border-gray-300 dark:border-gray-600">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                    style={{
                      background: `linear-gradient(to bottom right, var(--theme-color-via), var(--theme-color-to))`
                    }}
                  >
                    👤
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {frame.name}
                      {isEquipped && (
                        <span 
                          className="text-xs px-2 py-1 text-white rounded-full"
                          style={{ backgroundColor: 'var(--theme-icon-color)' }}
                        >
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {frame.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <Coins className="text-yellow-500" size={16} />
                      {frame.cost === 0 ? 'Free' : `${frame.cost} coins`}
                    </div>
                    {isUnlocked ? (
                      <div className="flex gap-2">
                        {!isEquipped && (
                          <button
                            onClick={() => handleEquipFrame(frame.id)}
                            className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                          >
                            <Sparkles size={14} />
                            Equip
                          </button>
                        )}
                        {isEquipped && (
                          <button
                            disabled
                            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed"
                          >
                            <Check size={14} />
                            Equipped
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyFrame(frame)}
                        disabled={!canAfford}
                        className={`btn-primary px-4 py-2 text-sm flex items-center gap-2 ${
                          !canAfford ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <ShoppingBag size={14} />
                            Buy
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            Locked
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Food Tab */}
      {activeTab === 'food' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="icon-theme" size={24} />
                  Pet Food Shop
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Keep your pet well-fed and happy!
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FOOD_ITEMS.map((food) => (
                <div
                  key={food.id}
                  className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
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
                          ? 'text-white shadow-md btn-theme-gradient'
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
      )}
    </div>
  );
};

export default Shop;


/**
 * Sidebar Navigation Component
 * Replaces top navigation with a modern sidebar
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getThemeColors } from '../utils/theme';
import {
  CheckSquare,
  Timer,
  BarChart3,
  Settings as SettingsIcon,
  User,
  Menu,
  X,
  PawPrint,
  Star,
  Target,
  ShoppingBag,
} from 'lucide-react';

const Sidebar = () => {
  const { activeTab, setActiveTab, gamification } = useApp();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Get current theme for adaptive styling
  const currentTheme = gamification?.currentTheme || 'default';
  const themeColors = getThemeColors(currentTheme);
  
  // Theme-specific sidebar styling
  const getSidebarBg = () => {
    const themeStyles = {
      default: 'bg-white/95 dark:bg-gray-900/95',
      ocean: 'bg-blue-50/95 dark:bg-blue-950/95',
      sunset: 'bg-orange-50/95 dark:bg-orange-950/95',
      forest: 'bg-green-50/95 dark:bg-green-950/95',
      purple: 'bg-purple-50/95 dark:bg-purple-950/95',
      gold: 'bg-yellow-50/95 dark:bg-yellow-950/95',
      cosmic: 'bg-indigo-50/95 dark:bg-indigo-950/95',
      aurora: 'bg-teal-50/95 dark:bg-teal-950/95',
    };
    return themeStyles[currentTheme] || themeStyles.default;
  };
  
  const getSidebarBorder = () => {
    const themeStyles = {
      default: 'border-gray-200/50 dark:border-gray-700/50',
      ocean: 'border-blue-200/50 dark:border-blue-800/50',
      sunset: 'border-orange-200/50 dark:border-orange-800/50',
      forest: 'border-green-200/50 dark:border-green-800/50',
      purple: 'border-purple-200/50 dark:border-purple-800/50',
      gold: 'border-yellow-200/50 dark:border-yellow-800/50',
      cosmic: 'border-indigo-200/50 dark:border-indigo-800/50',
      aurora: 'border-teal-200/50 dark:border-teal-800/50',
    };
    return themeStyles[currentTheme] || themeStyles.default;
  };

  const xpRange = gamification?.xpForNextLevel - gamification?.xpForCurrentLevel || 0;
  const xpProgress = xpRange > 0
    ? ((gamification.xp - gamification.xpForCurrentLevel) / xpRange) * 100
    : 0;

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'quests', label: 'Quests', icon: Target },
    { id: 'pets', label: 'Pets', icon: PawPrint },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];


  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-3 ${getSidebarBg()} backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl border ${getSidebarBorder()} transition-all duration-300 transform hover:scale-110 active:scale-95 ripple`}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X size={24} className="transform transition-transform duration-300 rotate-90" />
        ) : (
          <Menu size={24} className="transform transition-transform duration-300" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 ${getSidebarBg()} backdrop-blur-md border-r ${getSidebarBorder()} z-40 transform transition-all duration-500 ease-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'
        } lg:translate-x-0 lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-6 border-b ${getSidebarBorder()}`}>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-color-from), var(--theme-color-via), var(--theme-color-to))`,
                  boxShadow: `0 10px 15px -3px var(--theme-icon-color, rgba(14, 165, 233, 0.25))`
                }}
              >
                <CheckSquare className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">
                  TaskFlow
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Study Smart</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileOpen(false);
                  }}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ease-out stagger-item relative overflow-hidden ${
                    activeTab === tab.id
                      ? 'text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-black/20 hover:scale-[1.01] hover:shadow-md hover:-translate-y-0.5'
                  }`}
                  style={activeTab === tab.id ? {
                    background: `linear-gradient(to right, var(--theme-color-from), var(--theme-color-to))`,
                    boxShadow: `0 10px 15px -3px var(--theme-icon-color, rgba(14, 165, 233, 0.25))`
                  } : {}}
                >
                  <Icon 
                    size={20} 
                    className={`transform transition-all duration-300 ease-out ${
                      activeTab === tab.id 
                        ? 'scale-110 rotate-3' 
                        : 'group-hover:scale-110'
                    }`} 
                  />
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div 
                      className="absolute inset-0 to-transparent animate-pulse-slow"
                      style={{
                        background: `linear-gradient(to right, var(--theme-icon-color, rgba(14, 165, 233, 0.2)), transparent)`
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className={`p-4 border-t ${getSidebarBorder()} bg-gradient-to-t from-white/30 to-transparent dark:from-black/20`}>
            <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${getSidebarBg()} backdrop-blur-sm border ${getSidebarBorder()} shadow-sm`}>
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-md"
                style={{
                  background: `linear-gradient(to bottom right, var(--theme-color-from), var(--theme-color-via), var(--theme-color-to))`,
                  boxShadow: `0 4px 6px -1px var(--theme-icon-color, rgba(14, 165, 233, 0.25))`
                }}
              >
                <User className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            {gamification && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Star size={14} className="icon-theme" />
                    Level {gamification.level}
                  </span>
                  <span className="tabular-nums">
                    {gamification.xp - gamification.xpForCurrentLevel}/{gamification.xpForNextLevel - gamification.xpForCurrentLevel} XP
                  </span>
                </div>
                <div className="w-full bg-gray-200/80 dark:bg-gray-700/80 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out progress-bar-theme shadow-sm"
                    style={{ width: `${Math.min(100, xpProgress)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;


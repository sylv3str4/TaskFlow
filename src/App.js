/**
 * Main App Component
 * TaskFlow - A comprehensive study management application
 */

import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import TaskManager from './components/TaskManager';
import PomodoroTimer from './components/PomodoroTimer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';
import PetSanctuary from './components/PetSanctuary';
import Quests from './components/Quests';
import Shop from './components/Shop';
import DevPanel from './components/DevPanel';
import { useApp } from './context/AppContext';
import { getThemeColors } from './utils/theme';

// Authentication wrapper
const AuthWrapper = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return showSignup ? (
      <Signup onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <Login onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  return <AppContent />;
};

// Theme gradient mapping
const THEME_GRADIENTS = {
  default: 'from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950',
  ocean: 'from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900 dark:via-cyan-900 dark:to-blue-950',
  sunset: 'from-orange-50 via-pink-50 to-red-50 dark:from-orange-900 dark:via-pink-900 dark:to-red-950',
  forest: 'from-green-50 via-emerald-50 to-teal-50 dark:from-green-900 dark:via-emerald-900 dark:to-teal-950',
  purple: 'from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-900 dark:via-violet-900 dark:to-fuchsia-950',
  gold: 'from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900 dark:via-amber-900 dark:to-orange-950',
  cosmic: 'from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950',
  aurora: 'from-teal-50 via-cyan-50 to-green-50 dark:from-teal-950 dark:via-cyan-950 dark:to-green-950',
};

// Main content component
const AppContent = () => {
  const { activeTab, gamification } = useApp();
  const [prevTab, setPrevTab] = React.useState(activeTab);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const currentTheme = gamification?.currentTheme || 'default';
  const themeGradient = THEME_GRADIENTS[currentTheme] || THEME_GRADIENTS.default;

  React.useEffect(() => {
    if (activeTab !== prevTab) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevTab(activeTab);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, prevTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskManager />;
      case 'timer':
        return <PomodoroTimer />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'quests':
        return <Quests />;
      case 'profile':
        return <UserProfile />;
      case 'settings':
        return <Settings />;
      case 'pets':
        return <PetSanctuary />;
      case 'shop':
        return <Shop />;
      default:
        return <TaskManager />;
    }
  };

  // Apply theme to body and root for CSS variables
  React.useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    const themeClasses = Object.keys(THEME_GRADIENTS).map(theme => `theme-${theme}`);
    body.classList.remove(...themeClasses);
    body.classList.add(`theme-${currentTheme}`);
    
    // Set CSS custom properties for theme colors
    const themeColors = getThemeColors(currentTheme);
    
    // Map theme colors to Tailwind color values
    const colorMap = {
      default: { from: 'rgb(2, 132, 199)', via: 'rgb(14, 165, 233)', to: 'rgb(3, 105, 161)', icon: 'rgb(14, 165, 233)' },
      ocean: { from: 'rgb(37, 99, 235)', via: 'rgb(8, 145, 178)', to: 'rgb(29, 78, 216)', icon: 'rgb(37, 99, 235)' },
      sunset: { from: 'rgb(234, 88, 12)', via: 'rgb(219, 39, 119)', to: 'rgb(194, 65, 12)', icon: 'rgb(234, 88, 12)' },
      forest: { from: 'rgb(22, 163, 74)', via: 'rgb(5, 150, 105)', to: 'rgb(20, 83, 45)', icon: 'rgb(22, 163, 74)' },
      purple: { from: 'rgb(147, 51, 234)', via: 'rgb(124, 58, 237)', to: 'rgb(126, 34, 206)', icon: 'rgb(147, 51, 234)' },
      gold: { from: 'rgb(234, 179, 8)', via: 'rgb(217, 119, 6)', to: 'rgb(202, 138, 4)', icon: 'rgb(234, 179, 8)' },
      cosmic: { from: 'rgb(99, 102, 241)', via: 'rgb(147, 51, 234)', to: 'rgb(79, 70, 229)', icon: 'rgb(99, 102, 241)' },
      aurora: { from: 'rgb(20, 184, 166)', via: 'rgb(6, 182, 212)', to: 'rgb(15, 118, 110)', icon: 'rgb(20, 184, 166)' },
    };
    
    const colors = colorMap[currentTheme] || colorMap.default;
    root.style.setProperty('--theme-color-from', colors.from);
    root.style.setProperty('--theme-color-via', colors.via);
    root.style.setProperty('--theme-color-to', colors.to);
    root.style.setProperty('--theme-icon-color', colors.icon);
    // Extract RGB values for rgba() usage
    const iconRgb = colors.icon.match(/\d+/g)?.join(', ') || '14, 165, 233';
    root.style.setProperty('--theme-icon-color-rgb', iconRgb);
    // Extract RGB values for theme colors
    const fromRgb = colors.from.match(/\d+/g)?.join(', ') || '2, 132, 199';
    const viaRgb = colors.via.match(/\d+/g)?.join(', ') || '14, 165, 233';
    const toRgb = colors.to.match(/\d+/g)?.join(', ') || '3, 105, 161';
    root.style.setProperty('--theme-color-from-rgb', fromRgb);
    root.style.setProperty('--theme-color-via-rgb', viaRgb);
    root.style.setProperty('--theme-color-to-rgb', toRgb);
    root.style.setProperty('--theme-progress-from', colors.from);
    root.style.setProperty('--theme-progress-via', colors.via);
    root.style.setProperty('--theme-progress-to', colors.to);
  }, [currentTheme]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeGradient} transition-all duration-500`}>
      <Sidebar />
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div
            key={activeTab}
            className={`page-enter ${isTransitioning ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          >
            {renderContent()}
          </div>
        </div>
      </main>
      <DevPanel />
    </div>
  );
};

// App component
const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AuthWrapper />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;


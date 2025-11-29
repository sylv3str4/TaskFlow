/**
 * Theme utility functions
 * Provides theme-aware colors for all UI components
 */

export const THEME_COLORS = {
  default: {
    primary: 'primary',
    primaryGradient: 'from-primary-600 to-primary-700',
    primaryLight: 'primary-400',
    primaryDark: 'primary-700',
    progressGradient: 'from-primary-500 via-primary-400 to-primary-300',
    iconColor: 'text-primary-500',
    iconColorDark: 'text-primary-400',
    accent: 'primary',
  },
  ocean: {
    primary: 'blue',
    primaryGradient: 'from-blue-600 to-cyan-600',
    primaryLight: 'blue-400',
    primaryDark: 'blue-700',
    progressGradient: 'from-blue-500 via-cyan-400 to-blue-300',
    iconColor: 'text-blue-500',
    iconColorDark: 'text-blue-400',
    accent: 'cyan',
  },
  sunset: {
    primary: 'orange',
    primaryGradient: 'from-orange-600 to-pink-600',
    primaryLight: 'orange-400',
    primaryDark: 'orange-700',
    progressGradient: 'from-orange-500 via-pink-400 to-red-300',
    iconColor: 'text-orange-500',
    iconColorDark: 'text-orange-400',
    accent: 'pink',
  },
  forest: {
    primary: 'green',
    primaryGradient: 'from-green-600 to-emerald-600',
    primaryLight: 'green-400',
    primaryDark: 'green-700',
    progressGradient: 'from-green-500 via-emerald-400 to-teal-300',
    iconColor: 'text-green-500',
    iconColorDark: 'text-green-400',
    accent: 'emerald',
  },
  purple: {
    primary: 'purple',
    primaryGradient: 'from-purple-600 to-violet-600',
    primaryLight: 'purple-400',
    primaryDark: 'purple-700',
    progressGradient: 'from-purple-500 via-violet-400 to-fuchsia-300',
    iconColor: 'text-purple-500',
    iconColorDark: 'text-purple-400',
    accent: 'violet',
  },
  gold: {
    primary: 'yellow',
    primaryGradient: 'from-yellow-600 to-amber-600',
    primaryLight: 'yellow-400',
    primaryDark: 'yellow-700',
    progressGradient: 'from-yellow-500 via-amber-400 to-orange-300',
    iconColor: 'text-yellow-500',
    iconColorDark: 'text-yellow-400',
    accent: 'amber',
  },
  cosmic: {
    primary: 'indigo',
    primaryGradient: 'from-indigo-600 to-purple-600',
    primaryLight: 'indigo-400',
    primaryDark: 'indigo-700',
    progressGradient: 'from-indigo-500 via-purple-400 to-pink-300',
    iconColor: 'text-indigo-500',
    iconColorDark: 'text-indigo-400',
    accent: 'purple',
  },
  aurora: {
    primary: 'teal',
    primaryGradient: 'from-teal-600 to-cyan-600',
    primaryLight: 'teal-400',
    primaryDark: 'teal-700',
    progressGradient: 'from-teal-500 via-cyan-400 to-green-300',
    iconColor: 'text-teal-500',
    iconColorDark: 'text-teal-400',
    accent: 'cyan',
  },
};

export const getThemeColors = (theme = 'default') => {
  return THEME_COLORS[theme] || THEME_COLORS.default;
};

export const getThemeClass = (baseClass, theme = 'default', variant = 'primary') => {
  const colors = getThemeColors(theme);
  const colorMap = {
    primary: colors.primary,
    gradient: colors.primaryGradient,
    light: colors.primaryLight,
    dark: colors.primaryDark,
    icon: colors.iconColor,
    iconDark: colors.iconColorDark,
    progress: colors.progressGradient,
  };
  
  // Replace color placeholders in class string
  return baseClass
    .replace(/\bprimary\b/g, colors.primary)
    .replace(/from-primary-\d+/g, `from-${colors.primary}-600`)
    .replace(/to-primary-\d+/g, `to-${colors.primary}-700`)
    .replace(/via-primary-\d+/g, `via-${colors.primary}-400`)
    .replace(/bg-primary-\d+/g, `bg-${colors.primary}-600`)
    .replace(/text-primary-\d+/g, colors.iconColor)
    .replace(/border-primary-\d+/g, `border-${colors.primary}-500`)
    .replace(/hover:bg-primary-\d+/g, `hover:bg-${colors.primary}-700`)
    .replace(/hover:from-primary-\d+/g, `hover:from-${colors.primary}-700`)
    .replace(/hover:to-primary-\d+/g, `hover:to-${colors.primary}-800`);
};


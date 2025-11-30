/**
 * App Context
 * Centralized state management for the entire application
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import {
  getTasks,
  saveTasks,
  getStudyLogs,
  saveStudyLogs,
  getSettings,
  saveSettings,
  getGamification,
  saveGamification,
  getQuests,
  saveQuests,
} from '../utils/storage';

const AppContext = createContext();

// Action types
const ActionTypes = {
  // Tasks
  SET_TASKS: 'SET_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  TOGGLE_TASK: 'TOGGLE_TASK',
  
  // Study Logs
  SET_STUDY_LOGS: 'SET_STUDY_LOGS',
  ADD_STUDY_LOG: 'ADD_STUDY_LOG',
  
  // Settings
  SET_SETTINGS: 'SET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
 
  // Gamification
  SET_GAMIFICATION: 'SET_GAMIFICATION',
  ADD_XP: 'ADD_XP',
  UPDATE_PET: 'UPDATE_PET',
  ADD_PET_TO_INVENTORY: 'ADD_PET_TO_INVENTORY',
  EQUIP_PET: 'EQUIP_PET',
  UNEQUIP_PET: 'UNEQUIP_PET',
  UPDATE_INVENTORY: 'UPDATE_INVENTORY',
  UPDATE_PITY: 'UPDATE_PITY',

  // Quests
  SET_QUESTS: 'SET_QUESTS',
  UPDATE_QUEST_PROGRESS: 'UPDATE_QUEST_PROGRESS',
  COMPLETE_QUEST: 'COMPLETE_QUEST',
  RESET_DAILY_QUESTS: 'RESET_DAILY_QUESTS',
  RESET_WEEKLY_QUESTS: 'RESET_WEEKLY_QUESTS',

  // UI
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  
  // Customization
  EQUIP_THEME: 'EQUIP_THEME',
  EQUIP_PROFILE_FRAME: 'EQUIP_PROFILE_FRAME',
  UNEQUIP_PROFILE_FRAME: 'UNEQUIP_PROFILE_FRAME',
};

// Initial state
const initialState = {
  tasks: [],
  studyLogs: [],
  settings: {
    darkMode: false,
    pomodoroWork: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroLongBreakInterval: 4,
    boxTransparency: 0.08, // Default transparency for box theme gradients (0-1)
  },
  gamification: {
    xp: 0,
    level: 1,
    xpForCurrentLevel: 0,
    xpForNextLevel: 500,
    coins: 0,
    pityCounter: 0, // Tracks spins without rare+ pet
    inventory: {}, // Food inventory: { foodId: quantity }
    equippedTitle: null, // Currently equipped title
    petInventory: [], // Array of all pets you've rolled: [{ id, name, species, rarity, color, mood, energy, hunger, buffs, debuffs, level, exp, expForNextLevel }]
    equippedPets: [], // Array of up to 3 equipped pet IDs
    lastRewardReason: null,
  },
  quests: {
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
  },
  activeTab: 'tasks',
};

const getLevelStats = (xp) => {
  const XP_PER_LEVEL = 500;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = (level - 1) * XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  return {
    level,
    currentLevelXp,
    nextLevelXp,
  };
};

const PET_SPIN_COST = 25;
const PITY_THRESHOLD = 10; // Guarantee rare+ after 10 spins

// GMT+7 timezone helpers - work entirely in UTC
const getGMT7Timestamp = () => {
  const now = new Date();
  const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000);
  return utcTimestamp + (7 * 3600000);
};

const getGMT7DateComponents = (timestamp = null) => {
  const gmt7Timestamp = timestamp || getGMT7Timestamp();
  const utcTimestamp = gmt7Timestamp - (7 * 3600000);
  const utcDate = new Date(utcTimestamp);
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth(),
    date: utcDate.getUTCDate(),
    day: utcDate.getUTCDay(),
    hours: utcDate.getUTCHours(),
  };
};

const getGMT7Midnight = (date = null) => {
  const gmt7Timestamp = date ? (() => {
    const utcTimestamp = date.getTime() + (date.getTimezoneOffset() * 60000);
    return utcTimestamp + (7 * 3600000);
  })() : getGMT7Timestamp();
  
  const { year, month, date: day } = getGMT7DateComponents(gmt7Timestamp);
  const utcMidnight = Date.UTC(year, month, day, 0, 0, 0, 0);
  const gmt7MidnightTimestamp = utcMidnight - (7 * 3600000);
  return new Date(gmt7MidnightTimestamp);
};

const getGMT7Monday = () => {
  const { year, month, date, day } = getGMT7DateComponents();
  
  let mondayDate;
  if (day === 0) {
    mondayDate = date + 1;
  } else if (day === 1) {
    mondayDate = date;
  } else {
    mondayDate = date - (day - 1);
  }
  
  const utcMondayMidnight = Date.UTC(year, month, mondayDate, 0, 0, 0, 0);
  const gmt7MondayMidnight = utcMondayMidnight - (7 * 3600000);
  return new Date(gmt7MondayMidnight);
};

const shouldResetDaily = (lastReset) => {
  if (!lastReset) return true;
  const lastResetDate = new Date(lastReset);
  const gmt7Today = getGMT7Midnight();
  const lastResetGMT7 = getGMT7Midnight(lastResetDate);
  return lastResetGMT7.getTime() < gmt7Today.getTime();
};

const shouldResetWeekly = (lastReset) => {
  if (!lastReset) return true;
  const lastResetDate = new Date(lastReset);
  const gmt7Monday = getGMT7Monday();
  
  const lastResetTimestamp = lastResetDate.getTime() + (lastResetDate.getTimezoneOffset() * 60000) + (7 * 3600000);
  const { year, month, date, day } = getGMT7DateComponents(lastResetTimestamp);
  
  let daysUntilMonday;
  if (day === 0) {
    daysUntilMonday = 1;
  } else if (day === 1) {
    daysUntilMonday = 0;
  } else {
    daysUntilMonday = 8 - day;
  }
  
  const mondayDate = date + daysUntilMonday;
  const utcMondayMidnight = Date.UTC(year, month, mondayDate, 0, 0, 0, 0);
  const lastResetMonday = new Date(utcMondayMidnight - (7 * 3600000));
  
  return lastResetMonday.getTime() < gmt7Monday.getTime();
};

// Quest Pool Definitions
const DAILY_QUEST_POOL = [
  {
    id: 'daily_complete_2_tasks',
    title: 'Complete 2 Tasks',
    description: 'Complete 2 tasks today',
    type: 'daily',
    target: 2,
    reward: { xp: 40, coins: 12 },
    icon: '✓',
    category: 'tasks',
  },
  {
    id: 'daily_complete_3_tasks',
    title: 'Complete 3 Tasks',
    description: 'Complete 3 tasks today',
    type: 'daily',
    target: 3,
    reward: { xp: 50, coins: 15 },
    icon: '✓',
    category: 'tasks',
  },
  {
    id: 'daily_complete_5_tasks',
    title: 'Complete 5 Tasks',
    description: 'Complete 5 tasks today',
    type: 'daily',
    target: 5,
    reward: { xp: 70, coins: 20 },
    icon: '✓',
    category: 'tasks',
  },
  {
    id: 'daily_study_20_min',
    title: 'Study for 20 Minutes',
    description: 'Complete 20 minutes of study time',
    type: 'daily',
    target: 20,
    reward: { xp: 30, coins: 10 },
    icon: '⏱️',
    category: 'study',
  },
  {
    id: 'daily_study_30_min',
    title: 'Study for 30 Minutes',
    description: 'Complete 30 minutes of study time',
    type: 'daily',
    target: 30,
    reward: { xp: 40, coins: 12 },
    icon: '⏱️',
    category: 'study',
  },
  {
    id: 'daily_study_45_min',
    title: 'Study for 45 Minutes',
    description: 'Complete 45 minutes of study time',
    type: 'daily',
    target: 45,
    reward: { xp: 55, coins: 18 },
    icon: '⏱️',
    category: 'study',
  },
  {
    id: 'daily_complete_pomodoro',
    title: 'Complete a Pomodoro',
    description: 'Complete one full Pomodoro session',
    type: 'daily',
    target: 1,
    reward: { xp: 35, coins: 10 },
    icon: '🍅',
    category: 'pomodoro',
  },
  {
    id: 'daily_complete_2_pomodoros',
    title: 'Complete 2 Pomodoros',
    description: 'Complete two Pomodoro sessions today',
    type: 'daily',
    target: 2,
    reward: { xp: 60, coins: 18 },
    icon: '🍅',
    category: 'pomodoro',
  },
  {
    id: 'daily_feed_pet',
    title: 'Feed Your Pet',
    description: 'Feed your pet once today',
    type: 'daily',
    target: 1,
    reward: { xp: 30, coins: 10 },
    icon: '🍎',
    category: 'pet',
  },
  {
    id: 'daily_play_with_pet',
    title: 'Play with Your Pet',
    description: 'Play with your pet once today',
    type: 'daily',
    target: 1,
    reward: { xp: 25, coins: 8 },
    icon: '🎾',
    category: 'pet',
  },
];

const WEEKLY_QUEST_POOL = [
  {
    id: 'weekly_complete_15_tasks',
    title: 'Complete 15 Tasks',
    description: 'Complete 15 tasks this week',
    type: 'weekly',
    target: 15,
    reward: { xp: 180, coins: 45 },
    icon: '✓',
    category: 'tasks',
  },
  {
    id: 'weekly_complete_20_tasks',
    title: 'Complete 20 Tasks',
    description: 'Complete 20 tasks this week',
    type: 'weekly',
    target: 20,
    reward: { xp: 200, coins: 50 },
    icon: '✓',
    category: 'tasks',
  },
  {
    id: 'weekly_complete_30_tasks',
    title: 'Complete 30 Tasks',
    description: 'Complete 30 tasks this week',
    type: 'weekly',
    target: 30,
    reward: { xp: 300, coins: 75 },
    icon: '✓',
    category: 'tasks',
  },
  {
    id: 'weekly_study_4_hours',
    title: 'Study for 4 Hours',
    description: 'Complete 4 hours of study time this week',
    type: 'weekly',
    target: 240,
    reward: { xp: 250, coins: 60 },
    icon: '⏱️',
    category: 'study',
  },
  {
    id: 'weekly_study_5_hours',
    title: 'Study for 5 Hours',
    description: 'Complete 5 hours of study time this week',
    type: 'weekly',
    target: 300,
    reward: { xp: 300, coins: 75 },
    icon: '⏱️',
    category: 'study',
  },
  {
    id: 'weekly_study_7_hours',
    title: 'Study for 7 Hours',
    description: 'Complete 7 hours of study time this week',
    type: 'weekly',
    target: 420,
    reward: { xp: 400, coins: 100 },
    icon: '⏱️',
    category: 'study',
  },
  {
    id: 'weekly_complete_8_pomodoros',
    title: 'Complete 8 Pomodoros',
    description: 'Complete 8 Pomodoro sessions this week',
    type: 'weekly',
    target: 8,
    reward: { xp: 200, coins: 50 },
    icon: '🍅',
    category: 'pomodoro',
  },
  {
    id: 'weekly_complete_10_pomodoros',
    title: 'Complete 10 Pomodoros',
    description: 'Complete 10 Pomodoro sessions this week',
    type: 'weekly',
    target: 10,
    reward: { xp: 250, coins: 60 },
    icon: '🍅',
    category: 'pomodoro',
  },
  {
    id: 'weekly_complete_15_pomodoros',
    title: 'Complete 15 Pomodoros',
    description: 'Complete 15 Pomodoro sessions this week',
    type: 'weekly',
    target: 15,
    reward: { xp: 350, coins: 85 },
    icon: '🍅',
    category: 'pomodoro',
  },
  {
    id: 'weekly_feed_pet_5_times',
    title: 'Feed Pet 5 Times',
    description: 'Feed your pet 5 times this week',
    type: 'weekly',
    target: 5,
    reward: { xp: 120, coins: 30 },
    icon: '🍎',
    category: 'pet',
  },
  {
    id: 'weekly_feed_pet_7_times',
    title: 'Feed Pet 7 Times',
    description: 'Feed your pet 7 times this week',
    type: 'weekly',
    target: 7,
    reward: { xp: 150, coins: 40 },
    icon: '🍎',
    category: 'pet',
  },
  {
    id: 'weekly_play_with_pet_5_times',
    title: 'Play with Pet 5 Times',
    description: 'Play with your pet 5 times this week',
    type: 'weekly',
    target: 5,
    reward: { xp: 100, coins: 25 },
    icon: '🎾',
    category: 'pet',
  },
  {
    id: 'weekly_study_streak_5_days',
    title: '5-Day Study Streak',
    description: 'Study for at least 20 minutes on 5 different days this week',
    type: 'weekly',
    target: 5,
    reward: { xp: 280, coins: 70 },
    icon: '🔥',
    category: 'study',
  },
  {
    id: 'weekly_complete_all_daily_quests',
    title: 'Complete All Daily Quests',
    description: 'Complete all daily quests on 3 different days this week',
    type: 'weekly',
    target: 3,
    reward: { xp: 320, coins: 80 },
    icon: '⭐',
    category: 'achievement',
  },
];

// Guaranteed quests that always appear
const GUARANTEED_DAILY_QUEST = {
  id: 'daily_complete_daily_quests',
  title: 'Complete Daily Quests',
  description: 'Complete all daily quests today',
  type: 'daily',
  target: 1,
  reward: { xp: 100, coins: 30 },
  icon: '⭐',
  category: 'achievement',
};

const GUARANTEED_WEEKLY_QUEST = {
  id: 'weekly_complete_weekly_quests',
  title: 'Complete Weekly Quests',
  description: 'Complete all weekly quests this week',
  type: 'weekly',
  target: 1,
  reward: { xp: 500, coins: 150 },
  icon: '🌟',
  category: 'achievement',
};

// Quest randomizer
const randomizeQuests = (pool, count, guaranteedQuests = []) => {
  const selected = [...guaranteedQuests];
  const available = pool.filter(q => !guaranteedQuests.some(gq => gq.id === q.id));
  
  // Shuffle available quests
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  
  // Select remaining quests
  const remaining = count - selected.length;
  for (let i = 0; i < remaining && i < shuffled.length; i++) {
    selected.push(shuffled[i]);
  }
  
  return selected;
};

// Quest generation functions
const generateDailyQuests = () => {
  const guaranteed = [{ ...GUARANTEED_DAILY_QUEST, completed: false }];
  const randomQuests = randomizeQuests(DAILY_QUEST_POOL, 5, guaranteed);
  return randomQuests;
};

const generateWeeklyQuests = () => {
  const guaranteed = [{ ...GUARANTEED_WEEKLY_QUEST, completed: false }];
  const randomQuests = randomizeQuests(WEEKLY_QUEST_POOL, 10, guaranteed);
  return randomQuests;
};

const generateAchievementQuests = () => [
  // Level Achievements
  {
    id: 'achieve_level_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    type: 'achievement',
    target: 5,
    reward: { xp: 500, coins: 100, title: 'Rising Star' },
    icon: '⭐',
    category: 'level',
    requirement: 'Reach level 5',
  },
  {
    id: 'achieve_level_10',
    title: 'Dedicated Learner',
    description: 'Reach level 10',
    type: 'achievement',
    target: 10,
    reward: { xp: 2000, coins: 400, title: 'Dedicated Learner' },
    icon: '🌟',
    category: 'level',
    requirement: 'Reach level 10',
  },
  {
    id: 'achieve_level_20',
    title: 'Expert Scholar',
    description: 'Reach level 20',
    type: 'achievement',
    target: 20,
    reward: { xp: 5000, coins: 1000, title: 'Expert Scholar' },
    icon: '💫',
    category: 'level',
    requirement: 'Reach level 20',
  },
  
  // Task Achievements
  {
    id: 'achieve_complete_50_tasks',
    title: 'Task Enthusiast',
    description: 'Complete 50 tasks total',
    type: 'achievement',
    target: 50,
    reward: { xp: 500, coins: 100, title: 'Task Enthusiast' },
    icon: '✓',
    category: 'tasks',
    requirement: 'Complete 50 tasks',
  },
  {
    id: 'achieve_complete_100_tasks',
    title: 'Task Master',
    description: 'Complete 100 tasks total',
    type: 'achievement',
    target: 100,
    reward: { xp: 1000, coins: 200, title: 'Task Master' },
    icon: '✅',
    category: 'tasks',
    requirement: 'Complete 100 tasks',
  },
  {
    id: 'achieve_complete_250_tasks',
    title: 'Productivity Guru',
    description: 'Complete 250 tasks total',
    type: 'achievement',
    target: 250,
    reward: { xp: 2500, coins: 500, title: 'Productivity Guru' },
    icon: '🎯',
    category: 'tasks',
    requirement: 'Complete 250 tasks',
  },
  {
    id: 'achieve_complete_500_tasks',
    title: 'Completion Legend',
    description: 'Complete 500 tasks total',
    type: 'achievement',
    target: 500,
    reward: { xp: 5000, coins: 1000, title: 'Completion Legend' },
    icon: '🏆',
    category: 'tasks',
    requirement: 'Complete 500 tasks',
  },
  
  // Study Time Achievements
  {
    id: 'achieve_study_10_hours',
    title: 'Study Beginner',
    description: 'Complete 10 hours of study time total',
    type: 'achievement',
    target: 600, // minutes
    reward: { xp: 300, coins: 60, title: 'Study Beginner' },
    icon: '📚',
    category: 'study',
    requirement: 'Study for 10 hours (600 minutes)',
  },
  {
    id: 'achieve_study_25_hours',
    title: 'Diligent Student',
    description: 'Complete 25 hours of study time total',
    type: 'achievement',
    target: 1500, // minutes
    reward: { xp: 750, coins: 150, title: 'Diligent Student' },
    icon: '📖',
    category: 'study',
    requirement: 'Study for 25 hours (1500 minutes)',
  },
  {
    id: 'achieve_study_50_hours',
    title: 'Scholar',
    description: 'Complete 50 hours of study time total',
    type: 'achievement',
    target: 3000, // minutes
    reward: { xp: 1500, coins: 300, title: 'Scholar' },
    icon: '⏱️',
    category: 'study',
    requirement: 'Study for 50 hours (3000 minutes)',
  },
  {
    id: 'achieve_study_100_hours',
    title: 'Academic Excellence',
    description: 'Complete 100 hours of study time total',
    type: 'achievement',
    target: 6000, // minutes
    reward: { xp: 3000, coins: 600, title: 'Academic Excellence' },
    icon: '🎓',
    category: 'study',
    requirement: 'Study for 100 hours (6000 minutes)',
  },
  {
    id: 'achieve_study_200_hours',
    title: 'Master of Knowledge',
    description: 'Complete 200 hours of study time total',
    type: 'achievement',
    target: 12000, // minutes
    reward: { xp: 6000, coins: 1200, title: 'Master of Knowledge' },
    icon: '👑',
    category: 'study',
    requirement: 'Study for 200 hours (12000 minutes)',
  },
  
  // Pomodoro Achievements
  {
    id: 'achieve_complete_25_pomodoros',
    title: 'Focus Starter',
    description: 'Complete 25 Pomodoro sessions total',
    type: 'achievement',
    target: 25,
    reward: { xp: 300, coins: 60, title: 'Focus Starter' },
    icon: '🍅',
    category: 'pomodoro',
    requirement: 'Complete 25 Pomodoro sessions',
  },
  {
    id: 'achieve_complete_50_pomodoros',
    title: 'Concentration Pro',
    description: 'Complete 50 Pomodoro sessions total',
    type: 'achievement',
    target: 50,
    reward: { xp: 600, coins: 120, title: 'Concentration Pro' },
    icon: '⏰',
    category: 'pomodoro',
    requirement: 'Complete 50 Pomodoro sessions',
  },
  {
    id: 'achieve_complete_100_pomodoros',
    title: 'Focus Master',
    description: 'Complete 100 Pomodoro sessions total',
    type: 'achievement',
    target: 100,
    reward: { xp: 1200, coins: 250, title: 'Focus Master' },
    icon: '🎯',
    category: 'pomodoro',
    requirement: 'Complete 100 Pomodoro sessions',
  },
  {
    id: 'achieve_complete_250_pomodoros',
    title: 'Zen Master',
    description: 'Complete 250 Pomodoro sessions total',
    type: 'achievement',
    target: 250,
    reward: { xp: 3000, coins: 600, title: 'Zen Master' },
    icon: '🧘',
    category: 'pomodoro',
    requirement: 'Complete 250 Pomodoro sessions',
  },
  {
    id: 'achieve_complete_500_pomodoros',
    title: 'Ultimate Focus',
    description: 'Complete 500 Pomodoro sessions total',
    type: 'achievement',
    target: 500,
    reward: { xp: 6000, coins: 1200, title: 'Ultimate Focus' },
    icon: '🔥',
    category: 'pomodoro',
    requirement: 'Complete 500 Pomodoro sessions',
  },
  
  // Pet Achievements
  {
    id: 'achieve_get_rare_pet',
    title: 'Rare Pet Owner',
    description: 'Obtain a rare rarity pet',
    type: 'achievement',
    target: 1,
    reward: { xp: 500, coins: 100, title: 'Rare Pet Owner' },
    icon: '🦊',
    category: 'pet',
    requirement: 'Obtain a rare rarity pet',
  },
  {
    id: 'achieve_get_epic_pet',
    title: 'Elite Tamer',
    description: 'Obtain an epic rarity pet',
    type: 'achievement',
    target: 1,
    reward: { xp: 1000, coins: 200, title: 'Elite Tamer' },
    icon: '🦄',
    category: 'pet',
    requirement: 'Obtain an epic rarity pet',
  },
  {
    id: 'achieve_get_legendary_pet',
    title: 'Legendary Tamer',
    description: 'Obtain a legendary rarity pet',
    type: 'achievement',
    target: 1,
    reward: { xp: 2000, coins: 500, title: 'Legendary Tamer' },
    icon: '🐉',
    category: 'pet',
    requirement: 'Obtain a legendary rarity pet',
  },
  {
    id: 'achieve_get_mythical_pet',
    title: 'Mythical Master',
    description: 'Obtain a mythical rarity pet',
    type: 'achievement',
    target: 1,
    reward: { xp: 5000, coins: 1500, title: 'Mythical Master' },
    icon: '✨',
    category: 'pet',
    requirement: 'Obtain a mythical rarity pet',
  },
  {
    id: 'achieve_get_secret_pet',
    title: 'Secret Keeper',
    description: 'Obtain a secret rarity pet',
    type: 'achievement',
    target: 1,
    reward: { xp: 10000, coins: 3000, title: 'Secret Keeper' },
    icon: '🌌',
    category: 'pet',
    requirement: 'Obtain a secret rarity pet',
  },
  {
    id: 'achieve_feed_pet_50_times',
    title: 'Caring Companion',
    description: 'Feed your pet 50 times total',
    type: 'achievement',
    target: 50,
    reward: { xp: 500, coins: 100, title: 'Caring Companion' },
    icon: '🍎',
    category: 'pet',
    requirement: 'Feed your pet 50 times',
  },
  {
    id: 'achieve_feed_pet_100_times',
    title: 'Pet Lover',
    description: 'Feed your pet 100 times total',
    type: 'achievement',
    target: 100,
    reward: { xp: 1000, coins: 200, title: 'Pet Lover' },
    icon: '❤️',
    category: 'pet',
    requirement: 'Feed your pet 100 times',
  },
  
  // Coin Achievements
  {
    id: 'achieve_earn_1000_coins',
    title: 'Wealthy Student',
    description: 'Earn 1000 coins total',
    type: 'achievement',
    target: 1000,
    reward: { xp: 500, coins: 100, title: 'Wealthy Student' },
    icon: '💰',
    category: 'coins',
    requirement: 'Earn 1000 coins',
  },
  {
    id: 'achieve_earn_5000_coins',
    title: 'Treasure Hunter',
    description: 'Earn 5000 coins total',
    type: 'achievement',
    target: 5000,
    reward: { xp: 2000, coins: 400, title: 'Treasure Hunter' },
    icon: '💎',
    category: 'coins',
    requirement: 'Earn 5000 coins',
  },
  {
    id: 'achieve_earn_10000_coins',
    title: 'Millionaire Scholar',
    description: 'Earn 10000 coins total',
    type: 'achievement',
    target: 10000,
    reward: { xp: 5000, coins: 1000, title: 'Millionaire Scholar' },
    icon: '💵',
    category: 'coins',
    requirement: 'Earn 10000 coins',
  },
  
  // Streak Achievements
  {
    id: 'achieve_7_day_streak',
    title: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    type: 'achievement',
    target: 7,
    reward: { xp: 700, coins: 140, title: 'Week Warrior' },
    icon: '🔥',
    category: 'streak',
    requirement: 'Study for 7 consecutive days',
  },
  {
    id: 'achieve_30_day_streak',
    title: 'Monthly Champion',
    description: 'Maintain a 30-day study streak',
    type: 'achievement',
    target: 30,
    reward: { xp: 3000, coins: 600, title: 'Monthly Champion' },
    icon: '📅',
    category: 'streak',
    requirement: 'Study for 30 consecutive days',
  },
];

// Buff/Debuff system
const BUFF_TYPES = ['xpBoost', 'coinBoost', 'discount', 'luckBoost'];
const DEBUFF_TYPES = ['xpPenalty', 'coinPenalty', 'priceIncrease', 'luckPenalty'];

const getRarityConfig = (rarity) => {
  const configs = {
    Common: { buffCount: [1, 2], debuffCount: [1, 2], buffRange: [5, 15], debuffRange: [5, 15] },
    Rare: { buffCount: [2, 3], debuffCount: [0, 1], buffRange: [10, 25], debuffRange: [5, 10] },
    Epic: { buffCount: [3, 4], debuffCount: [0, 1], buffRange: [15, 35], debuffRange: [0, 5] },
    Legendary: { buffCount: [4, 4], debuffCount: [0, 0], buffRange: [25, 50], debuffRange: [0, 0] },
    Mythical: { buffCount: [5, 5], debuffCount: [0, 0], buffRange: [40, 75], debuffRange: [0, 0] },
    Secret: { buffCount: [6, 6], debuffCount: [0, 0], buffRange: [60, 100], debuffRange: [0, 0] },
  };
  return configs[rarity] || configs.Common;
};

const generatePetBuffs = (rarity) => {
  const config = getRarityConfig(rarity);
  const buffs = {};
  const debuffs = {};
  
  // Generate buffs
  const buffCount = Math.floor(Math.random() * (config.buffCount[1] - config.buffCount[0] + 1)) + config.buffCount[0];
  const availableBuffs = [...BUFF_TYPES];
  
  for (let i = 0; i < buffCount && availableBuffs.length > 0; i++) {
    const buffType = availableBuffs.splice(Math.floor(Math.random() * availableBuffs.length), 1)[0];
    const value = Math.floor(Math.random() * (config.buffRange[1] - config.buffRange[0] + 1)) + config.buffRange[0];
    buffs[buffType] = value;
  }
  
  // Generate debuffs
  const debuffCount = Math.floor(Math.random() * (config.debuffCount[1] - config.debuffCount[0] + 1)) + config.debuffCount[0];
  const availableDebuffs = [...DEBUFF_TYPES];
  
  for (let i = 0; i < debuffCount && availableDebuffs.length > 0; i++) {
    const debuffType = availableDebuffs.splice(Math.floor(Math.random() * availableDebuffs.length), 1)[0];
    const value = Math.floor(Math.random() * (config.debuffRange[1] - config.debuffRange[0] + 1)) + config.debuffRange[0];
    debuffs[debuffType] = value;
  }
  
  return { buffs, debuffs };
};

const PET_POOL = [
  { name: 'Pixel', species: '🐾', rarity: 'Common', color: '#0ea5e9', chance: 30 },
  { name: 'Blossom', species: '🦊', rarity: 'Rare', color: '#f97316', chance: 20 },
  { name: 'Lumen', species: '🐉', rarity: 'Legendary', color: '#fde047', chance: 5 },
  { name: 'Nimbus', species: '🦄', rarity: 'Epic', color: '#a855f7', chance: 10 },
  { name: 'Pebble', species: '🐢', rarity: 'Common', color: '#10b981', chance: 15 },
  { name: 'Starling', species: '🕊️', rarity: 'Rare', color: '#38bdf8', chance: 12 },
  { name: 'Ember', species: '🐲', rarity: 'Epic', color: '#ef4444', chance: 8 },
  { name: 'Aether', species: '✨', rarity: 'Mythical', color: '#ec4899', chance: 2 },
  { name: 'Void', species: '🌌', rarity: 'Mythical', color: '#8b5cf6', chance: 1.5 },
  { name: 'Eclipse', species: '🌑', rarity: 'Secret', color: '#000000', chance: 0.5 },
];

// Pet level system helpers
const getExpForLevel = (level) => {
  // Exponential growth: 50 * (1.5 ^ (level - 1))
  return Math.floor(50 * Math.pow(1.5, level - 1));
};

const scaleBuffsForLevel = (buffs, level) => {
  if (!buffs || level <= 1) return buffs || {};
  // Buffs increase by 2% per level (capped at +100% = 2x at level 50)
  const multiplier = Math.min(1 + (level - 1) * 0.02, 2);
  const scaled = {};
  for (const [key, value] of Object.entries(buffs)) {
    scaled[key] = Math.floor(value * multiplier);
  }
  return scaled;
};

const scaleDebuffsForLevel = (debuffs, level) => {
  if (!debuffs || level <= 1) return debuffs || {};
  // Debuffs decrease by 1% per level (capped at -50% = 0.5x at level 50)
  const multiplier = Math.max(1 - (level - 1) * 0.01, 0.5);
  const scaled = {};
  for (const [key, value] of Object.entries(debuffs)) {
    scaled[key] = Math.floor(value * multiplier);
  }
  return scaled;
};

const rollPetReward = (pityCounter = 0) => {
  let selectedPet;
  
  // If pity threshold reached, guarantee rare+ pet
  if (pityCounter >= PITY_THRESHOLD) {
    const rarePets = PET_POOL.filter(pet => 
      pet.rarity === 'Rare' || pet.rarity === 'Epic' || pet.rarity === 'Legendary' || 
      pet.rarity === 'Mythical' || pet.rarity === 'Secret'
    );
    selectedPet = rarePets[Math.floor(Math.random() * rarePets.length)];
  } else {
    const totalChance = PET_POOL.reduce((sum, pet) => sum + pet.chance, 0);
    let roll = Math.random() * totalChance;
    for (const pet of PET_POOL) {
      if (roll < pet.chance) {
        selectedPet = pet;
        break;
      }
      roll -= pet.chance;
    }
    if (!selectedPet) {
      selectedPet = PET_POOL[0];
    }
  }
  
  const { buffs, debuffs } = generatePetBuffs(selectedPet.rarity);
  return { 
    id: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
    ...selectedPet, 
    buffs, 
    debuffs,
    level: 1,
    exp: 0,
    expForNextLevel: getExpForLevel(2),
    mood: 'Happy',
    energy: 70,
    hunger: 30,
  };
};

// Reducer function
const appReducer = (state, action) => {
  const userId = action.userId || null;
  
  switch (action.type) {
    case ActionTypes.SET_TASKS:
      return { ...state, tasks: action.payload };
    
    case ActionTypes.ADD_TASK:
      const newTasks = [...state.tasks, action.payload];
      saveTasks(newTasks, userId);
      return { ...state, tasks: newTasks };
    
    case ActionTypes.UPDATE_TASK:
      const updatedTasks = state.tasks.map(task =>
        task.id === action.payload.id ? { ...task, ...action.payload } : task
      );
      saveTasks(updatedTasks, userId);
      return { ...state, tasks: updatedTasks };
    
    case ActionTypes.DELETE_TASK:
      const filteredTasks = state.tasks.filter(task => task.id !== action.payload);
      saveTasks(filteredTasks, userId);
      return { ...state, tasks: filteredTasks };
    
    case ActionTypes.TOGGLE_TASK:
      const toggledTasks = state.tasks.map(task =>
        task.id === action.payload
          ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null }
          : task
      );
      saveTasks(toggledTasks, userId);
      return { ...state, tasks: toggledTasks };
    
    case ActionTypes.SET_STUDY_LOGS:
      return { ...state, studyLogs: action.payload };
    
    case ActionTypes.ADD_STUDY_LOG:
      const newLogs = [...state.studyLogs, action.payload];
      saveStudyLogs(newLogs, userId);
      return { ...state, studyLogs: newLogs };
    
    case ActionTypes.SET_SETTINGS:
      return { ...state, settings: action.payload };
    
    case ActionTypes.UPDATE_SETTINGS:
      const updatedSettings = { ...state.settings, ...action.payload };
      saveSettings(updatedSettings, userId);
      // Apply dark mode immediately
      if (action.payload.darkMode !== undefined) {
        document.documentElement.classList.toggle('dark', action.payload.darkMode);
      }
      // Apply box transparency immediately
      if (action.payload.boxTransparency !== undefined) {
        document.documentElement.style.setProperty('--box-transparency', action.payload.boxTransparency);
        document.documentElement.style.setProperty('--box-transparency-dark', (action.payload.boxTransparency * 1.5).toString());
      }
      return { ...state, settings: updatedSettings };

    case ActionTypes.SET_GAMIFICATION:
      return { ...state, gamification: action.payload };

    case ActionTypes.ADD_XP: {
      let xpGain = action.payload?.xp || 0;
      let coinGain = action.payload?.coins || 0;
      const energyBoost = action.payload?.energyBoost || 0;
      
      // Combine buffs/debuffs from all equipped pets
      const equippedPets = (state.gamification.equippedPets || [])
        .map(petId => state.gamification.petInventory?.find(p => p.id === petId))
        .filter(Boolean);
      
      let totalXpBoost = 0;
      let totalXpPenalty = 0;
      let totalCoinBoost = 0;
      let totalCoinPenalty = 0;
      
      equippedPets.forEach(pet => {
        const scaledBuffs = scaleBuffsForLevel(pet.buffs || {}, pet.level || 1);
        const scaledDebuffs = scaleDebuffsForLevel(pet.debuffs || {}, pet.level || 1);
        totalXpBoost += scaledBuffs.xpBoost || 0;
        totalXpPenalty += scaledDebuffs.xpPenalty || 0;
        totalCoinBoost += scaledBuffs.coinBoost || 0;
        totalCoinPenalty += scaledDebuffs.coinPenalty || 0;
      });
      
      // Apply combined pet buffs/debuffs
      if (xpGain !== 0) {
        if (xpGain > 0) {
          xpGain = Math.floor(xpGain * (1 + totalXpBoost / 100) * (1 - totalXpPenalty / 100));
        } else {
          xpGain = Math.floor(xpGain * (1 - totalXpBoost / 100) * (1 + totalXpPenalty / 100));
        }
      }
      if (coinGain !== 0) {
        if (coinGain > 0) {
          coinGain = Math.floor(coinGain * (1 + totalCoinBoost / 100) * (1 - totalCoinPenalty / 100));
        } else {
          coinGain = Math.floor(coinGain * (1 - totalCoinBoost / 100) * (1 + totalCoinPenalty / 100));
        }
      }
      
      // Update energy for all equipped pets
      const updatedPetInventory = state.gamification.petInventory?.map(pet => {
        if (equippedPets.some(ep => ep.id === pet.id)) {
          return {
            ...pet,
            mood: xpGain > 0 ? 'Excited' : pet.mood,
            energy: Math.min(100, (pet.energy || 70) + energyBoost),
          };
        }
        return pet;
      }) || [];
      
      const newXp = Math.max(0, state.gamification.xp + xpGain);
      const newCoins = Math.max(0, state.gamification.coins + coinGain);
      const { level, currentLevelXp, nextLevelXp } = getLevelStats(newXp);
      const updatedGamification = {
        ...state.gamification,
        xp: newXp,
        coins: newCoins,
        level,
        xpForCurrentLevel: currentLevelXp,
        xpForNextLevel: nextLevelXp,
        petInventory: updatedPetInventory,
        lastRewardReason: action.payload?.reason || null,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }

    case ActionTypes.UPDATE_PET: {
      const coinChange = action.payload?.coinsChange || 0;
      const petChanges = action.payload?.petChanges || {};
      const petId = action.payload?.petId; // ID of pet to update
      const newCoins = Math.max(0, state.gamification.coins + coinChange);
      
      // Update specific pet in inventory if petId provided, otherwise update all (for backward compatibility)
      let updatedPetInventory = state.gamification.petInventory || [];
      
      if (petId) {
        updatedPetInventory = updatedPetInventory.map(pet => {
          if (pet.id === petId) {
            const newLevel = petChanges.level ?? pet.level ?? 1;
            const oldLevel = pet.level ?? 1;
            
            const updatedPet = {
              ...pet,
              ...petChanges,
              energy: Math.min(100, Math.max(0, petChanges.energy ?? pet.energy ?? 70)),
              hunger: Math.min(100, Math.max(0, petChanges.hunger ?? pet.hunger ?? 30)),
              level: newLevel,
              exp: petChanges.exp ?? pet.exp ?? 0,
              expForNextLevel: petChanges.expForNextLevel ?? pet.expForNextLevel ?? getExpForLevel(newLevel + 1),
            };
            
            // Apply level-based scaling to buffs/debuffs
            if (petChanges.level !== undefined && newLevel !== oldLevel) {
              const buffsToScale = petChanges.buffs !== undefined ? petChanges.buffs : pet.buffs || {};
              const debuffsToScale = petChanges.debuffs !== undefined ? petChanges.debuffs : pet.debuffs || {};
              updatedPet.buffs = scaleBuffsForLevel(buffsToScale, newLevel);
              updatedPet.debuffs = scaleDebuffsForLevel(debuffsToScale, newLevel);
            } else if (petChanges.buffs !== undefined || petChanges.debuffs !== undefined) {
              updatedPet.buffs = petChanges.buffs !== undefined 
                ? scaleBuffsForLevel(petChanges.buffs, newLevel)
                : (pet.buffs || {});
              updatedPet.debuffs = petChanges.debuffs !== undefined
                ? scaleDebuffsForLevel(petChanges.debuffs, newLevel)
                : (pet.debuffs || {});
            }
            
            return updatedPet;
          }
          return pet;
        });
      }
      
      const updatedGamification = {
        ...state.gamification,
        coins: newCoins,
        petInventory: updatedPetInventory,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }

    case ActionTypes.ADD_PET_TO_INVENTORY: {
      const newPet = action.payload;
      const updatedPetInventory = [...(state.gamification.petInventory || []), newPet];
      const updatedGamification = {
        ...state.gamification,
        petInventory: updatedPetInventory,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }

    case ActionTypes.EQUIP_PET: {
      const petId = action.payload;
      const equippedPets = state.gamification.equippedPets || [];
      
      // Check if already equipped
      if (equippedPets.includes(petId)) {
        return state;
      }
      
      // Check if we can equip more (max 3)
      if (equippedPets.length >= 3) {
        return state;
      }
      
      // Check if pet exists in inventory
      const pet = state.gamification.petInventory?.find(p => p.id === petId);
      if (!pet) {
        return state;
      }
      
      const updatedEquippedPets = [...equippedPets, petId];
      const updatedGamification = {
        ...state.gamification,
        equippedPets: updatedEquippedPets,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }

    case ActionTypes.UNEQUIP_PET: {
      const petId = action.payload;
      const equippedPets = state.gamification.equippedPets || [];
      const updatedEquippedPets = equippedPets.filter(id => id !== petId);
      const updatedGamification = {
        ...state.gamification,
        equippedPets: updatedEquippedPets,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }

    case ActionTypes.UPDATE_INVENTORY: {
      const updatedGamification = {
        ...state.gamification,
        inventory: action.payload,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }

    case ActionTypes.UPDATE_PITY: {
      const updatedGamification = {
        ...state.gamification,
        pityCounter: action.payload,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }
    
    case ActionTypes.SET_QUESTS:
      return { ...state, quests: action.payload };

    case ActionTypes.UPDATE_QUEST_PROGRESS: {
      const { questId, progress } = action.payload;
      const updatedQuests = { ...state.quests };
      updatedQuests.progress = {
        ...updatedQuests.progress,
        [questId]: progress,
      };
      saveQuests(updatedQuests, userId);
      return { ...state, quests: updatedQuests };
    }

    case ActionTypes.COMPLETE_QUEST: {
      const { questId, questType } = action.payload;
      const updatedQuests = { ...state.quests };
      let titleReward = null;
      
      if (questType === 'daily') {
        updatedQuests.daily.quests = updatedQuests.daily.quests.map(q =>
          q.id === questId ? { ...q, completed: true, completedAt: new Date().toISOString() } : q
        );
      } else if (questType === 'weekly') {
        updatedQuests.weekly.quests = updatedQuests.weekly.quests.map(q =>
          q.id === questId ? { ...q, completed: true, completedAt: new Date().toISOString() } : q
        );
      } else if (questType === 'achievement') {
        const achievement = updatedQuests.achievements.find(q => q.id === questId);
        if (achievement && achievement.reward?.title) {
          titleReward = achievement.reward.title;
        }
        updatedQuests.achievements = updatedQuests.achievements.map(q =>
          q.id === questId ? { ...q, completed: true, completedAt: new Date().toISOString() } : q
        );
      }
      
      saveQuests(updatedQuests, userId);
      
      // If achievement grants a title, add it to gamification
      if (titleReward) {
        const updatedGamification = {
          ...state.gamification,
          unlockedTitles: [...(state.gamification.unlockedTitles || []), titleReward],
        };
        saveGamification(updatedGamification, userId);
        return { ...state, quests: updatedQuests, gamification: updatedGamification };
      }
      
      return { ...state, quests: updatedQuests };
    }

    case ActionTypes.RESET_DAILY_QUESTS: {
      const updatedQuests = {
        ...state.quests,
        daily: {
          lastReset: new Date().toISOString(),
          quests: action.payload,
        },
        progress: { ...state.quests.progress },
      };
      // Reset progress for daily quests
      action.payload.forEach(quest => {
        delete updatedQuests.progress[quest.id];
      });
      saveQuests(updatedQuests, userId);
      return { ...state, quests: updatedQuests };
    }

    case ActionTypes.RESET_WEEKLY_QUESTS: {
      const updatedQuests = {
        ...state.quests,
        weekly: {
          lastReset: new Date().toISOString(),
          quests: action.payload,
        },
        progress: { ...state.quests.progress },
      };
      // Reset progress for weekly quests
      action.payload.forEach(quest => {
        delete updatedQuests.progress[quest.id];
      });
      saveQuests(updatedQuests, userId);
      return { ...state, quests: updatedQuests };
    }
    
    case ActionTypes.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    
    case ActionTypes.EQUIP_THEME: {
      const updatedGamification = {
        ...state.gamification,
        currentTheme: action.payload,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }
    
    case ActionTypes.EQUIP_PROFILE_FRAME: {
      const updatedGamification = {
        ...state.gamification,
        currentProfileFrame: action.payload,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }
    
    case ActionTypes.UNEQUIP_PROFILE_FRAME: {
      const updatedGamification = {
        ...state.gamification,
        currentProfileFrame: null,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }
    
    default:
      return state;
  }
};

// Provider component
export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const userId = user?.id || null;

  // Load data from localStorage on mount or when user changes
  useEffect(() => {
    const tasks = getTasks(userId);
    const studyLogs = getStudyLogs(userId);
    const settings = getSettings(userId);
    let gamification = getGamification(userId);
    let quests = getQuests(userId);
    
    // Migrate from old pet system to inventory system
    if (gamification.pet && !gamification.petInventory) {
      const oldPet = gamification.pet;
      // Create initial pet with ID if it doesn't have one
      const migratedPet = {
        id: oldPet.id || `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...oldPet,
        level: oldPet.level || 1,
        exp: oldPet.exp || 0,
        expForNextLevel: oldPet.expForNextLevel || getExpForLevel(2),
        buffs: oldPet.buffs || generatePetBuffs(oldPet.rarity || 'Common').buffs,
        debuffs: oldPet.debuffs || generatePetBuffs(oldPet.rarity || 'Common').debuffs,
      };
      gamification.petInventory = [migratedPet];
      gamification.equippedPets = [migratedPet.id];
      delete gamification.pet;
      saveGamification(gamification, userId);
    }
    
    // Ensure petInventory and equippedPets are initialized
    if (!gamification.petInventory) {
      // Create default pet
      const defaultPet = {
        id: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Pixel',
        species: '🐾',
        rarity: 'Common',
        color: '#0ea5e9',
        mood: 'Happy',
        energy: 70,
        hunger: 30,
        level: 1,
        exp: 0,
        expForNextLevel: getExpForLevel(2),
        ...generatePetBuffs('Common'),
      };
      gamification.petInventory = [defaultPet];
      gamification.equippedPets = [defaultPet.id];
      saveGamification(gamification, userId);
    }
    if (!gamification.equippedPets) {
      gamification.equippedPets = [];
    }
    
    // Ensure all pets in inventory have required fields
    if (gamification.petInventory) {
      gamification.petInventory = gamification.petInventory.map(pet => {
        if (!pet.id) {
          pet.id = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        if (!pet.level) pet.level = 1;
        if (pet.exp === undefined || pet.exp === null) pet.exp = 0;
        if (!pet.expForNextLevel) pet.expForNextLevel = getExpForLevel(pet.level + 1);
        if (!pet.buffs || !pet.debuffs) {
          const { buffs, debuffs } = generatePetBuffs(pet.rarity || 'Common');
          pet.buffs = pet.buffs || buffs;
          pet.debuffs = pet.debuffs || debuffs;
        }
        // Scale buffs/debuffs to current level
        pet.buffs = scaleBuffsForLevel(pet.buffs, pet.level);
        pet.debuffs = scaleDebuffsForLevel(pet.debuffs, pet.level);
        return pet;
      });
      saveGamification(gamification, userId);
    }
    
    // Ensure inventory and pityCounter are initialized
    if (!gamification.inventory) {
      gamification.inventory = {};
    }
    if (gamification.pityCounter === undefined || gamification.pityCounter === null) {
      gamification.pityCounter = 0;
    }
    if (!gamification.unlockedTitles) {
      gamification.unlockedTitles = [];
    }
    if (gamification.equippedTitle === undefined) {
      gamification.equippedTitle = null;
    }
    if (gamification.feedCount === undefined) {
      gamification.feedCount = 0;
    }
    if (!gamification.currentTheme) {
      gamification.currentTheme = 'default';
    }
    if (!gamification.unlockedThemes) {
      gamification.unlockedThemes = ['default'];
    }
    if (!gamification.unlockedProfileFrames) {
      gamification.unlockedProfileFrames = [];
    }
    if (gamification.currentProfileFrame === undefined) {
      gamification.currentProfileFrame = null;
    }
    
    
    // Initialize or reset daily/weekly quests (GMT+7 timezone)
    const lastDailyReset = quests.daily?.lastReset || null;
    const lastWeeklyReset = quests.weekly?.lastReset || null;
    
    // Reset daily quests if needed (12:00 AM GMT+7)
    if (shouldResetDaily(lastDailyReset)) {
      const dailyQuests = generateDailyQuests().map(q => ({ ...q, completed: false }));
      const resetTime = getGMT7Midnight().toISOString();
      dispatch({ type: ActionTypes.RESET_DAILY_QUESTS, payload: dailyQuests, userId });
      quests.daily = { lastReset: resetTime, quests: dailyQuests };
    }
    
    // Reset weekly quests if needed (12:00 AM GMT+7 Monday)
    if (shouldResetWeekly(lastWeeklyReset)) {
      const weeklyQuests = generateWeeklyQuests().map(q => ({ ...q, completed: false }));
      const resetTime = getGMT7Monday().toISOString();
      dispatch({ type: ActionTypes.RESET_WEEKLY_QUESTS, payload: weeklyQuests, userId });
      quests.weekly = { lastReset: resetTime, quests: weeklyQuests };
    }
    
    // Initialize / migrate achievements
    const generatedAchievements = generateAchievementQuests().map(q => ({ ...q, completed: false }));
    if (!quests.achievements || quests.achievements.length === 0) {
      // Fresh init
      quests.achievements = generatedAchievements;
      quests.progress = quests.progress || {};
      saveQuests(quests, userId);
    } else if (quests.achievements.length < generatedAchievements.length) {
      // Migration: merge existing achievements with new ones by id
      const existingById = {};
      quests.achievements.forEach(a => {
        existingById[a.id] = a;
      });
      const merged = generatedAchievements.map(a => {
        const existing = existingById[a.id];
        return existing ? { ...a, completed: existing.completed } : a;
      });
      quests.achievements = merged;
      quests.progress = quests.progress || {};
      saveQuests(quests, userId);
    } else if (!quests.progress) {
      quests.progress = {};
    }
    
    dispatch({ type: ActionTypes.SET_TASKS, payload: tasks, userId });
    dispatch({ type: ActionTypes.SET_STUDY_LOGS, payload: studyLogs, userId });
    dispatch({ type: ActionTypes.SET_SETTINGS, payload: settings, userId });
    dispatch({ type: ActionTypes.SET_GAMIFICATION, payload: gamification, userId });
    dispatch({ type: ActionTypes.SET_QUESTS, payload: quests, userId });
    
    // Apply dark mode
    document.documentElement.classList.toggle('dark', settings.darkMode);
    
    // Apply box transparency
    const boxTransparency = settings.boxTransparency !== undefined ? settings.boxTransparency : 0.08;
    document.documentElement.style.setProperty('--box-transparency', boxTransparency);
    document.documentElement.style.setProperty('--box-transparency-dark', (boxTransparency * 1.5).toString());
  }, [userId]);

  // Automatic quest reset timer (checks every minute)
  useEffect(() => {
    const checkQuestResets = () => {
      const currentQuests = getQuests(userId);
      const lastDailyReset = currentQuests.daily?.lastReset || null;
      const lastWeeklyReset = currentQuests.weekly?.lastReset || null;
      
      // Check and reset daily quests if needed
      if (shouldResetDaily(lastDailyReset)) {
        const dailyQuests = generateDailyQuests().map(q => ({ ...q, completed: false }));
        const resetTime = getGMT7Midnight().toISOString();
        dispatch({ type: ActionTypes.RESET_DAILY_QUESTS, payload: dailyQuests, userId });
      }
      
      // Check and reset weekly quests if needed
      if (shouldResetWeekly(lastWeeklyReset)) {
        const weeklyQuests = generateWeeklyQuests().map(q => ({ ...q, completed: false }));
        const resetTime = getGMT7Monday().toISOString();
        dispatch({ type: ActionTypes.RESET_WEEKLY_QUESTS, payload: weeklyQuests, userId });
      }
    };
    
    // Check immediately
    checkQuestResets();
    
    // Check every minute
    const interval = setInterval(checkQuestResets, 60000);
    
    return () => clearInterval(interval);
  }, [userId, dispatch]);

  // Action creators
  const actions = {
    addTask: (task) => {
      const newTask = {
        id: Date.now().toString(),
        ...task,
        createdAt: new Date().toISOString(),
        completed: false,
      };
      dispatch({ type: ActionTypes.ADD_TASK, payload: newTask, userId });
    },
    
    updateTask: (id, updates) => {
      dispatch({ type: ActionTypes.UPDATE_TASK, payload: { id, ...updates }, userId });
    },
    
    deleteTask: (id) => {
      dispatch({ type: ActionTypes.DELETE_TASK, payload: id, userId });
    },
    
    toggleTask: (id) => {
      const task = state.tasks.find((t) => t.id === id);
      const willComplete = task && !task.completed;
      const willUncomplete = task && task.completed;
      dispatch({ type: ActionTypes.TOGGLE_TASK, payload: id, userId });
      if (willComplete) {
        dispatch({
          type: ActionTypes.ADD_XP,
          payload: { xp: 60, coins: 12, energyBoost: 5, reason: 'Task completed' },
          userId,
        });
        // Quest progress will be checked by Quests component useEffect
      } else if (willUncomplete) {
        // Deduct XP and coins when unchecking a task
        dispatch({
          type: ActionTypes.ADD_XP,
          payload: { xp: -60, coins: -12, energyBoost: 0, reason: 'Task uncompleted' },
          userId,
        });
      }
    },
    
    addStudyLog: (log) => {
      const newLog = {
        id: Date.now().toString(),
        ...log,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: ActionTypes.ADD_STUDY_LOG, payload: newLog, userId });
    },
    
    updateSettings: (updates) => {
      dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: updates, userId });
    },
    
    setActiveTab: (tab) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: tab });
    },

    addXP: (payload) => {
      dispatch({
        type: ActionTypes.ADD_XP,
        payload: payload,
        userId,
      });
    },

    rewardFocusSession: (durationMinutes) => {
      // Scaling algorithm: longer sessions = higher rewards per minute
      // Base rate: 1 XP per minute, 0.2 coins per minute
      const baseXpPerMinute = 1;
      const baseCoinsPerMinute = 0.2;
      
      // Calculate multiplier based on duration
      // Formula: multiplier = 1 + (duration / 60) * 2
      // This gives: 15min = 1.5x, 30min = 2x, 45min = 2.5x, 60min = 3x, etc.
      // Cap at 5x multiplier for very long sessions
      const multiplier = Math.min(1 + (durationMinutes / 60) * 2, 5);
      
      // Calculate rewards
      const xp = Math.floor(durationMinutes * baseXpPerMinute * multiplier);
      const coins = Math.floor(durationMinutes * baseCoinsPerMinute * multiplier);
      
      // Energy boost scales with duration too (more focus = more energy)
      const energyBoost = Math.min(Math.floor(durationMinutes / 5), 10);
      
      dispatch({
        type: ActionTypes.ADD_XP,
        payload: { 
          xp, 
          coins, 
          energyBoost, 
          reason: `Focus session completed (${durationMinutes} min)` 
        },
        userId,
      });
    },

    feedPet: (petId, foodId = 'basic', quantity = 1) => {
      if (!petId) {
        return { success: false, message: 'Please select a pet to feed.' };
      }
      
      const pet = state.gamification.petInventory?.find(p => p.id === petId);
      if (!pet) {
        return { success: false, message: 'Pet not found in inventory.' };
      }
      
      const inventory = state.gamification.inventory || {};
      const foodQuantity = inventory[foodId] || 0;
      
      const requestedQuantity = Math.max(1, Math.floor(quantity || 1));
      if (foodQuantity <= 0 || requestedQuantity <= 0) {
        return { success: false, message: 'You don\'t have any food in your inventory! Buy food from the shop first.' };
      }
      
      const FOOD_ITEMS = {
        basic: { hungerReduction: 25, energyBoost: 12, mood: 'Content' },
        premium: { hungerReduction: 50, energyBoost: 25, mood: 'Happy' },
        treat: { hungerReduction: 15, energyBoost: 20, mood: 'Excited' },
        super: { hungerReduction: 40, energyBoost: 35, mood: 'Ecstatic' },
      };
      
      const food = FOOD_ITEMS[foodId] || FOOD_ITEMS.basic;
      
      // Use up to requestedQuantity food items, but not more than available
      const actualQuantity = Math.min(requestedQuantity, foodQuantity);
      
      // Create new inventory object and remove consumed items
      const newInventory = { ...inventory };
      const remainingQuantity = foodQuantity - actualQuantity;
      if (remainingQuantity > 0) {
        newInventory[foodId] = remainingQuantity;
      } else {
        delete newInventory[foodId];
      }
      
      // Update feed count
      const feedCount = (state.gamification.feedCount || 0) + actualQuantity;
      
      // Calculate new pet stats
      const currentHunger = pet.hunger || 30;
      const currentEnergy = pet.energy || 70;
      const newHunger = Math.max(0, currentHunger - food.hungerReduction * actualQuantity);
      const newEnergy = Math.min(100, currentEnergy + food.energyBoost * actualQuantity);
      
      // Update pet inventory with new stats
      const updatedPetInventory = (state.gamification.petInventory || []).map(p => {
        if (p.id === petId) {
          return {
            ...p,
            hunger: newHunger,
            energy: newEnergy,
            mood: food.mood,
          };
        }
        return p;
      });
      
      // Update everything together: pet stats, inventory, and feed count
      const updatedGamification = {
        ...state.gamification,
        petInventory: updatedPetInventory,
        inventory: newInventory,
        feedCount,
      };
      saveGamification(updatedGamification, userId);
      dispatch({ type: ActionTypes.SET_GAMIFICATION, payload: updatedGamification, userId });
      
      const itemLabel = actualQuantity === 1 ? 'a treat' : `${actualQuantity} treats`;
      return { success: true, message: `${pet.name} enjoyed ${itemLabel}!` };
    },

    buyFood: (foodItem) => {
      // Apply discount buff from all equipped pets
      const equippedPets = (state.gamification.equippedPets || [])
        .map(petId => state.gamification.petInventory?.find(p => p.id === petId))
        .filter(Boolean);
      
      let totalDiscount = 0;
      let totalPriceIncrease = 0;
      equippedPets.forEach(pet => {
        const scaledBuffs = scaleBuffsForLevel(pet.buffs || {}, pet.level || 1);
        const scaledDebuffs = scaleDebuffsForLevel(pet.debuffs || {}, pet.level || 1);
        totalDiscount += scaledBuffs.discount || 0;
        totalPriceIncrease += scaledDebuffs.priceIncrease || 0;
      });
      
      const finalCost = Math.max(1, Math.floor(foodItem.cost * (1 - totalDiscount / 100) * (1 + totalPriceIncrease / 100)));
      
      if (state.gamification.coins < finalCost) {
        return { success: false, message: `Not enough coins! You need ${finalCost} coins.` };
      }
      
      // Add food to inventory instead of feeding immediately
      const inventory = state.gamification.inventory || {};
      const currentQuantity = inventory[foodItem.id] || 0;
      const updatedInventory = { ...inventory };
      updatedInventory[foodItem.id] = currentQuantity + 1;
      
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          coinsChange: -finalCost,
        },
        userId,
      });
      dispatch({ type: ActionTypes.UPDATE_INVENTORY, payload: updatedInventory, userId });
      
      return { success: true, message: `Added ${foodItem.name} to inventory!` };
    },

    playWithPet: (petId) => {
      if (!petId) {
        return { success: false, message: 'Please select a pet to play with.' };
      }
      
      const currentPet = state.gamification.petInventory?.find(p => p.id === petId);
      if (!currentPet) {
        return { success: false, message: 'Pet not found in inventory.' };
      }
      
      const currentEnergy = currentPet.energy || 0;
      
      // Check if pet has energy to play
      if (currentEnergy <= 0) {
        return { 
          success: false, 
          message: `${currentPet.name} is too tired to play! Feed them or wait for energy to recover.` 
        };
      }
      
      const currentLevel = currentPet.level || 1;
      const currentExp = currentPet.exp || 0;
      const currentHunger = currentPet.hunger || 0;
      
      // Grant exp for playing (base 10 exp, scales with level)
      let expGain = 10 + Math.floor(currentLevel * 0.5);
      
      // Apply exp penalty if pet is hungry (>50%) or has low energy (<50%)
      const isHungry = currentHunger > 50;
      const hasLowEnergy = currentEnergy < 50;
      
      if (isHungry || hasLowEnergy) {
        // Reduce exp gain by 50% if either condition is met
        expGain = Math.floor(expGain * 0.5);
      }
      
      let newExp = currentExp + expGain;
      let newLevel = currentLevel;
      let leveledUp = false;
      
      // Check for level up
      while (newExp >= (currentPet.expForNextLevel || getExpForLevel(newLevel + 1))) {
        newExp -= (currentPet.expForNextLevel || getExpForLevel(newLevel + 1));
        newLevel += 1;
        leveledUp = true;
      }
      
      const petChanges = {
        mood: 'Playful',
        energy: Math.max(0, currentPet.energy - 5),
        hunger: Math.min(100, currentPet.hunger + 5),
        exp: newExp,
        level: newLevel,
        expForNextLevel: getExpForLevel(newLevel + 1),
      };
      
      // If leveled up, we need to rescale buffs/debuffs from their current level to new level
      // To avoid double-scaling, we "unscale" from current level, then scale to new level
      if (leveledUp && currentLevel > 1) {
        // Unscale from current level to get base values (approximate)
        const unscaleBuffs = (buffs, level) => {
          if (!buffs || level <= 1) return buffs || {};
          const multiplier = Math.min(1 + (level - 1) * 0.02, 2);
          const unscaled = {};
          for (const [key, value] of Object.entries(buffs)) {
            unscaled[key] = Math.floor(value / multiplier);
          }
          return unscaled;
        };
        const unscaleDebuffs = (debuffs, level) => {
          if (!debuffs || level <= 1) return debuffs || {};
          const multiplier = Math.max(1 - (level - 1) * 0.01, 0.5);
          const unscaled = {};
          for (const [key, value] of Object.entries(debuffs)) {
            unscaled[key] = Math.floor(value / multiplier);
          }
          return unscaled;
        };
        
        const baseBuffs = unscaleBuffs(currentPet.buffs || {}, currentLevel);
        const baseDebuffs = unscaleDebuffs(currentPet.debuffs || {}, currentLevel);
        petChanges.buffs = scaleBuffsForLevel(baseBuffs, newLevel);
        petChanges.debuffs = scaleDebuffsForLevel(baseDebuffs, newLevel);
      } else if (leveledUp && currentLevel === 1) {
        // First level up - scale from base values
        petChanges.buffs = scaleBuffsForLevel(currentPet.buffs || {}, newLevel);
        petChanges.debuffs = scaleDebuffsForLevel(currentPet.debuffs || {}, newLevel);
      }
      
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          petId,
          petChanges,
        },
        userId,
      });
      
      let message = '';
      if (leveledUp) {
        message = `${currentPet.name} loved playing and leveled up to level ${newLevel}! 🎉`;
      } else {
        if (isHungry || hasLowEnergy) {
          const reasons = [];
          if (isHungry) reasons.push('hungry');
          if (hasLowEnergy) reasons.push('low energy');
          message = `${currentPet.name} played but gained reduced exp (+${expGain} exp) due to being ${reasons.join(' and ')}.`;
        } else {
          message = `${currentPet.name} loved playing! (+${expGain} exp)`;
        }
      }
      
      return { success: true, message, leveledUp, newLevel };
    },

    renamePet: (petId, name) => {
      if (!petId) return;
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          petId,
          petChanges: {
            name: name || 'Pixel',
          },
        },
        userId,
      });
    },

    spinForPet: () => {
      // Combine luck from all equipped pets
      const equippedPets = (state.gamification.equippedPets || [])
        .map(petId => state.gamification.petInventory?.find(p => p.id === petId))
        .filter(Boolean);
      
      let totalLuckBoost = 0;
      let totalLuckPenalty = 0;
      equippedPets.forEach(pet => {
        const scaledBuffs = scaleBuffsForLevel(pet.buffs || {}, pet.level || 1);
        const scaledDebuffs = scaleDebuffsForLevel(pet.debuffs || {}, pet.level || 1);
        totalLuckBoost += scaledBuffs.luckBoost || 0;
        totalLuckPenalty += scaledDebuffs.luckPenalty || 0;
      });
      
      const finalCost = Math.max(1, Math.floor(PET_SPIN_COST * (1 - totalLuckBoost / 100) * (1 + totalLuckPenalty / 100)));
      
      if (state.gamification.coins < finalCost) {
        return { success: false, message: `You need ${finalCost} coins to spin.` };
      }
      
      const pityCounter = state.gamification.pityCounter || 0;
      const reward = rollPetReward(pityCounter);
      
      // Update pity counter
      const isRarePlus = reward.rarity === 'Rare' || reward.rarity === 'Epic' || reward.rarity === 'Legendary' || 
                        reward.rarity === 'Mythical' || reward.rarity === 'Secret';
      const newPityCounter = isRarePlus ? 0 : pityCounter + 1;
      
      // Add pet to inventory
      dispatch({
        type: ActionTypes.ADD_PET_TO_INVENTORY,
        payload: reward,
        userId,
      });
      
      // Deduct coins and update pity
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          coinsChange: -finalCost,
        },
        userId,
      });
      dispatch({ type: ActionTypes.UPDATE_PITY, payload: newPityCounter, userId });
      
      return { 
        success: true, 
        reward: {
          ...reward,
          mood: 'Ecstatic',
          energy: 85,
          hunger: 20,
        },
      };
    },
    
    equipPet: (petId) => {
      dispatch({
        type: ActionTypes.EQUIP_PET,
        payload: petId,
        userId,
      });
    },
    
    unequipPet: (petId) => {
      dispatch({
        type: ActionTypes.UNEQUIP_PET,
        payload: petId,
        userId,
      });
    },
    
    // Helper function to get pet's effective food cost (from all equipped pets)
    getFoodCost: (baseCost) => {
      const equippedPets = (state.gamification.equippedPets || [])
        .map(petId => state.gamification.petInventory?.find(p => p.id === petId))
        .filter(Boolean);
      
      let totalDiscount = 0;
      let totalPriceIncrease = 0;
      equippedPets.forEach(pet => {
        const scaledBuffs = scaleBuffsForLevel(pet.buffs || {}, pet.level || 1);
        const scaledDebuffs = scaleDebuffsForLevel(pet.debuffs || {}, pet.level || 1);
        totalDiscount += scaledBuffs.discount || 0;
        totalPriceIncrease += scaledDebuffs.priceIncrease || 0;
      });
      
      return Math.max(1, Math.floor(baseCost * (1 - totalDiscount / 100) * (1 + totalPriceIncrease / 100)));
    },
    
    // Helper function to get pet's effective spin cost
    getSpinCost: () => {
      const equippedPets = (state.gamification.equippedPets || [])
        .map(petId => state.gamification.petInventory?.find(p => p.id === petId))
        .filter(Boolean);
      
      let totalLuckBoost = 0;
      let totalLuckPenalty = 0;
      equippedPets.forEach(pet => {
        const scaledBuffs = scaleBuffsForLevel(pet.buffs || {}, pet.level || 1);
        const scaledDebuffs = scaleDebuffsForLevel(pet.debuffs || {}, pet.level || 1);
        totalLuckBoost += scaledBuffs.luckBoost || 0;
        totalLuckPenalty += scaledDebuffs.luckPenalty || 0;
      });
      return Math.max(1, Math.floor(PET_SPIN_COST * (1 - totalLuckBoost / 100) * (1 + totalLuckPenalty / 100)));
    },

    // Title management
    equipTitle: (title) => {
      const updatedGamification = {
        ...state.gamification,
        equippedTitle: title,
      };
      saveGamification(updatedGamification, userId);
      dispatch({ type: ActionTypes.SET_GAMIFICATION, payload: updatedGamification, userId });
    },

    unequipTitle: () => {
      const updatedGamification = {
        ...state.gamification,
        equippedTitle: null,
      };
      saveGamification(updatedGamification, userId);
      dispatch({ type: ActionTypes.SET_GAMIFICATION, payload: updatedGamification, userId });
    },

    // Theme management
    buyTheme: (theme) => {
      const unlockedThemes = state.gamification.unlockedThemes || ['default'];
      if (unlockedThemes.includes(theme.id)) {
        return { success: false, message: 'You already own this theme!' };
      }
      if (state.gamification.coins < theme.cost) {
        return { success: false, message: `Not enough coins! You need ${theme.cost} coins.` };
      }
      
      const updatedGamification = {
        ...state.gamification,
        coins: state.gamification.coins - theme.cost,
        unlockedThemes: [...unlockedThemes, theme.id],
      };
      saveGamification(updatedGamification, userId);
      dispatch({ type: ActionTypes.SET_GAMIFICATION, payload: updatedGamification, userId });
      return { success: true, message: `Purchased ${theme.name} theme!` };
    },

    equipTheme: (themeId) => {
      const unlockedThemes = state.gamification.unlockedThemes || ['default'];
      if (!unlockedThemes.includes(themeId)) {
        return { success: false, message: 'You need to purchase this theme first!' };
      }
      dispatch({ type: ActionTypes.EQUIP_THEME, payload: themeId, userId });
    },

    // Profile Frame management
    buyProfileFrame: (frame) => {
      const unlockedFrames = state.gamification.unlockedProfileFrames || [];
      if (unlockedFrames.includes(frame.id)) {
        return { success: false, message: 'You already own this frame!' };
      }
      if (state.gamification.coins < frame.cost) {
        return { success: false, message: `Not enough coins! You need ${frame.cost} coins.` };
      }
      
      const updatedGamification = {
        ...state.gamification,
        coins: state.gamification.coins - frame.cost,
        unlockedProfileFrames: [...unlockedFrames, frame.id],
      };
      saveGamification(updatedGamification, userId);
      dispatch({ type: ActionTypes.SET_GAMIFICATION, payload: updatedGamification, userId });
      return { success: true, message: `Purchased ${frame.name}!` };
    },

    equipProfileFrame: (frameId) => {
      const unlockedFrames = state.gamification.unlockedProfileFrames || [];
      if (frameId !== 'none' && !unlockedFrames.includes(frameId)) {
        return { success: false, message: 'You need to purchase this frame first!' };
      }
      dispatch({ type: ActionTypes.EQUIP_PROFILE_FRAME, payload: frameId, userId });
    },

    unequipProfileFrame: () => {
      dispatch({ type: ActionTypes.UNEQUIP_PROFILE_FRAME, userId });
    },

    // Quest checking functions
    checkQuestProgress: (category, value = 1) => {
      const quests = state.quests;
      const allQuests = [
        ...(quests.daily?.quests || []),
        ...(quests.weekly?.quests || []),
        ...(quests.achievements || []),
      ].filter(q => !q.completed && q.category === category);

      allQuests.forEach(quest => {
        const currentProgress = quests.progress[quest.id] || 0;
        let newProgress = currentProgress;
        
        if (category === 'tasks') {
          newProgress = currentProgress + value;
        } else if (category === 'study') {
          newProgress = currentProgress + value; // value is minutes
        } else if (category === 'pomodoro') {
          newProgress = currentProgress + value;
        } else if (category === 'pet') {
          newProgress = currentProgress + value;
        } else if (category === 'level') {
          newProgress = Math.max(currentProgress, value); // level is absolute
        } else if (category === 'achievement') {
          newProgress = Math.max(currentProgress, value); // achievement is absolute
        }

        if (newProgress >= quest.target) {
          // Complete quest
          dispatch({
            type: ActionTypes.COMPLETE_QUEST,
            payload: { questId: quest.id, questType: quest.type },
            userId,
          });
          // Give rewards
          dispatch({
            type: ActionTypes.ADD_XP,
            payload: {
              xp: quest.reward.xp,
              coins: quest.reward.coins,
              reason: `Quest completed: ${quest.title}`,
            },
            userId,
          });
        } else {
          // Update progress
          dispatch({
            type: ActionTypes.UPDATE_QUEST_PROGRESS,
            payload: { questId: quest.id, progress: newProgress },
            userId,
          });
        }
      });
    },

    resetDailyQuests: (quests) => {
      dispatch({ type: ActionTypes.RESET_DAILY_QUESTS, payload: quests, userId });
    },

    resetWeeklyQuests: (quests) => {
      dispatch({ type: ActionTypes.RESET_WEEKLY_QUESTS, payload: quests, userId });
    },
  };

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Export quest generation functions for dev panel
export { generateDailyQuests, generateWeeklyQuests };



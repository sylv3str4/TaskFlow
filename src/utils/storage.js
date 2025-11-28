/**
 * Local Storage Utility
 * Handles all local storage operations for tasks, study logs, and user settings
 * Now supports user-specific data storage
 */

const getStorageKey = (baseKey, userId = null) => {
  return userId ? `${baseKey}_${userId}` : baseKey;
};

const STORAGE_KEYS = {
  TASKS: 'taskflow_tasks',
  STUDY_LOGS: 'taskflow_study_logs',
  SETTINGS: 'taskflow_settings',
  GAMIFICATION: 'taskflow_gamification',
};

/**
 * Get data from local storage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed data or default value
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Save data to local storage
 * @param {string} key - Storage key
 * @param {*} value - Data to save
 */
export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

/**
 * Remove data from local storage
 * @param {string} key - Storage key
 */
export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

// Task storage functions
export const getTasks = (userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.TASKS, userId);
  return getStorage(key, []);
};
export const saveTasks = (tasks, userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.TASKS, userId);
  setStorage(key, tasks);
};

// Study log storage functions
export const getStudyLogs = (userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.STUDY_LOGS, userId);
  return getStorage(key, []);
};
export const saveStudyLogs = (logs, userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.STUDY_LOGS, userId);
  setStorage(key, logs);
};
export const addStudyLog = (log, userId = null) => {
  const logs = getStudyLogs(userId);
  logs.push(log);
  saveStudyLogs(logs, userId);
};

// Settings storage functions
export const getSettings = (userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.SETTINGS, userId);
  return getStorage(key, {
    darkMode: false,
    pomodoroWork: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroLongBreakInterval: 4,
  });
};
export const saveSettings = (settings, userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.SETTINGS, userId);
  setStorage(key, settings);
};

// Gamification storage functions
const defaultGamification = {
  xp: 0,
  level: 1,
  xpForCurrentLevel: 0,
  xpForNextLevel: 500,
  coins: 0,
  pityCounter: 0,
  inventory: {},
  pet: {
    name: 'Pixel',
    species: '🐾',
    rarity: 'Common',
    color: '#0ea5e9',
    mood: 'Happy',
    energy: 70,
    hunger: 30,
    buffs: { xpBoost: 10, coinBoost: 5 },
    debuffs: { xpPenalty: 5 },
  },
  lastRewardReason: null,
};

export const getGamification = (userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.GAMIFICATION, userId);
  return getStorage(key, defaultGamification);
};

export const saveGamification = (data, userId = null) => {
  const key = getStorageKey(STORAGE_KEYS.GAMIFICATION, userId);
  setStorage(key, data);
};


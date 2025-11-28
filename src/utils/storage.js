/**
 * Local Storage Utility
 * Handles all local storage operations for tasks, study logs, and user settings
 */

const STORAGE_KEYS = {
  TASKS: 'smart_study_tasks',
  STUDY_LOGS: 'smart_study_logs',
  SETTINGS: 'smart_study_settings',
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
export const getTasks = () => getStorage(STORAGE_KEYS.TASKS, []);
export const saveTasks = (tasks) => setStorage(STORAGE_KEYS.TASKS, tasks);

// Study log storage functions
export const getStudyLogs = () => getStorage(STORAGE_KEYS.STUDY_LOGS, []);
export const saveStudyLogs = (logs) => setStorage(STORAGE_KEYS.STUDY_LOGS, logs);
export const addStudyLog = (log) => {
  const logs = getStudyLogs();
  logs.push(log);
  saveStudyLogs(logs);
};

// Settings storage functions
export const getSettings = () => getStorage(STORAGE_KEYS.SETTINGS, {
  darkMode: false,
  pomodoroWork: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroLongBreakInterval: 4,
});
export const saveSettings = (settings) => setStorage(STORAGE_KEYS.SETTINGS, settings);


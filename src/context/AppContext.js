/**
 * App Context
 * Centralized state management for the entire application
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getTasks,
  saveTasks,
  getStudyLogs,
  saveStudyLogs,
  getSettings,
  saveSettings,
  getGamification,
  saveGamification,
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

  // UI
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
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
  },
  gamification: {
    xp: 0,
    level: 1,
    xpForCurrentLevel: 0,
    xpForNextLevel: 500,
    coins: 0,
  pet: {
    name: 'Pixel',
    species: '🐾',
    rarity: 'Common',
    color: '#0ea5e9',
    mood: 'Happy',
    energy: 70,
    hunger: 30,
  },
    lastRewardReason: null,
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

const PET_POOL = [
  { name: 'Pixel', species: '🐾', rarity: 'Common', color: '#0ea5e9', chance: 30 },
  { name: 'Blossom', species: '🦊', rarity: 'Rare', color: '#f97316', chance: 20 },
  { name: 'Lumen', species: '🐉', rarity: 'Legendary', color: '#fde047', chance: 5 },
  { name: 'Nimbus', species: '🦄', rarity: 'Epic', color: '#a855f7', chance: 10 },
  { name: 'Pebble', species: '🐢', rarity: 'Common', color: '#10b981', chance: 15 },
  { name: 'Starling', species: '🕊️', rarity: 'Rare', color: '#38bdf8', chance: 12 },
  { name: 'Ember', species: '🐲', rarity: 'Epic', color: '#ef4444', chance: 8 },
];

const rollPetReward = () => {
  const totalChance = PET_POOL.reduce((sum, pet) => sum + pet.chance, 0);
  let roll = Math.random() * totalChance;
  for (const pet of PET_POOL) {
    if (roll < pet.chance) {
      return pet;
    }
    roll -= pet.chance;
  }
  return PET_POOL[0];
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
      return { ...state, settings: updatedSettings };

    case ActionTypes.SET_GAMIFICATION:
      return { ...state, gamification: action.payload };

    case ActionTypes.ADD_XP: {
      const xpGain = action.payload?.xp || 0;
      const coinGain = action.payload?.coins || 0;
      const energyBoost = action.payload?.energyBoost || 0;
      const newXp = state.gamification.xp + xpGain;
      const newCoins = Math.max(0, state.gamification.coins + coinGain);
      const { level, currentLevelXp, nextLevelXp } = getLevelStats(newXp);
      const updatedPet = {
        ...state.gamification.pet,
        mood: xpGain > 0 ? 'Excited' : state.gamification.pet.mood,
        energy: Math.min(100, state.gamification.pet.energy + energyBoost),
      };
      const updatedGamification = {
        ...state.gamification,
        xp: newXp,
        coins: newCoins,
        level,
        xpForCurrentLevel: currentLevelXp,
        xpForNextLevel: nextLevelXp,
        pet: updatedPet,
        lastRewardReason: action.payload?.reason || null,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }

    case ActionTypes.UPDATE_PET: {
      const coinChange = action.payload?.coinsChange || 0;
      const petChanges = action.payload?.petChanges || {};
      const newCoins = Math.max(0, state.gamification.coins + coinChange);
      const updatedPet = {
        ...state.gamification.pet,
        ...petChanges,
        energy: Math.min(100, Math.max(0, petChanges.energy ?? state.gamification.pet.energy)),
        hunger: Math.min(100, Math.max(0, petChanges.hunger ?? state.gamification.pet.hunger)),
      };
      const updatedGamification = {
        ...state.gamification,
        coins: newCoins,
        pet: updatedPet,
      };
      saveGamification(updatedGamification, userId);
      return { ...state, gamification: updatedGamification };
    }
    
    case ActionTypes.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    
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
    const gamification = getGamification(userId);
    
    dispatch({ type: ActionTypes.SET_TASKS, payload: tasks, userId });
    dispatch({ type: ActionTypes.SET_STUDY_LOGS, payload: studyLogs, userId });
    dispatch({ type: ActionTypes.SET_SETTINGS, payload: settings, userId });
    dispatch({ type: ActionTypes.SET_GAMIFICATION, payload: gamification, userId });
    
    // Apply dark mode
    document.documentElement.classList.toggle('dark', settings.darkMode);
  }, [userId]);

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
      dispatch({ type: ActionTypes.TOGGLE_TASK, payload: id, userId });
      if (willComplete) {
        dispatch({
          type: ActionTypes.ADD_XP,
          payload: { xp: 60, coins: 12, energyBoost: 5, reason: 'Task completed' },
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

    rewardFocusSession: () => {
      dispatch({
        type: ActionTypes.ADD_XP,
        payload: { xp: 40, coins: 8, energyBoost: 4, reason: 'Focus session completed' },
        userId,
      });
    },

    feedPet: () => {
      if (state.gamification.coins < 5) {
        return { success: false, message: 'Not enough coins to feed pet.' };
      }
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          coinsChange: -5,
          petChanges: {
            hunger: Math.max(0, state.gamification.pet.hunger - 25),
            energy: Math.min(100, state.gamification.pet.energy + 12),
            mood: 'Content',
          },
        },
        userId,
      });
      return { success: true, message: `${state.gamification.pet.name} enjoyed the treat!` };
    },

    playWithPet: () => {
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          petChanges: {
            mood: 'Playful',
            energy: Math.max(0, state.gamification.pet.energy - 5),
            hunger: Math.min(100, state.gamification.pet.hunger + 5),
          },
        },
        userId,
      });
      return { success: true, message: `${state.gamification.pet.name} loved playing!` };
    },

    renamePet: (name) => {
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          petChanges: {
            name: name || 'Pixel',
          },
        },
        userId,
      });
    },

    spinForPet: () => {
      if (state.gamification.coins < PET_SPIN_COST) {
        return { success: false, message: `You need ${PET_SPIN_COST} coins to spin.` };
      }
      const reward = rollPetReward();
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          coinsChange: -PET_SPIN_COST,
          petChanges: {
            name: reward.name,
            species: reward.species,
            rarity: reward.rarity,
            color: reward.color,
            mood: 'Ecstatic',
            energy: 85,
            hunger: 20,
          },
        },
        userId,
      });
      return { success: true, reward };
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


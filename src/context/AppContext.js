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
  UPDATE_INVENTORY: 'UPDATE_INVENTORY',
  UPDATE_PITY: 'UPDATE_PITY',

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
    pityCounter: 0, // Tracks spins without rare+ pet
    inventory: {}, // Food inventory: { foodId: quantity }
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

// Buff/Debuff system
const BUFF_TYPES = ['xpBoost', 'coinBoost', 'discount', 'luckBoost'];
const DEBUFF_TYPES = ['xpPenalty', 'coinPenalty', 'priceIncrease', 'luckPenalty'];

const getRarityConfig = (rarity) => {
  const configs = {
    Common: { buffCount: [1, 2], debuffCount: [1, 2], buffRange: [5, 15], debuffRange: [5, 15] },
    Rare: { buffCount: [2, 3], debuffCount: [0, 1], buffRange: [10, 25], debuffRange: [5, 10] },
    Epic: { buffCount: [3, 4], debuffCount: [0, 1], buffRange: [15, 35], debuffRange: [0, 5] },
    Legendary: { buffCount: [4, 4], debuffCount: [0, 0], buffRange: [25, 50], debuffRange: [0, 0] },
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
];

const rollPetReward = (pityCounter = 0) => {
  // If pity threshold reached, guarantee rare+ pet
  if (pityCounter >= PITY_THRESHOLD) {
    const rarePets = PET_POOL.filter(pet => 
      pet.rarity === 'Rare' || pet.rarity === 'Epic' || pet.rarity === 'Legendary'
    );
    const selectedPet = rarePets[Math.floor(Math.random() * rarePets.length)];
    const { buffs, debuffs } = generatePetBuffs(selectedPet.rarity);
    return { ...selectedPet, buffs, debuffs };
  }
  
  const totalChance = PET_POOL.reduce((sum, pet) => sum + pet.chance, 0);
  let roll = Math.random() * totalChance;
  for (const pet of PET_POOL) {
    if (roll < pet.chance) {
      const { buffs, debuffs } = generatePetBuffs(pet.rarity);
      return { ...pet, buffs, debuffs };
    }
    roll -= pet.chance;
  }
  const defaultPet = PET_POOL[0];
  const { buffs, debuffs } = generatePetBuffs(defaultPet.rarity);
  return { ...defaultPet, buffs, debuffs };
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
      const pet = state.gamification.pet;
      let xpGain = action.payload?.xp || 0;
      let coinGain = action.payload?.coins || 0;
      const energyBoost = action.payload?.energyBoost || 0;
      
      // Apply pet buffs/debuffs
      if (xpGain !== 0) {
        const xpBoost = (pet.buffs?.xpBoost || 0);
        const xpPenalty = (pet.debuffs?.xpPenalty || 0);
        if (xpGain > 0) {
          // Positive gain: boost increases, penalty decreases
          xpGain = Math.floor(xpGain * (1 + xpBoost / 100) * (1 - xpPenalty / 100));
        } else {
          // Negative gain (penalty): boost reduces penalty, penalty increases penalty
          // For penalties, we reverse the effect - boost reduces penalty, penalty increases it
          xpGain = Math.floor(xpGain * (1 - xpBoost / 100) * (1 + xpPenalty / 100));
        }
      }
      if (coinGain !== 0) {
        const coinBoost = (pet.buffs?.coinBoost || 0);
        const coinPenalty = (pet.debuffs?.coinPenalty || 0);
        if (coinGain > 0) {
          // Positive gain: boost increases, penalty decreases
          coinGain = Math.floor(coinGain * (1 + coinBoost / 100) * (1 - coinPenalty / 100));
        } else {
          // Negative gain (penalty): boost reduces penalty, penalty increases penalty
          coinGain = Math.floor(coinGain * (1 - coinBoost / 100) * (1 + coinPenalty / 100));
        }
      }
      
      const newXp = Math.max(0, state.gamification.xp + xpGain);
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
    let gamification = getGamification(userId);
    
    // Ensure pet has buffs/debuffs (for existing pets that don't have them)
    if (gamification.pet && (!gamification.pet.buffs || !gamification.pet.debuffs)) {
      const { buffs, debuffs } = generatePetBuffs(gamification.pet.rarity || 'Common');
      gamification = {
        ...gamification,
        pet: {
          ...gamification.pet,
          buffs: gamification.pet.buffs || buffs,
          debuffs: gamification.pet.debuffs || debuffs,
        },
      };
      saveGamification(gamification, userId);
    }
    
    // Ensure inventory and pityCounter are initialized
    if (!gamification.inventory) {
      gamification.inventory = {};
    }
    if (gamification.pityCounter === undefined || gamification.pityCounter === null) {
      gamification.pityCounter = 0;
    }
    
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
      const willUncomplete = task && task.completed;
      dispatch({ type: ActionTypes.TOGGLE_TASK, payload: id, userId });
      if (willComplete) {
        dispatch({
          type: ActionTypes.ADD_XP,
          payload: { xp: 60, coins: 12, energyBoost: 5, reason: 'Task completed' },
          userId,
        });
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

    rewardFocusSession: () => {
      dispatch({
        type: ActionTypes.ADD_XP,
        payload: { xp: 40, coins: 8, energyBoost: 4, reason: 'Focus session completed' },
        userId,
      });
    },

    feedPet: (foodId = 'basic') => {
      const inventory = state.gamification.inventory || {};
      const foodQuantity = inventory[foodId] || 0;
      
      if (foodQuantity <= 0) {
        return { success: false, message: 'You don\'t have any food in your inventory! Buy food from the shop first.' };
      }
      
      const FOOD_ITEMS = {
        basic: { hungerReduction: 25, energyBoost: 12, mood: 'Content' },
        premium: { hungerReduction: 50, energyBoost: 25, mood: 'Happy' },
        treat: { hungerReduction: 15, energyBoost: 20, mood: 'Excited' },
        super: { hungerReduction: 40, energyBoost: 35, mood: 'Ecstatic' },
      };
      
      const food = FOOD_ITEMS[foodId] || FOOD_ITEMS.basic;
      
      // Use one food item
      const newInventory = { ...inventory };
      newInventory[foodId] = Math.max(0, foodQuantity - 1);
      if (newInventory[foodId] === 0) {
        delete newInventory[foodId];
      }
      
      dispatch({ type: ActionTypes.UPDATE_INVENTORY, payload: newInventory, userId });
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          petChanges: {
            hunger: Math.max(0, state.gamification.pet.hunger - food.hungerReduction),
            energy: Math.min(100, state.gamification.pet.energy + food.energyBoost),
            mood: food.mood,
          },
        },
        userId,
      });
      return { success: true, message: `${state.gamification.pet.name} enjoyed the treat!` };
    },

    buyFood: (foodItem) => {
      const pet = state.gamification.pet;
      // Apply discount buff
      const discount = pet.buffs?.discount || 0;
      const priceIncrease = pet.debuffs?.priceIncrease || 0;
      const finalCost = Math.max(1, Math.floor(foodItem.cost * (1 - discount / 100) * (1 + priceIncrease / 100)));
      
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
      const pet = state.gamification.pet;
      // Apply luck buff/debuff to spin cost (luck affects chance, but we can also affect cost)
      const luckBoost = pet.buffs?.luckBoost || 0;
      const luckPenalty = pet.debuffs?.luckPenalty || 0;
      const finalCost = Math.max(1, Math.floor(PET_SPIN_COST * (1 - luckBoost / 100) * (1 + luckPenalty / 100)));
      
      if (state.gamification.coins < finalCost) {
        return { success: false, message: `You need ${finalCost} coins to spin.` };
      }
      
      const pityCounter = state.gamification.pityCounter || 0;
      const reward = rollPetReward(pityCounter);
      
      // Update pity counter
      const isRarePlus = reward.rarity === 'Rare' || reward.rarity === 'Epic' || reward.rarity === 'Legendary';
      const newPityCounter = isRarePlus ? 0 : pityCounter + 1;
      
      // Deduct coins and update pity, but don't switch pet yet
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
        oldPet: state.gamification.pet,
      };
    },
    
    switchToNewPet: (newPet) => {
      dispatch({
        type: ActionTypes.UPDATE_PET,
        payload: {
          petChanges: {
            name: newPet.name,
            species: newPet.species,
            rarity: newPet.rarity,
            color: newPet.color,
            buffs: newPet.buffs,
            debuffs: newPet.debuffs,
            mood: newPet.mood || 'Ecstatic',
            energy: newPet.energy || 85,
            hunger: newPet.hunger || 20,
          },
        },
        userId,
      });
    },
    
    // Helper function to get pet's effective food cost
    getFoodCost: (baseCost) => {
      const pet = state.gamification.pet;
      const discount = pet.buffs?.discount || 0;
      const priceIncrease = pet.debuffs?.priceIncrease || 0;
      return Math.max(1, Math.floor(baseCost * (1 - discount / 100) * (1 + priceIncrease / 100)));
    },
    
    // Helper function to get pet's effective spin cost
    getSpinCost: () => {
      const pet = state.gamification.pet;
      const luckBoost = pet.buffs?.luckBoost || 0;
      const luckPenalty = pet.debuffs?.luckPenalty || 0;
      return Math.max(1, Math.floor(PET_SPIN_COST * (1 - luckBoost / 100) * (1 + luckPenalty / 100)));
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


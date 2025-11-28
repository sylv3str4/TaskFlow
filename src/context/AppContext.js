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
  activeTab: 'tasks',
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
    
    dispatch({ type: ActionTypes.SET_TASKS, payload: tasks, userId });
    dispatch({ type: ActionTypes.SET_STUDY_LOGS, payload: studyLogs, userId });
    dispatch({ type: ActionTypes.SET_SETTINGS, payload: settings, userId });
    
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
      dispatch({ type: ActionTypes.TOGGLE_TASK, payload: id, userId });
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


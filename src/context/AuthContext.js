/**
 * Authentication Context
 * Manages user authentication and account system
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStorage, setStorage, removeStorage } from '../utils/storage';

const AuthContext = createContext();

const STORAGE_KEY = 'taskflow_auth';
const USERS_KEY = 'taskflow_users';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const savedUser = getStorage(STORAGE_KEY);
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  // Register a new user
  const signup = useCallback((email, password, username) => {
    const users = getStorage(USERS_KEY, []);
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User with this email already exists');
    }

    // Check if username already exists
    if (users.find(u => u.username === username)) {
      throw new Error('Username already taken');
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      username,
      createdAt: new Date().toISOString(),
    };

    // Store password (in production, this should be hashed)
    const userWithPassword = { ...newUser, password };
    users.push(userWithPassword);
    setStorage(USERS_KEY, users);

    // Auto-login after signup
    setUser(newUser);
    setStorage(STORAGE_KEY, newUser);
    
    return newUser;
  }, []);

  // Login user
  const login = useCallback((email, password) => {
    const users = getStorage(USERS_KEY, []);
    const userWithPassword = users.find(u => u.email === email && u.password === password);

    if (!userWithPassword) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userData } = userWithPassword;
    setUser(userData);
    setStorage(STORAGE_KEY, userData);
    
    return userData;
  }, []);

  // Logout user
  const logout = useCallback(() => {
    setUser(null);
    removeStorage(STORAGE_KEY);
  }, []);

  // Update user profile
  const updateProfile = useCallback((updates) => {
    const users = getStorage(USERS_KEY, []);
    
    // Check if username is being updated and if it's already taken
    if (updates.username && updates.username !== user.username) {
      if (users.find(u => u.id !== user.id && u.username === updates.username)) {
        throw new Error('Username already taken');
      }
    }
    
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, ...updates } : u
    );
    setStorage(USERS_KEY, updatedUsers);

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setStorage(STORAGE_KEY, updatedUser);
    
    return updatedUser;
  }, [user]);

  const value = {
    user,
    isLoading,
    signup,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


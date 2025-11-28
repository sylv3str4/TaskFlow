/**
 * Settings Component
 * User preferences and app settings
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleToggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      localStorage.clear();
      window.location.reload();
    } else {
      setShowClearConfirm(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your preferences and app settings
        </p>
      </div>

      {/* Appearance Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Appearance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Toggle between light and dark theme
              </p>
            </div>
            <button
              onClick={handleToggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.darkMode ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Management
        </h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-2">
              Clear All Data
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will permanently delete all your tasks, study logs, and settings. This action cannot be undone.
            </p>
            {showClearConfirm ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                    Are you sure? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleClearData}
                className="btn-secondary flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={18} />
                Clear All Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          About
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong className="text-gray-900 dark:text-white">TaskFlow</strong>
          </p>
          <p>Version 1.0.0</p>
          <p>
            A comprehensive study dashboard for planning, tracking, and optimizing your study sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;


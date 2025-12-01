/**
 * User Profile Component
 * Displays and manages user profile information and productivity stats
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { 
  User, Mail, Calendar, Edit2, Save, X, Coins, 
  TrendingUp, Target, Zap
} from 'lucide-react';
import { format } from 'date-fns';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const { gamification, tasks, studyLogs } = useApp();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const currentFrame = gamification?.currentProfileFrame;

  const totalStudyMinutes = studyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const totalCompletedTasks = tasks.filter(t => t.completed).length;
  const totalCoins = gamification?.coins || 0;

  const currentXp = gamification?.xp || 0;
  const xpFloor = gamification?.xpForCurrentLevel ?? 0;
  const xpCeil = gamification?.xpForNextLevel ?? 500;
  const levelProgress = xpCeil > xpFloor 
    ? Math.min(100, Math.max(0, ((currentXp - xpFloor) / (xpCeil - xpFloor)) * 100))
    : 0;

  const handleSave = () => {
    try {
      updateProfile(formData);
      setIsEditing(false);
      success('Profile updated successfully!');
    } catch (err) {
      error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in page-enter">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="icon-theme" size={28} />
            Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account and keep track of your productivity stats
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit2 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Profile Overview Card */}
        <div className="card">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with Frame */}
            <div className="relative">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center shadow-xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, var(--theme-color-from), var(--theme-color-via), var(--theme-color-to))`,
                  boxShadow: `0 20px 25px -5px var(--theme-icon-color, rgba(14, 165, 233, 0.3))`
                }}
              >
                <User className="text-white" size={56} />
                {currentFrame && (
                  <div className="absolute inset-0 rounded-full border-4 animate-pulse-slow" 
                    style={{ borderColor: 'var(--theme-icon-color)' }} />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field text-2xl font-bold"
                  />
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.username}
                  </h3>
                )}
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center md:justify-start gap-2">
                  <Mail size={16} />
                  {user.email}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center md:justify-start gap-2">
                <Calendar size={14} />
                Member since {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save size={18} />
                Save Changes
              </button>
              <button onClick={handleCancel} className="btn-secondary flex items-center gap-2">
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-compact">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}>
                <TrendingUp className="icon-theme" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Level</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{gamification?.level || 1}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${levelProgress}%`,
                  background: `linear-gradient(to right, var(--theme-progress-from), var(--theme-progress-via), var(--theme-progress-to))`
                }}
              />
            </div>
          </div>

          <div className="card-compact">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}>
                <Target className="icon-theme" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCompletedTasks}</p>
              </div>
            </div>
          </div>

          <div className="card-compact">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}>
                <Zap className="icon-theme" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Study Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
                </p>
              </div>
            </div>
          </div>

          <div className="card-compact">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}>
                <Coins className="icon-theme" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Coins Earned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCoins}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;


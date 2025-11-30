/**
 * User Profile Component
 * Displays and manages user profile information, achievements, and titles
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { 
  User, Mail, Calendar, Edit2, Save, X, Award, CheckCircle, Star, Coins, 
  TrendingUp, Target, Zap, Trophy, Crown, Sparkles, Frame, Search, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { getThemeColors } from '../utils/theme';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const { quests, gamification, tasks, studyLogs, equipTitle, unequipTitle, checkQuestProgress } = useApp();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [achievementSearch, setAchievementSearch] = useState('');
  const [achievementFilter, setAchievementFilter] = useState('all'); // all, completed, in-progress
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const currentTheme = gamification?.currentTheme || 'default';
  const themeColors = getThemeColors(currentTheme);

  // Check achievement progress
  useEffect(() => {
    if (!quests || !checkQuestProgress) return;
    
    // Check level achievements
    if (gamification?.level) {
      const levelQuests = quests.achievements?.filter(q => q.category === 'level' && !q.completed);
      levelQuests?.forEach(quest => {
        const currentProgress = quests.progress?.[quest.id] || 0;
        if (gamification.level > currentProgress && gamification.level >= quest.target) {
          checkQuestProgress('level', gamification.level);
        }
      });
    }

    // Check task achievements
    const totalCompleted = tasks.filter(t => t.completed).length;
    const taskQuests = quests.achievements?.filter(q => q.category === 'tasks' && !q.completed);
    taskQuests?.forEach(quest => {
      const currentProgress = quests.progress?.[quest.id] || 0;
      if (totalCompleted > currentProgress && totalCompleted >= quest.target) {
        checkQuestProgress('tasks', totalCompleted - currentProgress);
      }
    });

    // Check study time achievements
    const totalStudyMinutes = studyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const studyQuests = quests.achievements?.filter(q => q.category === 'study' && !q.completed);
    studyQuests?.forEach(quest => {
      const currentProgress = quests.progress?.[quest.id] || 0;
      if (totalStudyMinutes > currentProgress && totalStudyMinutes >= quest.target) {
        checkQuestProgress('study', totalStudyMinutes - currentProgress);
      }
    });

    // Check pomodoro achievements
    const totalPomodoros = studyLogs.filter(log => log.type === 'pomodoro' || log.type === 'work').length;
    const pomodoroQuests = quests.achievements?.filter(q => q.category === 'pomodoro' && !q.completed);
    pomodoroQuests?.forEach(quest => {
      const currentProgress = quests.progress?.[quest.id] || 0;
      if (totalPomodoros > currentProgress && totalPomodoros >= quest.target) {
        checkQuestProgress('pomodoro', totalPomodoros - currentProgress);
      }
    });

    // Check pet rarity achievements
    const petRarity = gamification?.pet?.rarity;
    if (petRarity) {
      if (petRarity === 'Rare' || petRarity === 'Epic' || petRarity === 'Legendary') {
        const rareQuest = quests.achievements?.find(q => q.id === 'achieve_get_rare_pet' && !q.completed);
        if (rareQuest) {
          const currentProgress = quests.progress?.[rareQuest.id] || 0;
          if (currentProgress < 1) {
            checkQuestProgress('pet', 1);
          }
        }
      }
      if (petRarity === 'Epic' || petRarity === 'Legendary' || petRarity === 'Mythical' || petRarity === 'Secret') {
        const epicQuest = quests.achievements?.find(q => q.id === 'achieve_get_epic_pet' && !q.completed);
        if (epicQuest) {
          const currentProgress = quests.progress?.[epicQuest.id] || 0;
          if (currentProgress < 1) {
            checkQuestProgress('pet', 1);
          }
        }
      }
      if (petRarity === 'Legendary' || petRarity === 'Mythical' || petRarity === 'Secret') {
        const legendaryQuest = quests.achievements?.find(q => q.id === 'achieve_get_legendary_pet' && !q.completed);
        if (legendaryQuest) {
          const currentProgress = quests.progress?.[legendaryQuest.id] || 0;
          if (currentProgress < 1) {
            checkQuestProgress('pet', 1);
          }
        }
      }
      if (petRarity === 'Mythical' || petRarity === 'Secret') {
        const mythicalQuest = quests.achievements?.find(q => q.id === 'achieve_get_mythical_pet' && !q.completed);
        if (mythicalQuest) {
          const currentProgress = quests.progress?.[mythicalQuest.id] || 0;
          if (currentProgress < 1) {
            checkQuestProgress('pet', 1);
          }
        }
      }
      if (petRarity === 'Secret') {
        const secretQuest = quests.achievements?.find(q => q.id === 'achieve_get_secret_pet' && !q.completed);
        if (secretQuest) {
          const currentProgress = quests.progress?.[secretQuest.id] || 0;
          if (currentProgress < 1) {
            checkQuestProgress('pet', 1);
          }
        }
      }
    }

    // Check coin achievements
    const totalCoins = gamification?.coins || 0;
    const coinQuests = quests.achievements?.filter(q => q.category === 'coins' && !q.completed);
    coinQuests?.forEach(quest => {
      const currentProgress = quests.progress?.[quest.id] || 0;
      if (totalCoins > currentProgress && totalCoins >= quest.target) {
        checkQuestProgress('coins', totalCoins);
      }
    });

    // Check feed achievements
    const feedCount = gamification?.feedCount || 0;
    const feedQuests = quests.achievements?.filter(q => 
      (q.id === 'achieve_feed_pet_50_times' || q.id === 'achieve_feed_pet_100_times') && !q.completed
    );
    feedQuests?.forEach(quest => {
      const currentProgress = quests.progress?.[quest.id] || 0;
      if (feedCount > currentProgress && feedCount >= quest.target) {
        checkQuestProgress('pet', feedCount);
      }
    });
  }, [tasks, studyLogs, gamification?.level, gamification?.pet?.rarity, gamification?.coins, gamification?.feedCount, quests, checkQuestProgress]);

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

  const handleEquipTitle = (title) => {
    if (title === gamification?.equippedTitle) {
      unequipTitle();
      success('Title unequipped');
    } else {
      equipTitle(title);
      success(`Title "${title}" equipped!`);
    }
  };

  const getAchievementProgress = (achievement) => {
    const progress = quests.progress?.[achievement.id] || 0;
    const isCompleted = achievement.completed || progress >= achievement.target;
    
    let currentProgress = progress;
    if (achievement.category === 'level') {
      currentProgress = gamification?.level || 0;
    } else if (achievement.category === 'tasks') {
      currentProgress = tasks.filter(t => t.completed).length;
    } else if (achievement.category === 'study') {
      currentProgress = studyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    } else if (achievement.category === 'pomodoro') {
      currentProgress = studyLogs.filter(log => log.type === 'pomodoro' || log.type === 'work').length;
    } else if (achievement.category === 'pet') {
      if (achievement.id === 'achieve_get_rare_pet') {
        currentProgress = (gamification?.pet?.rarity === 'Rare' || gamification?.pet?.rarity === 'Epic' || gamification?.pet?.rarity === 'Legendary') ? 1 : 0;
      } else if (achievement.id === 'achieve_get_epic_pet') {
        currentProgress = (gamification?.pet?.rarity === 'Epic' || gamification?.pet?.rarity === 'Legendary' || 
                          gamification?.pet?.rarity === 'Mythical' || gamification?.pet?.rarity === 'Secret') ? 1 : 0;
      } else if (achievement.id === 'achieve_get_legendary_pet') {
        currentProgress = (gamification?.pet?.rarity === 'Legendary' || gamification?.pet?.rarity === 'Mythical' || 
                          gamification?.pet?.rarity === 'Secret') ? 1 : 0;
      } else if (achievement.id === 'achieve_get_mythical_pet') {
        currentProgress = (gamification?.pet?.rarity === 'Mythical' || gamification?.pet?.rarity === 'Secret') ? 1 : 0;
      } else if (achievement.id === 'achieve_get_secret_pet') {
        currentProgress = gamification?.pet?.rarity === 'Secret' ? 1 : 0;
      } else if (achievement.id === 'achieve_feed_pet_50_times' || achievement.id === 'achieve_feed_pet_100_times') {
        currentProgress = gamification?.feedCount || 0;
      } else {
        currentProgress = progress;
      }
    } else if (achievement.category === 'coins') {
      currentProgress = gamification?.coins || 0;
    } else if (achievement.category === 'streak') {
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < achievement.target; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const hasStudy = studyLogs.some(log => {
          const logDate = new Date(log.timestamp);
          return logDate.toDateString() === checkDate.toDateString();
        });
        if (hasStudy) {
          streak++;
        } else {
          break;
        }
      }
      currentProgress = streak;
    } else {
      currentProgress = progress;
    }
    
    return {
      current: Math.min(currentProgress, achievement.target),
      target: achievement.target,
      percent: Math.min(100, (currentProgress / achievement.target) * 100),
      isCompleted,
    };
  };

  if (!user) return null;

  const achievements = quests?.achievements || [];
  const unlockedTitles = gamification?.unlockedTitles || [];
  const equippedTitle = gamification?.equippedTitle;
  const completedCount = achievements.filter(a => a.completed).length;

  // Filter and search achievements
  const filteredAchievements = achievements.filter(achievement => {
    const progress = getAchievementProgress(achievement);
    
    // Search filter
    const matchesSearch = achievementSearch === '' || 
      achievement.title.toLowerCase().includes(achievementSearch.toLowerCase()) ||
      achievement.description.toLowerCase().includes(achievementSearch.toLowerCase());
    
    // Status filter
    let matchesFilter = true;
    if (achievementFilter === 'completed') {
      matchesFilter = progress.isCompleted;
    } else if (achievementFilter === 'in-progress') {
      matchesFilter = !progress.isCompleted && progress.current > 0;
    }
    
    return matchesSearch && matchesFilter;
  });
  const totalStudyMinutes = studyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const totalCompletedTasks = tasks.filter(t => t.completed).length;
  const currentFrame = gamification?.currentProfileFrame;

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
            {activeTab === 'profile' ? 'Manage your account and view stats' : 'Track your achievements and progress'}
          </p>
        </div>
        {activeTab === 'profile' && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit2 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'profile'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <User size={18} />
            Profile
          </div>
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-6 py-3 font-medium transition-all duration-300 border-b-2 ${
            activeTab === 'achievements'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className="icon-theme" size={18} />
            Achievements
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {completedCount}/{achievements.length}
            </span>
          </div>
        </button>
      </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
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
                {equippedTitle && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1"
                      style={{
                        background: `linear-gradient(to right, var(--theme-color-from), var(--theme-color-to))`
                      }}
                    >
                      <Crown size={12} />
                      {equippedTitle}
                    </div>
                  </div>
                )}
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
                    width: `${((gamification?.xpForCurrentLevel || 0) / (gamification?.xpForNextLevel || 500)) * 100}%`,
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
                  <Trophy className="icon-theme" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Achievements</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedCount}/{achievements.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Title Selection */}
          {unlockedTitles.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="icon-theme" size={20} />
                Unlocked Titles
              </h3>
              <div className="flex flex-wrap gap-3">
                {unlockedTitles.map((title) => (
                  <button
                    key={title}
                    onClick={() => handleEquipTitle(title)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                      equippedTitle === title
                        ? 'text-white shadow-lg transform scale-105'
                        : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                    style={equippedTitle === title ? {
                      background: `linear-gradient(to right, var(--theme-color-from), var(--theme-color-to))`
                    } : {}}
                  >
                    <Crown size={16} />
                    {title}
                    {equippedTitle === title && <CheckCircle size={16} className="ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab Content */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Achievement Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-compact">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
                </div>
              </div>
            </div>
            <div className="card-compact">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}>
                  <Target className="icon-theme" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{achievements.length - completedCount}</p>
                </div>
              </div>
            </div>
            <div className="card-compact">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                  <Star className="text-yellow-600 dark:text-yellow-400" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {achievements.length > 0 ? Math.round((completedCount / achievements.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Title Selection in Achievements Tab */}
          {unlockedTitles.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Crown className="icon-theme" size={20} />
                Equipped Title
              </h3>
              <div className="flex flex-wrap gap-3">
                {unlockedTitles.map((title) => (
                  <button
                    key={title}
                    onClick={() => handleEquipTitle(title)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                      equippedTitle === title
                        ? 'text-white shadow-lg transform scale-105'
                        : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                    style={equippedTitle === title ? {
                      background: `linear-gradient(to right, var(--theme-color-from), var(--theme-color-to))`
                    } : {}}
                  >
                    <Crown size={16} />
                    {title}
                    {equippedTitle === title && <CheckCircle size={16} className="ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Grid */}
          <div className="card hover:scale-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="icon-theme" size={20} />
                All Achievements
              </h3>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search achievements..."
                    value={achievementSearch}
                    onChange={(e) => setAchievementSearch(e.target.value)}
                    className="input-field pl-10 pr-4"
                  />
                </div>
                
                {/* Filter Dropdown */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
                  <select
                    value={achievementFilter}
                    onChange={(e) => setAchievementFilter(e.target.value)}
                    className="input-field pl-10 pr-8 appearance-none cursor-pointer"
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
              </div>
            </div>
            
            {achievements.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">No achievements available</p>
              </div>
            ) : filteredAchievements.length === 0 ? (
              <div className="text-center py-12">
                <Search className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-500 dark:text-gray-400">No achievements match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map((achievement) => {
                  const progress = getAchievementProgress(achievement);
                  return (
                    <button
                      key={achievement.id}
                      onClick={() => setSelectedAchievement(achievement)}
                      className={`text-left card-compact transition-all duration-300 hover:scale-[1.02] hover:shadow-xl relative overflow-hidden ${
                        progress.isCompleted
                          ? 'ring-2 ring-green-500/50 dark:ring-green-400/50'
                          : ''
                      }`}
                    >
                      {progress.isCompleted && (
                        <div className="absolute top-2 right-2">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <CheckCircle className="text-white" size={20} />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center mb-4">
                        <div
                          className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-lg ${
                            progress.isCompleted
                              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <h4 className={`font-bold text-lg mb-1 ${
                          progress.isCompleted
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {achievement.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {achievement.description}
                        </p>
                      </div>

                      {!progress.isCompleted && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">Progress</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {progress.current} / {progress.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${progress.percent}%`,
                                background: `linear-gradient(to right, var(--theme-progress-from), var(--theme-progress-via), var(--theme-progress-to))`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Star size={14} />
                          <span className="text-xs font-semibold">{achievement.reward.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Coins size={14} />
                          <span className="text-xs font-semibold">{achievement.reward.coins}</span>
                        </div>
                        {achievement.reward.title && (
                          <div className="flex items-center gap-1" style={{ color: 'var(--theme-icon-color)' }}>
                            <Award size={14} />
                            <span className="text-xs font-semibold">{achievement.reward.title}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="card max-w-lg w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${
                    selectedAchievement.completed
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {selectedAchievement.icon}
                </div>
                {selectedAchievement.title}
              </h3>
              <button
                onClick={() => setSelectedAchievement(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 transform hover:rotate-90 hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {selectedAchievement.description}
              </p>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Requirement</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {selectedAchievement.requirement || selectedAchievement.description}
                  </span>
                </div>
                {(() => {
                  const progress = getAchievementProgress(selectedAchievement);
                  return (
                    <>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Progress</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {progress.current} / {progress.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${progress.percent}%`,
                            background: `linear-gradient(to right, var(--theme-progress-from), var(--theme-progress-via), var(--theme-progress-to))`
                          }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rewards:</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                    <Star className="text-yellow-600 dark:text-yellow-400" size={18} />
                    <span className="font-semibold text-yellow-700 dark:text-yellow-300">{selectedAchievement.reward.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                    <Coins className="text-yellow-600 dark:text-yellow-400" size={18} />
                    <span className="font-semibold text-yellow-700 dark:text-yellow-300">{selectedAchievement.reward.coins} Coins</span>
                  </div>
                  {selectedAchievement.reward.title && (
                    <div 
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
                      style={{
                        background: `linear-gradient(to right, var(--theme-color-from), var(--theme-color-to))`
                      }}
                    >
                      <Award size={18} />
                      <span className="font-semibold">Title: {selectedAchievement.reward.title}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedAchievement.completed && selectedAchievement.reward?.title && (
                <button
                  onClick={() => {
                    handleEquipTitle(selectedAchievement.reward.title);
                    setSelectedAchievement(null);
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Crown size={18} />
                  {equippedTitle === selectedAchievement.reward.title ? 'Unequip' : 'Equip'} Title
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

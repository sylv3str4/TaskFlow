/**
 * User Profile Component
 * Displays and manages user profile information, achievements, and titles
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Calendar, Edit2, Save, X, Award, CheckCircle, Star, Coins, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const { quests, gamification, tasks, studyLogs, equipTitle, unequipTitle, checkQuestProgress } = useApp();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile, achievements
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

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
      if (petRarity === 'Epic' || petRarity === 'Legendary') {
        const epicQuest = quests.achievements?.find(q => q.id === 'achieve_get_epic_pet' && !q.completed);
        if (epicQuest) {
          const currentProgress = quests.progress?.[epicQuest.id] || 0;
          if (currentProgress < 1) {
            checkQuestProgress('pet', 1);
          }
        }
      }
      if (petRarity === 'Legendary') {
        const legendaryQuest = quests.achievements?.find(q => q.id === 'achieve_get_legendary_pet' && !q.completed);
        if (legendaryQuest) {
          const currentProgress = quests.progress?.[legendaryQuest.id] || 0;
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
    
    // Calculate current progress based on category
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
        currentProgress = (gamification?.pet?.rarity === 'Epic' || gamification?.pet?.rarity === 'Legendary') ? 1 : 0;
      } else if (achievement.id === 'achieve_get_legendary_pet') {
        currentProgress = gamification?.pet?.rarity === 'Legendary' ? 1 : 0;
      } else if (achievement.id === 'achieve_feed_pet_50_times' || achievement.id === 'achieve_feed_pet_100_times') {
        currentProgress = gamification?.feedCount || 0;
      } else {
        currentProgress = progress;
      }
    } else if (achievement.category === 'coins') {
      currentProgress = gamification?.coins || 0;
    } else if (achievement.category === 'streak') {
      // Streak calculation - check consecutive days with study logs
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="text-primary-500" size={28} />
            Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {activeTab === 'profile' ? 'Manage your account information' : 'View your achievements and titles'}
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
          className={`px-4 py-2 font-semibold text-sm transition-all duration-200 border-b-2 ${
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
          className={`px-4 py-2 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === 'achievements'
              ? 'border-theme text-theme'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Award size={18} />
            Achievements ({achievements.filter(a => a.completed).length}/{achievements.length})
          </div>
        </button>
      </div>

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-6 mb-6">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-color-from), var(--theme-color-via), var(--theme-color-to))`,
              boxShadow: `0 10px 15px -3px var(--theme-icon-color, rgba(14, 165, 233, 0.25))`
            }}
          >
            <User className="text-white" size={40} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                  />
                ) : (
                  user.username
                )}
              </h3>
              {equippedTitle && (
                <span className="badge bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-md">
                  <Award size={14} />
                  {equippedTitle}
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field mt-2"
                />
              ) : (
                user.email
              )}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Username</p>
              <p className="text-gray-900 dark:text-white font-medium">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Member since</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {format(new Date(user.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save size={18} />
              Save Changes
            </button>
            <button onClick={handleCancel} className="btn-secondary">
              <X size={18} />
              Cancel
            </button>
          </div>
        )}
      </div>

          {/* Title Selection */}
          {unlockedTitles.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="icon-theme" size={20} />
                Equipped Title
              </h3>
              <div className="flex flex-wrap gap-2">
                {unlockedTitles.map((title) => (
                  <button
                    key={title}
                    onClick={() => handleEquipTitle(title)}
                    className={`badge-lg transition-all duration-300 ${
                      equippedTitle === title
                        ? 'btn-theme-gradient text-white shadow-lg'
                        : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Award size={14} />
                    {title}
                    {equippedTitle === title && <CheckCircle size={14} className="ml-1" />}
                  </button>
                ))}
                {equippedTitle && (
                  <button
                    onClick={() => handleEquipTitle(equippedTitle)}
                    className="badge-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <X size={14} />
                    Unequip
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Achievements Tab Content */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Title Selection in Achievements Tab */}
          {unlockedTitles.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="icon-theme" size={20} />
                Equipped Title
              </h3>
              <div className="flex flex-wrap gap-2">
                {unlockedTitles.map((title) => (
                  <button
                    key={title}
                    onClick={() => handleEquipTitle(title)}
                    className={`badge-lg transition-all duration-300 ${
                      equippedTitle === title
                        ? 'btn-theme-gradient text-white shadow-lg'
                        : 'bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Award size={14} />
                    {title}
                    {equippedTitle === title && <CheckCircle size={14} className="ml-1" />}
                  </button>
                ))}
                {equippedTitle && (
                  <button
                    onClick={() => handleEquipTitle(equippedTitle)}
                    className="badge-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <X size={14} />
                    Unequip
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Achievements Grid */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="text-primary-500" size={20} />
              All Achievements
            </h3>
            {achievements.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No achievements available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const progress = getAchievementProgress(achievement);
                  return (
                    <button
                      key={achievement.id}
                      onClick={() => setSelectedAchievement(achievement)}
                      className={`text-left card-compact transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                        progress.isCompleted
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                          : ''
                      }`}
                    >
                      <div className="flex flex-col items-center text-center mb-3">
                        <div
                          className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-2 ${
                            progress.isCompleted
                              ? 'bg-green-100 dark:bg-green-900/40'
                              : ''
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold text-base ${
                            progress.isCompleted
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {achievement.title}
                          </h4>
                          {progress.isCompleted && (
                            <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 text-center">
                        {achievement.description}
                      </p>
                      {!progress.isCompleted && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {progress.current} / {progress.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-500 progress-bar-theme"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Star size={12} />
                          <span className="text-xs font-medium">{achievement.reward.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Coins size={12} />
                          <span className="text-xs font-medium">{achievement.reward.coins}</span>
                        </div>
                        {achievement.reward.title && (
                          <div className="flex items-center gap-1 text-theme">
                            <Award size={12} />
                            <span className="text-xs font-medium">{achievement.reward.title}</span>
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
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in transform border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  selectedAchievement.completed
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : 'bg-primary-100 dark:bg-primary-900/40'
                }`}>
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

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {selectedAchievement.description}
              </p>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
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
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {progress.current} / {progress.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-primary-500 to-primary-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rewards:</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Star size={16} />
                    <span className="text-sm font-semibold">{selectedAchievement.reward.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Coins size={16} />
                    <span className="text-sm font-semibold">{selectedAchievement.reward.coins} Coins</span>
                  </div>
                  {selectedAchievement.reward.title && (
                    <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                      <Award size={16} />
                      <span className="text-sm font-semibold">Title: {selectedAchievement.reward.title}</span>
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
                  className="btn-primary w-full"
                >
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

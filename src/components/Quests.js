/**
 * Quests Component
 * Displays daily, weekly, and achievement quests with progress tracking
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getThemeColors } from '../utils/theme';
import { useToast } from '../context/ToastContext';
import {
  Target,
  CheckCircle,
  Clock,
  Star,
  Coins,
  TrendingUp,
  Calendar,
  Award,
  Zap,
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';

const Quests = () => {
  const { quests, gamification, tasks, studyLogs, checkQuestProgress } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyResetCountdown, setDailyResetCountdown] = useState('');
  const [weeklyResetCountdown, setWeeklyResetCountdown] = useState('');

  // GMT+7 timezone helpers - work entirely in UTC
  const getGMT7Timestamp = () => {
    const now = new Date();
    const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60000);
    return utcTimestamp + (7 * 3600000);
  };

  const getGMT7DateComponents = () => {
    const gmt7Timestamp = getGMT7Timestamp();
    const utcTimestamp = gmt7Timestamp - (7 * 3600000);
    const utcDate = new Date(utcTimestamp);
    return {
      year: utcDate.getUTCFullYear(),
      month: utcDate.getUTCMonth(),
      date: utcDate.getUTCDate(),
      day: utcDate.getUTCDay(),
      hours: utcDate.getUTCHours(),
    };
  };

  const getNextDailyReset = () => {
    const { year, month, date } = getGMT7DateComponents();
    
    const utcTomorrowMidnight = Date.UTC(year, month, date + 1, 0, 0, 0, 0);
    const gmt7TomorrowMidnight = utcTomorrowMidnight - (7 * 3600000);
    const nextReset = new Date(gmt7TomorrowMidnight);
    
    const now = new Date();
    if (nextReset.getTime() <= now.getTime()) {
      const utcDayAfterMidnight = Date.UTC(year, month, date + 2, 0, 0, 0, 0);
      return new Date(utcDayAfterMidnight - (7 * 3600000));
    }
    return nextReset;
  };

  const getNextWeeklyReset = () => {
    const { year, month, date, day, hours } = getGMT7DateComponents();
    
    let daysUntilMonday;
    if (day === 0) {
      daysUntilMonday = 1;
    } else if (day === 1) {
      daysUntilMonday = 7;
    } else {
      daysUntilMonday = 8 - day;
    }
    
    const mondayDate = date + daysUntilMonday;
    const utcMondayMidnight = Date.UTC(year, month, mondayDate, 0, 0, 0, 0);
    const gmt7MondayMidnight = utcMondayMidnight - (7 * 3600000);
    let nextReset = new Date(gmt7MondayMidnight);
    
    const now = new Date();
    if (nextReset.getTime() <= now.getTime()) {
      const utcNextMondayMidnight = Date.UTC(year, month, mondayDate + 7, 0, 0, 0, 0);
      nextReset = new Date(utcNextMondayMidnight - (7 * 3600000));
    }
    return nextReset;
  };

  const formatCountdown = (targetDate) => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Resetting...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Update countdown timers
  useEffect(() => {
    const updateCountdowns = () => {
      const nextDailyReset = getNextDailyReset();
      const nextWeeklyReset = getNextWeeklyReset();
      setDailyResetCountdown(formatCountdown(nextDailyReset));
      setWeeklyResetCountdown(formatCountdown(nextWeeklyReset));
    };
    
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate and update quest progress
  useEffect(() => {
    if (!quests || !checkQuestProgress) return;

    // Check daily task quest
    const today = new Date();
    const todayTasks = tasks.filter(t => 
      t.completed && t.completedAt && isSameDay(parseISO(t.completedAt), today)
    ).length;
    const dailyTaskQuest = quests.daily?.quests?.find(q => q.id === 'daily_complete_3_tasks' && !q.completed);
    if (dailyTaskQuest) {
      const currentProgress = quests.progress?.[dailyTaskQuest.id] || 0;
      if (todayTasks > currentProgress) {
        checkQuestProgress('tasks', todayTasks - currentProgress);
      }
    }

    // Check daily study quest
    const todayLogs = studyLogs.filter(log =>
      isSameDay(parseISO(log.timestamp), today)
    );
    const todayStudyMinutes = todayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const dailyStudyQuest = quests.daily?.quests?.find(q => q.id === 'daily_study_30_min' && !q.completed);
    if (dailyStudyQuest) {
      const currentProgress = quests.progress?.[dailyStudyQuest.id] || 0;
      if (todayStudyMinutes > currentProgress) {
        checkQuestProgress('study', todayStudyMinutes - currentProgress);
      }
    }

    // Check daily pomodoro quest
    const todayPomodoros = todayLogs.filter(log => log.type === 'pomodoro').length;
    const dailyPomodoroQuest = quests.daily?.quests?.find(q => q.id === 'daily_complete_pomodoro' && !q.completed);
    if (dailyPomodoroQuest && todayPomodoros > 0) {
      const currentProgress = quests.progress?.[dailyPomodoroQuest.id] || 0;
      if (todayPomodoros > currentProgress) {
        checkQuestProgress('pomodoro', todayPomodoros - currentProgress);
      }
    }

    // Check weekly quests
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    const weekTasks = tasks.filter(t =>
      t.completed && t.completedAt && 
      parseISO(t.completedAt) >= weekStart && 
      parseISO(t.completedAt) <= weekEnd
    ).length;
    const weeklyTaskQuest = quests.weekly?.quests?.find(q => q.id === 'weekly_complete_20_tasks' && !q.completed);
    if (weeklyTaskQuest) {
      const currentProgress = quests.progress?.[weeklyTaskQuest.id] || 0;
      if (weekTasks > currentProgress) {
        checkQuestProgress('tasks', weekTasks - currentProgress);
      }
    }

    const weekLogs = studyLogs.filter(log => {
      const logDate = parseISO(log.timestamp);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    const weekStudyMinutes = weekLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const weeklyStudyQuest = quests.weekly?.quests?.find(q => q.id === 'weekly_study_5_hours' && !q.completed);
    if (weeklyStudyQuest) {
      const currentProgress = quests.progress?.[weeklyStudyQuest.id] || 0;
      if (weekStudyMinutes > currentProgress) {
        checkQuestProgress('study', weekStudyMinutes - currentProgress);
      }
    }

    const weekPomodoros = weekLogs.filter(log => log.type === 'pomodoro').length;
    const weeklyPomodoroQuest = quests.weekly?.quests?.find(q => q.id === 'weekly_complete_10_pomodoros' && !q.completed);
    if (weeklyPomodoroQuest) {
      const currentProgress = quests.progress?.[weeklyPomodoroQuest.id] || 0;
      if (weekPomodoros > currentProgress) {
        checkQuestProgress('pomodoro', weekPomodoros - currentProgress);
      }
    }

    // Check achievement quests
    if (gamification?.level) {
      const levelQuest = quests.achievements?.find(q => q.id === 'achieve_level_5' && !q.completed);
      if (levelQuest) {
        checkQuestProgress('level', gamification.level);
      }
    }

    const totalCompleted = tasks.filter(t => t.completed).length;
    const totalTaskQuest = quests.achievements?.find(q => q.id === 'achieve_complete_100_tasks' && !q.completed);
    if (totalTaskQuest && totalCompleted > 0) {
      const currentProgress = quests.progress?.[totalTaskQuest.id] || 0;
      if (totalCompleted > currentProgress) {
        checkQuestProgress('tasks', totalCompleted - currentProgress);
      }
    }

    const totalStudyMinutes = studyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const totalStudyQuest = quests.achievements?.find(q => q.id === 'achieve_study_50_hours' && !q.completed);
    if (totalStudyQuest && totalStudyMinutes > 0) {
      const currentProgress = quests.progress?.[totalStudyQuest.id] || 0;
      if (totalStudyMinutes > currentProgress) {
        checkQuestProgress('study', totalStudyMinutes - currentProgress);
      }
    }

    const totalPomodoros = studyLogs.filter(log => log.type === 'pomodoro').length;
    const totalPomodoroQuest = quests.achievements?.find(q => q.id === 'achieve_complete_100_pomodoros' && !q.completed);
    if (totalPomodoroQuest && totalPomodoros > 0) {
      const currentProgress = quests.progress?.[totalPomodoroQuest.id] || 0;
      if (totalPomodoros > currentProgress) {
        checkQuestProgress('pomodoro', totalPomodoros - currentProgress);
      }
    }

    if (gamification?.pet?.rarity === 'Legendary' || gamification?.pet?.rarity === 'Mythical' || gamification?.pet?.rarity === 'Secret') {
      const legendaryQuest = quests.achievements?.find(q => q.id === 'achieve_get_legendary_pet' && !q.completed);
      if (legendaryQuest) {
        const currentProgress = quests.progress?.[legendaryQuest.id] || 0;
        if (currentProgress < 1) {
          checkQuestProgress('pet', 1);
        }
      }
    }
    if (gamification?.pet?.rarity === 'Mythical' || gamification?.pet?.rarity === 'Secret') {
      const mythicalQuest = quests.achievements?.find(q => q.id === 'achieve_get_mythical_pet' && !q.completed);
      if (mythicalQuest) {
        const currentProgress = quests.progress?.[mythicalQuest.id] || 0;
        if (currentProgress < 1) {
          checkQuestProgress('pet', 1);
        }
      }
    }
    if (gamification?.pet?.rarity === 'Secret') {
      const secretQuest = quests.achievements?.find(q => q.id === 'achieve_get_secret_pet' && !q.completed);
      if (secretQuest) {
        const currentProgress = quests.progress?.[secretQuest.id] || 0;
        if (currentProgress < 1) {
          checkQuestProgress('pet', 1);
        }
      }
    }

    // Check guaranteed daily quest (complete all daily quests)
    const dailyCompleteQuest = quests.daily?.quests?.find(q => q.id === 'daily_complete_daily_quests' && !q.completed);
    if (dailyCompleteQuest) {
      const otherDailyQuests = quests.daily?.quests?.filter(q => q.id !== 'daily_complete_daily_quests') || [];
      const allOtherCompleted = otherDailyQuests.length > 0 && otherDailyQuests.every(q => q.completed);
      if (allOtherCompleted) {
        const currentProgress = quests.progress?.[dailyCompleteQuest.id] || 0;
        if (currentProgress < 1) {
          checkQuestProgress('achievement', 1);
        }
      }
    }

    // Check guaranteed weekly quest (complete all weekly quests)
    const weeklyCompleteQuest = quests.weekly?.quests?.find(q => q.id === 'weekly_complete_weekly_quests' && !q.completed);
    if (weeklyCompleteQuest) {
      const otherWeeklyQuests = quests.weekly?.quests?.filter(q => q.id !== 'weekly_complete_weekly_quests') || [];
      const allOtherCompleted = otherWeeklyQuests.length > 0 && otherWeeklyQuests.every(q => q.completed);
      if (allOtherCompleted) {
        const currentProgress = quests.progress?.[weeklyCompleteQuest.id] || 0;
        if (currentProgress < 1) {
          checkQuestProgress('achievement', 1);
        }
      }
    }
  }, [tasks, studyLogs, gamification?.level, gamification?.pet?.rarity, quests, checkQuestProgress]);

  // Calculate daily progress
  const getDailyProgress = () => {
    const today = new Date();
    const todayTasks = tasks.filter(t => 
      t.completed && t.completedAt && isSameDay(parseISO(t.completedAt), today)
    ).length;
    
    const todayLogs = studyLogs.filter(log =>
      isSameDay(parseISO(log.timestamp), today)
    );
    const todayStudyMinutes = todayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    return { tasks: todayTasks, studyMinutes: todayStudyMinutes };
  };

  // Calculate weekly progress
  const getWeeklyProgress = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    
    const weekTasks = tasks.filter(t =>
      t.completed && t.completedAt && 
      parseISO(t.completedAt) >= weekStart && 
      parseISO(t.completedAt) <= weekEnd
    ).length;
    
    const weekLogs = studyLogs.filter(log => {
      const logDate = parseISO(log.timestamp);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    const weekStudyMinutes = weekLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const weekPomodoros = weekLogs.filter(log => log.type === 'pomodoro').length;

    return { tasks: weekTasks, studyMinutes: weekStudyMinutes, pomodoros: weekPomodoros };
  };

  const dailyProgress = getDailyProgress();
  const weeklyProgress = getWeeklyProgress();

  const renderQuest = (quest, type) => {
    const progress = quests.progress?.[quest.id] || 0;
    const isCompleted = quest.completed || progress >= quest.target;
    const progressPercent = Math.min(100, (progress / quest.target) * 100);

    return (
      <div
        key={quest.id}
        className={`card relative overflow-hidden ${
          isCompleted
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
            : ''
        }`}
      >
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent pointer-events-none" />
        )}
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : 'bg-primary-100 dark:bg-primary-900/40'
                }`}
              >
                {quest.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`text-lg font-semibold ${
                      isCompleted
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {quest.title}
                  </h3>
                  {isCompleted && (
                    <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quest.description}
                </p>
              </div>
            </div>
            {isCompleted && (
              <div className="flex flex-col items-end gap-1 ml-4">
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <Star size={16} />
                  <span className="text-sm font-semibold">{quest.reward.xp} XP</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <Coins size={16} />
                  <span className="text-sm font-semibold">{quest.reward.coins}</span>
                </div>
              </div>
            )}
          </div>

          {!isCompleted && (
            <>
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {progress} / {quest.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500 progress-bar-theme"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Star size={14} />
                    <span className="font-medium">{quest.reward.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <Coins size={14} />
                    <span className="font-medium">{quest.reward.coins} Coins</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const dailyQuests = quests.daily?.quests || [];
  const weeklyQuests = quests.weekly?.quests || [];

  const completedDaily = dailyQuests.filter(q => q.completed).length;
  const completedWeekly = weeklyQuests.filter(q => q.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="text-primary-500" size={28} />
            Quests
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete quests to earn XP and coins
          </p>
        </div>
      </div>

      {/* Reset Timers */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar size={16} />
            <span>Daily reset: <span className="font-semibold text-primary-600 dark:text-primary-400">{dailyResetCountdown}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock size={16} />
            <span>Weekly reset: <span className="font-semibold text-primary-600 dark:text-primary-400">{weeklyResetCountdown}</span></span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">(GMT+7)</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === 'daily'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            Daily ({completedDaily}/{dailyQuests.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 font-semibold text-sm transition-all duration-200 border-b-2 ${
            activeTab === 'weekly'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock size={18} />
            Weekly ({completedWeekly}/{weeklyQuests.length})
          </div>
        </button>
      </div>

      {/* Quest Lists */}
      <div className="space-y-4">
        {activeTab === 'daily' && (
          <>
            {dailyQuests.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No daily quests available</p>
              </div>
            ) : (
              dailyQuests.map(quest => renderQuest(quest, 'daily'))
            )}
          </>
        )}

        {activeTab === 'weekly' && (
          <>
            {weeklyQuests.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No weekly quests available</p>
              </div>
            ) : (
              weeklyQuests.map(quest => renderQuest(quest, 'weekly'))
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Quests;


/**
 * Analytics Dashboard Component
 * Displays study time analytics, productivity charts, and task completion stats
 */

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getThemeColors } from '../utils/theme';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Clock, CheckCircle, Target, TrendingUp, BarChart3, Zap, Calendar, Award } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, subDays } from 'date-fns';

const AnalyticsDashboard = () => {
  const { tasks, studyLogs, gamification } = useApp();
  const currentTheme = gamification?.currentTheme || 'default';
  const themeColors = getThemeColors(currentTheme);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    // Today's study time
    const todayLogs = studyLogs.filter((log) =>
      isSameDay(parseISO(log.timestamp), today)
    );
    const todayStudyTime = todayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    // This week's study time
    const weekLogs = studyLogs.filter((log) => {
      const logDate = parseISO(log.timestamp);
      return logDate >= startOfThisWeek && logDate <= endOfThisWeek;
    });
    const weekStudyTime = weekLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    // Task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const activeTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Total study time
    const totalStudyTime = studyLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

    // Average daily study time (last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });
    const dailyTotals = last7Days.map(day => {
      const dayLogs = studyLogs.filter((log) =>
        isSameDay(parseISO(log.timestamp), day)
      );
      return dayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    });
    const avgDailyStudy = dailyTotals.reduce((sum, val) => sum + val, 0) / 7;

    return {
      todayStudyTime,
      weekStudyTime,
      totalStudyTime,
      totalTasks,
      completedTasks,
      activeTasks,
      completionRate,
      avgDailyStudy: Math.round(avgDailyStudy),
    };
  }, [tasks, studyLogs]);

  // Prepare daily study time data for the last 7 days
  const dailyStudyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return days.map((day) => {
      const dayLogs = studyLogs.filter((log) =>
        isSameDay(parseISO(log.timestamp), day)
      );
      const studyTime = dayLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

      return {
        date: format(day, 'EEE'),
        fullDate: format(day, 'MMM dd'),
        studyTime: studyTime,
      };
    });
  }, [studyLogs]);

  // Prepare weekly study time data
  const weeklyStudyData = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const weekLogs = studyLogs.filter((log) => {
        const logDate = parseISO(log.timestamp);
        return logDate >= weekStart && logDate <= weekEnd;
      });
      
      const studyTime = weekLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
      
      weeks.push({
        week: `W${4 - i}`,
        weekLabel: format(weekStart, 'MMM dd'),
        studyTime: studyTime,
      });
    }
    return weeks;
  }, [studyLogs]);

  // Task priority distribution
  const priorityData = useMemo(() => {
    const priorityCounts = tasks.reduce((acc, task) => {
      const priority = task.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: 'High', value: priorityCounts.high || 0, color: '#ef4444' },
      { name: 'Medium', value: priorityCounts.medium || 0, color: '#eab308' },
      { name: 'Low', value: priorityCounts.low || 0, color: '#22c55e' },
    ].filter((item) => item.value > 0);
  }, [tasks]);

  // Task category distribution
  const categoryData = useMemo(() => {
    const categoryCounts = tasks.reduce((acc, task) => {
      const category = task.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categoryLabels = {
      study: 'Study',
      homework: 'Homework',
      project: 'Project',
      exam: 'Exam',
      reading: 'Reading',
      other: 'Other',
    };

    const categoryColors = {
      study: '#3b82f6',
      homework: '#a855f7',
      project: '#f97316',
      exam: '#ef4444',
      reading: '#22c55e',
      other: '#6b7280',
    };

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        name: categoryLabels[category] || 'Other',
        value: count,
        color: categoryColors[category] || '#6b7280',
      }))
      .filter((item) => item.value > 0);
  }, [tasks]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value} min</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in page-enter">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="icon-theme" size={28} />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your study progress and productivity trends
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-compact stagger-item" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}
            >
              <Clock className="icon-theme" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today's Study</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.todayStudyTime}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">min</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-compact stagger-item" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}
            >
              <Calendar className="icon-theme" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.weekStudyTime}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">min</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-compact stagger-item" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}
            >
              <CheckCircle className="icon-theme" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.completedTasks}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">/{stats.totalTasks}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-compact stagger-item" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}
            >
              <Target className="icon-theme" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completion</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.completionRate.toFixed(0)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Study Time Chart */}
        <div className="card stagger-item" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="icon-theme" size={20} />
              Daily Study Time
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyStudyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--theme-icon-color, rgb(14, 165, 233))', fontSize: 12 }}
                stroke="rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)"
              />
              <YAxis
                tick={{ fill: 'var(--theme-icon-color, rgb(14, 165, 233))', fontSize: 12 }}
                stroke="rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="studyTime"
                stroke="var(--theme-icon-color, rgb(14, 165, 233))"
                strokeWidth={3}
                dot={{ fill: 'var(--theme-icon-color, rgb(14, 165, 233))', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: 'var(--theme-icon-color, rgb(14, 165, 233))', strokeWidth: 2 }}
                name="Study Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Study Time Chart */}
        <div className="card stagger-item" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="icon-theme" size={20} />
              Weekly Overview
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Last 4 Weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyStudyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)" />
              <XAxis
                dataKey="week"
                tick={{ fill: 'var(--theme-icon-color, rgb(14, 165, 233))', fontSize: 12 }}
                stroke="rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)"
              />
              <YAxis
                tick={{ fill: 'var(--theme-icon-color, rgb(14, 165, 233))', fontSize: 12 }}
                stroke="rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="studyTime" 
                name="Study Time"
                radius={[8, 8, 0, 0]}
                style={{ fill: 'var(--theme-icon-color, rgb(14, 165, 233))' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Priority Distribution */}
        {priorityData.length > 0 && (
          <div className="card stagger-item" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="icon-theme" size={20} />
                Task Priority
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {priorityData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}: <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Category Distribution */}
        {categoryData.length > 0 && (
          <div className="card stagger-item" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="icon-theme" size={20} />
                Task Categories
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}: <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Progress */}
        <div className="card stagger-item" style={{ animationDelay: '0.45s' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <CheckCircle className="icon-theme" size={20} />
            Task Progress
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Completion Rate</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.completedTasks} / {stats.totalTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${stats.completionRate}%`,
                    background: `linear-gradient(to right, var(--theme-progress-from), var(--theme-progress-via), var(--theme-progress-to))`
                  }}
                >
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                    style={{ animation: 'shimmer 2s infinite' }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTasks}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Study Time</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--theme-icon-color)' }}>
                  {Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="card stagger-item" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="icon-theme" size={20} />
            Performance Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}
                >
                  <TrendingUp className="icon-theme" size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Average Daily Study</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.avgDailyStudy} min</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}
                >
                  <Calendar className="icon-theme" size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.weekStudyTime} min</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)' }}
                >
                  <Award className="icon-theme" size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{studyLogs.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;


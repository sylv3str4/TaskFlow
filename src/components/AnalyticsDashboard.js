/**
 * Analytics Dashboard Component
 * Displays study time analytics, productivity charts, and task completion stats
 */

import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
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
} from 'recharts';
import { Clock, CheckCircle, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, subDays } from 'date-fns';

const AnalyticsDashboard = () => {
  const { tasks, studyLogs } = useApp();

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

    return {
      todayStudyTime,
      weekStudyTime,
      totalStudyTime,
      totalTasks,
      completedTasks,
      activeTasks,
      completionRate,
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
        week: `Week ${4 - i}`,
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-primary-500" size={28} />
          Analytics Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your study progress and productivity trends
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card transform hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-up" style={{ animationDelay: '0s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Study Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.todayStudyTime} min
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="text-primary-600 dark:text-primary-400 group-hover:animate-float" size={24} />
            </div>
          </div>
        </div>

        <div className="card transform hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.weekStudyTime} min
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="text-green-600 dark:text-green-400 group-hover:animate-float" size={24} />
            </div>
          </div>
        </div>

        <div className="card transform hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.completedTasks}/{stats.totalTasks}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="text-blue-600 dark:text-blue-400 group-hover:animate-float" size={24} />
            </div>
          </div>
        </div>

        <div className="card transform hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.completionRate.toFixed(0)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Target className="text-yellow-600 dark:text-yellow-400 group-hover:animate-float" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Study Time Chart */}
        <div className="card transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl animate-slide-in-left">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
            Daily Study Time (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStudyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tw-color-gray-800)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="studyTime"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', r: 5 }}
                name="Study Time (min)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Study Time Chart */}
        <div className="card transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl animate-slide-in-right">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            Weekly Study Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyStudyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis
                dataKey="week"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-gray-600 dark:text-gray-400"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tw-color-gray-800)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="studyTime" fill="#0ea5e9" name="Study Time (min)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Priority Distribution */}
        {priorityData.length > 0 && (
          <div className="card transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl animate-zoom-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
              Task Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-color-gray-800)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Task Category Distribution */}
        {categoryData.length > 0 && (
          <div className="card transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl animate-zoom-in">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
              Task Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tw-color-gray-800)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Task Completion Stats */}
        <div className="card transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl animate-slide-up">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Task Overview
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.completedTasks} / {stats.totalTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${stats.completionRate}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-400">Active Tasks</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.activeTasks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Study Time</span>
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {stats.totalStudyTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;


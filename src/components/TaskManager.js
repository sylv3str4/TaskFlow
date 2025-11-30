/**
 * Task Manager Component
 * Handles adding, editing, deleting, and managing study tasks with timetable view and repeating tasks
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Check, Calendar, Flag, X, Sparkles, Folder, Search, CheckSquare, List, Clock, Grid, Repeat, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, getDay, startOfDay, addWeeks, subWeeks, isBefore, isAfter } from 'date-fns';

const PRIORITY_COLORS = {
  low: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
};

const CATEGORIES = [
  { value: 'study', label: 'Study', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' },
  { value: 'homework', label: 'Homework', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' },
  { value: 'project', label: 'Project', color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' },
  { value: 'exam', label: 'Exam', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' },
  { value: 'reading', label: 'Reading', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' },
];

const CATEGORY_COLORS = Object.fromEntries(
  CATEGORIES.map(cat => [cat.value, cat.color])
);

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const TaskManager = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
  } = useApp();
  const { success, error, info } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [completedTaskId, setCompletedTaskId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'deadline', // 'deadline' or 'duration'
    deadline: '',
    deadlineTime: '',
    startTime: '',
    endTime: '',
    priority: 'medium',
    category: 'study',
    repeatType: 'none', // none, daily, weekly, workdays
    repeatDays: [], // For weekly: array of day numbers (0-6)
    repeatEndDate: '', // Optional end date for repeating tasks
  });

  // View mode
  const [viewMode, setViewMode] = useState('list'); // list, timetable
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Filter tasks
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy] = useState('priority'); // priority, deadline, title
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to check if a task should appear on a specific date
  const shouldTaskAppearOnDate = (task, date) => {
    // If task has a specific deadline and it matches the date
    if (task.deadline) {
      const taskDate = parseISO(task.deadline);
      if (isSameDay(taskDate, date)) {
        return true;
      }
    }

    // Check repeating tasks
    if (task.repeatType && task.repeatType !== 'none') {
      const taskStartDate = task.deadline ? parseISO(task.deadline) : parseISO(task.createdAt);
      const startDayOnly = startOfDay(taskStartDate);
      const checkDayOnly = startOfDay(date);

      // Check if date is before start date
      if (isBefore(checkDayOnly, startDayOnly)) {
        return false;
      }

      // Check if date is after end date (if specified)
      if (task.repeatEndDate) {
        const endDate = startOfDay(parseISO(task.repeatEndDate));
        if (isAfter(checkDayOnly, endDate)) {
          return false;
        }
      }

      const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.

      switch (task.repeatType) {
        case 'daily':
          return true;
        
        case 'workdays':
          // Monday (1) to Friday (5)
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        
        case 'weekly':
          if (task.repeatDays && task.repeatDays.length > 0) {
            return task.repeatDays.includes(dayOfWeek);
          }
          // If no specific days selected, check if it's the same day of week as start
          return dayOfWeek === getDay(taskStartDate);
        
        default:
          return false;
      }
    }

    return false;
  };

  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filter === 'active' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    
    // Category filter
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(query);
      const descriptionMatch = task.description?.toLowerCase().includes(query);
      if (!titleMatch && !descriptionMatch) return false;
    }
    
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline);
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;

      case 'deadline':
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline);
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        const priorityOrder2 = { high: 3, medium: 2, low: 1 };
        return (priorityOrder2[b.priority] || 2) - (priorityOrder2[a.priority] || 2);

      case 'title':
        return (a.title || '').localeCompare(b.title || '');

      case 'category':
        const categoryOrder = { study: 1, homework: 2, project: 3, exam: 4, reading: 5, other: 6 };
        const categoryDiff = (categoryOrder[a.category] || 6) - (categoryOrder[b.category] || 6);
        if (categoryDiff !== 0) return categoryDiff;
        const priorityOrder3 = { high: 3, medium: 2, low: 1 };
        return (priorityOrder3[b.priority] || 2) - (priorityOrder3[a.priority] || 2);

      case 'dateCreated':
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;

      default:
        return 0;
    }
  });

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      const taskType = task.taskType || (task.duration ? 'duration' : 'deadline');
      
      if (taskType === 'deadline' && task.deadline) {
        const deadlineDate = new Date(task.deadline);
        const dateStr = deadlineDate.toISOString().split('T')[0];
        const timeStr = deadlineDate.toTimeString().slice(0, 5);
        setFormData({
          title: task.title,
          description: task.description || '',
          taskType: 'deadline',
          deadline: dateStr,
          deadlineTime: timeStr,
          startTime: '',
          endTime: '',
          priority: task.priority || 'medium',
          category: task.category || 'study',
          repeatType: task.repeatType || 'none',
          repeatDays: task.repeatDays || [],
          repeatEndDate: task.repeatEndDate || '',
        });
      } else if (taskType === 'duration' && task.startTime) {
        const startDate = new Date(task.startTime);
        const dateStr = startDate.toISOString().split('T')[0];
        const startTimeStr = startDate.toTimeString().slice(0, 5);
        // Calculate end time from start time + duration
        const duration = task.duration || 60;
        const endDate = new Date(startDate.getTime() + (duration * 60000));
        const endTimeStr = endDate.toTimeString().slice(0, 5);
        setFormData({
          title: task.title,
          description: task.description || '',
          taskType: 'duration',
          deadline: dateStr,
          deadlineTime: '',
          startTime: startTimeStr,
          endTime: endTimeStr,
          priority: task.priority || 'medium',
          category: task.category || 'study',
          repeatType: task.repeatType || 'none',
          repeatDays: task.repeatDays || [],
          repeatEndDate: task.repeatEndDate || '',
        });
      } else {
        setFormData({
          title: task.title,
          description: task.description || '',
          taskType: taskType,
          deadline: '',
          deadlineTime: '',
          startTime: '',
          endTime: '',
          priority: task.priority || 'medium',
          category: task.category || 'study',
          repeatType: task.repeatType || 'none',
          repeatDays: task.repeatDays || [],
          repeatEndDate: task.repeatEndDate || '',
        });
      }
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        taskType: 'deadline',
        deadline: '',
        deadlineTime: '',
        startTime: '',
        endTime: '',
        priority: 'medium',
        category: 'study',
        repeatType: 'none',
        repeatDays: [],
        repeatEndDate: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      taskType: 'deadline',
      deadline: '',
      deadlineTime: '',
      startTime: '',
      endTime: '',
      priority: 'medium',
      category: 'study',
      repeatType: 'none',
      repeatDays: [],
      repeatEndDate: '',
    });
  };

  const handleRepeatDayToggle = (day) => {
    const currentDays = formData.repeatDays || [];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        repeatDays: currentDays.filter(d => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        repeatDays: [...currentDays, day],
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Please enter a task title');
      return;
    }

    // Validate repeat settings
    if (formData.repeatType === 'weekly' && (!formData.repeatDays || formData.repeatDays.length === 0)) {
      error('Please select at least one day for weekly repetition');
      return;
    }

    // Validate task type specific fields
    if (formData.taskType === 'deadline' && !formData.deadline) {
      error('Please select a date for deadline tasks');
      return;
    }
    if (formData.taskType === 'duration' && (!formData.deadline || !formData.startTime || !formData.endTime)) {
      error('Please select a date, start time, and end time for duration tasks');
      return;
    }
    if (formData.taskType === 'duration' && formData.startTime && formData.endTime) {
      const start = new Date(`${formData.deadline}T${formData.startTime}`);
      const end = new Date(`${formData.deadline}T${formData.endTime}`);
      if (end <= start) {
        error('End time must be after start time');
        return;
      }
    }

    // Combine date and time into ISO string
    let deadlineValue = null;
    let startTimeValue = null;
    
    if (formData.taskType === 'deadline') {
      if (formData.deadline) {
        if (formData.deadlineTime) {
          deadlineValue = new Date(`${formData.deadline}T${formData.deadlineTime}`).toISOString();
        } else {
          deadlineValue = new Date(`${formData.deadline}T23:59:59`).toISOString();
        }
      }
    } else if (formData.taskType === 'duration') {
      if (formData.deadline && formData.startTime && formData.endTime) {
        startTimeValue = new Date(`${formData.deadline}T${formData.startTime}`).toISOString();
        const endTimeValue = new Date(`${formData.deadline}T${formData.endTime}`);
        deadlineValue = endTimeValue.toISOString();
      }
    }

    // Calculate duration from start and end time for duration tasks
    let durationValue = null;
    if (formData.taskType === 'duration' && startTimeValue && deadlineValue) {
      const start = new Date(startTimeValue);
      const end = new Date(deadlineValue);
      durationValue = Math.round((end - start) / 60000); // Duration in minutes
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      taskType: formData.taskType,
      deadline: deadlineValue,
      startTime: startTimeValue,
      duration: durationValue,
      repeatType: formData.repeatType,
      repeatDays: formData.repeatType === 'weekly' ? formData.repeatDays : [],
      repeatEndDate: formData.repeatEndDate || null,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
      success('Task updated successfully!');
    } else {
      addTask(taskData);
      success('Task added successfully!');
    }
    handleCloseModal();
  };

  const handleToggleTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    toggleTask(taskId);
    if (task && !task.completed) {
      setCompletedTaskId(taskId);
      setTimeout(() => setCompletedTaskId(null), 2000);
      success('Task completed! 🎉');
    } else {
      info('Task marked as incomplete');
    }
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
      error(`Task "${task?.title}" deleted`);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenModal();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getDeadlineLabel = (deadline) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const timeStr = format(deadlineDate, 'h:mm a');
    
    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      return { 
        label: `Overdue • ${format(deadlineDate, 'MMM dd')} ${timeStr}`, 
        color: 'text-red-600 dark:text-red-400' 
      };
    }
    if (isToday(deadlineDate)) {
      return { 
        label: `Today at ${timeStr}`, 
        color: 'text-orange-600 dark:text-orange-400' 
      };
    }
    if (isTomorrow(deadlineDate)) {
      return { 
        label: `Tomorrow at ${timeStr}`, 
        color: 'text-yellow-600 dark:text-yellow-400' 
      };
    }
    return { 
      label: `${format(deadlineDate, 'MMM dd')} at ${timeStr}`, 
      color: 'text-gray-600 dark:text-gray-400' 
    };
  };

  // Get tasks for timetable view
  const getTasksForTimetable = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return weekDays.map(day => {
      const dayTasks = filteredTasks.filter(task => shouldTaskAppearOnDate(task, day));
      const deadlineTasks = []; // Tasks that are just deadlines (lines)
      const durationTasks = []; // Tasks with duration (blocks)
      
      dayTasks.forEach(task => {
        const taskType = task.taskType || (task.duration ? 'duration' : 'deadline');
        
        if (taskType === 'deadline' && task.deadline) {
          deadlineTasks.push(task);
        } else if (taskType === 'duration' && task.startTime) {
          durationTasks.push(task);
        }
      });
      
      return {
        date: day,
        deadlineTasks,
        durationTasks,
      };
    });
  };

  const activeTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="space-y-6 animate-fade-in page-enter">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <List className="icon-theme" size={28} />
            Task Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {activeTasksCount} active task{activeTasksCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { id: 'list', label: 'List', icon: List },
            { id: 'timetable', label: 'Timetable', icon: Grid },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                viewMode === id
                  ? 'btn-primary text-white shadow-lg'
                  : 'btn-secondary'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Week Navigation - Only show for timetable */}
        {viewMode === 'timetable' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
              title="Previous Week"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-4 py-2 rounded-xl bg-white/70 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-sm"
              title="Go to Today"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="p-2 rounded-xl bg-white/70 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
              title="Next Week"
            >
              <ChevronRight size={18} />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
            </span>
          </div>
        )}

        {/* Filters - Only show for list view */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-10 py-2.5 rounded-xl border-2 backdrop-blur-sm text-sm font-medium text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-10 py-2.5 rounded-xl border-2 backdrop-blur-sm text-sm font-medium text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:icon-theme transition-colors duration-300" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-12 pr-12"
          placeholder="Search tasks by title or description..."
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300 hover:scale-110 active:scale-95 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="card text-center py-12">
              <div className="flex flex-col items-center gap-3">
                {searchQuery ? (
                  <>
                    <Search className="text-gray-400" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      No tasks found
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Try adjusting your search or filters
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setFilter('all');
                      }}
                      className="btn-secondary mt-2"
                    >
                      Clear Filters
                    </button>
                  </>
                ) : (
                  <>
                    <CheckSquare className="text-gray-400" size={48} />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      {filter === 'all' ? 'No tasks yet. Create your first task!' :
                       filter === 'active' ? 'No active tasks. Great job!' :
                       'No completed tasks yet.'}
                    </p>
                    {filter === 'all' && (
                      <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary mt-4 flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Create Your First Task
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            sortedTasks.map((task, index) => {
              const deadlineInfo = getDeadlineLabel(task.deadline);
              const isRepeating = task.repeatType && task.repeatType !== 'none';
              return (
                <div
                  key={task.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className={`card flex items-start gap-4 transform transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-1 stagger-item ${
                    task.completed ? 'opacity-70' : ''
                  } ${completedTaskId === task.id ? 'ring-4 ring-green-400/50 animate-pulse-glow' : ''}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                      task.completed
                        ? 'btn-theme-gradient border-theme shadow-lg'
                        : 'border-gray-300 dark:border-gray-600 hover:border-theme'
                    }`}
                  >
                    {task.completed && <Check size={16} className="text-white" />}
                    {completedTaskId === task.id && (
                      <Sparkles size={16} className="text-white animate-spin" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-lg mb-1 flex items-center gap-2 ${
                        task.completed
                          ? 'line-through text-gray-500 dark:text-gray-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                      {isRepeating && (
                        <Repeat size={14} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </h3>
                    {task.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {task.category && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all duration-200 transform hover:scale-110 ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.other}`}
                        >
                          <Folder size={12} className="transform group-hover:rotate-12 transition-transform" />
                          {CATEGORIES.find(c => c.value === task.category)?.label || 'Other'}
                        </span>
                      )}
                      {task.priority && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all duration-200 transform hover:scale-110 ${PRIORITY_COLORS[task.priority]}`}
                        >
                          <Flag size={12} />
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      )}
                      {deadlineInfo && (
                        <span
                          className={`text-xs font-medium flex items-center gap-1 transition-all duration-200 transform hover:scale-110 ${deadlineInfo.color}`}
                        >
                          <Calendar size={12} />
                          {deadlineInfo.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!task.completed && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(task)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-theme rounded-lg transition-all duration-200 transform hover:scale-110"
                        aria-label="Edit task"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                        aria-label="Delete task"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Timetable View */}
      {viewMode === 'timetable' && (
      <div className="space-y-4">
        <div className="card overflow-x-auto hover:scale-100 hover:translate-y-0">
          <div className="min-w-full">
            <div className="grid grid-cols-8 gap-1">
              {/* Time column header */}
              <div className="p-2 font-semibold text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                Time
              </div>
              {/* Day headers */}
              {getTasksForTimetable().map((dayData, index) => {
                const isToday = isSameDay(dayData.date, new Date());
                return (
                  <div
                    key={index}
                    className={`p-2 font-semibold text-sm text-center border-b border-gray-200 dark:border-gray-700 ${
                      isToday ? 'text-theme' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div>{format(dayData.date, 'EEE')}</div>
                    <div className="text-xs">{format(dayData.date, 'MMM d')}</div>
                  </div>
                );
              })}
              
              {/* Time slots */}
              {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                <React.Fragment key={hour}>
                  <div className="p-2 text-xs text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                    {hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                  </div>
                  {getTasksForTimetable().map((dayData, dayIndex) => {
                    // Find deadline tasks at this hour
                    const deadlineAtHour = dayData.deadlineTasks.filter(task => {
                      if (!task.deadline) return false;
                      const taskDate = parseISO(task.deadline);
                      if (!isSameDay(taskDate, dayData.date)) return false;
                      return taskDate.getHours() === hour;
                    });
                    
                    // Find duration tasks that start or span this hour
                    const durationTasksInHour = dayData.durationTasks.filter(task => {
                      if (!task.startTime) return false;
                      const startDate = parseISO(task.startTime);
                      if (!isSameDay(startDate, dayData.date)) return false;
                      const startHour = startDate.getHours();
                      const startMinutes = startDate.getMinutes();
                      const duration = task.duration || 60;
                      const totalStartMinutes = startHour * 60 + startMinutes;
                      const totalEndMinutes = totalStartMinutes + duration;
                      const hourStartMinutes = hour * 60;
                      const hourEndMinutes = (hour + 1) * 60;
                      // Task overlaps this hour if it starts before this hour ends and ends after this hour starts
                      return totalStartMinutes < hourEndMinutes && totalEndMinutes > hourStartMinutes;
                    });
                    
                    // Find duration tasks that start in this hour
                    const durationStarts = durationTasksInHour.filter(task => {
                      const startDate = parseISO(task.startTime);
                      return startDate.getHours() === hour;
                    });
                    
                    return (
                      <div
                        key={dayIndex}
                        className="relative border-r border-b border-gray-200 dark:border-gray-700 min-h-[80px] overflow-visible"
                      >
                        {/* Deadline lines - horizontal line at the deadline time */}
                        {deadlineAtHour.map((task) => {
                          const isRepeating = task.repeatType && task.repeatType !== 'none';
                          const taskDate = parseISO(task.deadline);
                          const minutes = taskDate.getMinutes();
                          const topPercent = (minutes / 60) * 100;
                          
                          return (
                            <div
                              key={`deadline-${task.id}`}
                              className={`absolute left-0 right-0 h-0.5 z-30 cursor-pointer group rounded-full transition-all duration-200 hover:h-1 ${
                                task.completed 
                                  ? 'bg-gray-400 dark:bg-gray-500 opacity-50' 
                                  : ''
                              }`}
                              style={{
                                top: `${topPercent}%`,
                                backgroundColor: task.completed 
                                  ? undefined
                                  : 'var(--theme-icon-color, rgb(14, 165, 233))',
                                boxShadow: task.completed 
                                  ? 'none' 
                                  : '0 1px 3px rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3), 0 0 8px rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.2)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(task);
                              }}
                              title={`${task.title} - ${format(taskDate, 'h:mm a')}${isRepeating ? ' (Repeating)' : ''}`}
                            >
                              <div className="absolute left-2 -top-7 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs whitespace-nowrap z-30 pointer-events-none">
                                <div className="font-semibold text-gray-900 dark:text-white">{task.title}</div>
                                <div className="text-gray-600 dark:text-gray-400">{format(taskDate, 'h:mm a')}</div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Duration task blocks - rendered only in starting hour, spans across all hours */}
                        {durationStarts.map((task) => {
                          const isRepeating = task.repeatType && task.repeatType !== 'none';
                          const duration = task.duration || 60;
                          const startDate = parseISO(task.startTime);
                          const startHour = startDate.getHours();
                          const startMinutes = startDate.getMinutes();
                          
                          // Calculate position within the first hour cell (0-100%)
                          const startPercent = (startMinutes / 60) * 100;
                          
                          // Each hour cell has min-height of 80px and gap-1 (4px) between cells
                          const cellMinHeight = 80; // pixels
                          const cellGap = 4; // pixels (gap-1 = 0.25rem = 4px)
                          
                          // Calculate remaining time in the first hour (from start to end of hour)
                          const remainingInFirstHour = 60 - startMinutes;
                          
                          // Declare totalHeightPx variable
                          let totalHeightPx;
                          
                          // Check if task ends within the first hour
                          if (duration <= remainingInFirstHour) {
                            // Task fits entirely in the first hour
                            totalHeightPx = (duration / 60) * cellMinHeight;
                          } else {
                            // Task spans multiple hours
                            // 1. Remaining portion of first hour
                            const remainingInFirstHourPercent = remainingInFirstHour / 60;
                            totalHeightPx = remainingInFirstHourPercent * cellMinHeight;
                            
                            // 2. Calculate remaining duration after first hour
                            const remainingDuration = duration - remainingInFirstHour;
                            const fullHoursAfterFirst = Math.floor(remainingDuration / 60);
                            const remainingMinutesInLastHour = remainingDuration % 60;
                            
                            // 3. Add full hours (cells + gaps)
                            if (fullHoursAfterFirst > 0) {
                              totalHeightPx += (fullHoursAfterFirst - 1) * cellGap + fullHoursAfterFirst * cellMinHeight;
                            }
                            
                            // 4. Add remaining time in the last hour
                            if (remainingMinutesInLastHour > 0) {
                              totalHeightPx += (remainingMinutesInLastHour / 60) * cellMinHeight;
                            }
                          }
                          
                          const endTime = format(new Date(startDate.getTime() + duration * 60000), 'h:mm a');
                          
                          return (
                            <div
                              key={`duration-${task.id}`}
                              onClick={() => handleOpenModal(task)}
                              className={`absolute left-2 right-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-xl z-10 backdrop-blur-sm border-l-4 border-theme ${
                                task.completed ? 'opacity-60' : ''
                              } border border-gray-200/50 dark:border-gray-600/50`}
                              style={{
                                top: `${startPercent}%`,
                                height: `${Math.max(24, totalHeightPx)}px`,
                                backgroundColor: task.completed 
                                  ? 'rgba(156, 163, 175, 0.2)'
                                  : `rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.12)`,
                                boxShadow: task.completed 
                                  ? 'none' 
                                  : '0 2px 8px rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.15), 0 1px 3px rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)',
                              }}
                              title={`${task.title} - ${format(startDate, 'h:mm a')} to ${endTime} (${duration} min)${isRepeating ? ' (Repeating)' : ''}`}
                            >
                              <div className="font-semibold truncate flex items-center gap-1.5 mb-0.5">
                                {task.title}
                                {isRepeating && (
                                  <Repeat size={11} className="flex-shrink-0 opacity-70" />
                                )}
                              </div>
                              <div className="text-xs opacity-80 font-medium">
                                {format(startDate, 'h:mm')} - {endTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-scale-in transform max-h-[90vh] overflow-y-auto border-2"
            style={{ borderColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 transform hover:rotate-90 hover:scale-110"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(to bottom, var(--theme-color-from, rgb(14, 165, 233)), var(--theme-color-to, rgb(3, 105, 161)))` }}></span>
                  Basic Information
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter task title"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="Enter task description (optional)"
                  />
                </div>
              </div>

              {/* Task Type Selection */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Clock className="icon-theme" size={16} />
                  Task Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, taskType: 'deadline' })}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      formData.taskType === 'deadline'
                        ? 'bg-opacity-10 dark:bg-opacity-20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={formData.taskType === 'deadline' ? {
                      borderColor: 'var(--theme-icon-color, rgb(14, 165, 233))',
                      backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)',
                      color: 'var(--theme-icon-color, rgb(14, 165, 233))',
                    } : {}}
                  >
                    <div className="font-medium text-sm mb-1">Deadline</div>
                    <div className="text-xs opacity-75">Point in time</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, taskType: 'duration' })}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      formData.taskType === 'duration'
                        ? 'bg-opacity-10 dark:bg-opacity-20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={formData.taskType === 'duration' ? {
                      borderColor: 'var(--theme-icon-color, rgb(14, 165, 233))',
                      backgroundColor: 'rgba(var(--theme-icon-color-rgb, 14, 165, 233), 0.1)',
                      color: 'var(--theme-icon-color, rgb(14, 165, 233))',
                    } : {}}
                  >
                    <div className="font-medium text-sm mb-1">Duration</div>
                    <div className="text-xs opacity-75">Time block</div>
                  </button>
                </div>
              </div>

              {/* Date & Time Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Calendar className="icon-theme" size={16} />
                  {formData.taskType === 'deadline' ? 'Deadline' : 'Schedule'}
                </h4>
                {formData.taskType === 'deadline' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Time <span className="text-xs font-normal text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="time"
                        value={formData.deadlineTime}
                        onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                        className="input-field"
                        disabled={!formData.deadline}
                      />
                      {!formData.deadline && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Select a date first
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {formData.taskType === 'duration' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="input-field"
                          disabled={!formData.deadline}
                          required
                        />
                        {!formData.deadline && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select a date first
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          End Time *
                        </label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="input-field"
                          disabled={!formData.deadline || !formData.startTime}
                          required
                        />
                        {!formData.deadline && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select a date first
                          </p>
                        )}
                        {formData.deadline && !formData.startTime && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Select a start time first
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category & Priority */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Folder className="icon-theme" size={16} />
                  Organization
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Repeat Options */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Repeat className="icon-theme" size={16} />
                  Repeat Task
                </label>
                <select
                  value={formData.repeatType}
                  onChange={(e) => {
                    const newRepeatType = e.target.value;
                    setFormData({
                      ...formData,
                      repeatType: newRepeatType,
                      repeatDays: newRepeatType === 'weekly' ? formData.repeatDays : [],
                    });
                  }}
                  className="input-field mb-3"
                >
                  <option value="none">Don't Repeat</option>
                  <option value="daily">Every Day</option>
                  <option value="workdays">Every Work Day (Mon-Fri)</option>
                  <option value="weekly">Specific Days of Week</option>
                </select>

                {/* Weekly repeat - day selection */}
                {formData.repeatType === 'weekly' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleRepeatDayToggle(day.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            formData.repeatDays?.includes(day.value)
                              ? 'btn-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                    {(!formData.repeatDays || formData.repeatDays.length === 0) && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        Please select at least one day
                      </p>
                    )}
                  </div>
                )}

                {/* End date for repeating tasks */}
                {(formData.repeatType === 'daily' || formData.repeatType === 'workdays' || formData.repeatType === 'weekly') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.repeatEndDate}
                      onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                      className="input-field"
                      min={formData.deadline || undefined}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty to repeat indefinitely
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="submit" className="btn-primary flex-1 ripple group">
                  <span className="flex items-center justify-center gap-2">
                    {editingTask ? (
                      <>
                        <Check size={18} className="transform group-hover:scale-110 transition-transform" />
                        Update Task
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="transform group-hover:rotate-90 transition-transform duration-300" />
                        Add Task
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;

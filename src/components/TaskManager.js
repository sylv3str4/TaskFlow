/**
 * Task Manager Component
 * Handles adding, editing, deleting, and managing study tasks
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Check, Calendar, Flag, X, Sparkles, Folder, Search, CheckSquare, Coins } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

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

const TaskManager = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    gamification,
  } = useApp();
  const { success, error, info } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [completedTaskId, setCompletedTaskId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    deadlineTime: '',
    priority: 'medium',
    category: 'study',
  });

  // Filter tasks
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [categoryFilter, setCategoryFilter] = useState('all'); // all or specific category
  const [sortBy, setSortBy] = useState('priority'); // priority, deadline, title, category, dateCreated
  const [searchQuery, setSearchQuery] = useState(''); // search query
  const [coinPulse, setCoinPulse] = useState(false);

  useEffect(() => {
    setCoinPulse(true);
    const timer = setTimeout(() => setCoinPulse(false), 600);
    return () => clearTimeout(timer);
  }, [gamification?.coins]);
  
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

  // Sort tasks based on selected sort option
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Always show incomplete tasks first
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        // If same priority, sort by deadline
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
        // If no deadline, sort by priority
        const priorityOrder2 = { high: 3, medium: 2, low: 1 };
        return (priorityOrder2[b.priority] || 2) - (priorityOrder2[a.priority] || 2);

      case 'title':
        return (a.title || '').localeCompare(b.title || '');

      case 'category':
        const categoryOrder = { study: 1, homework: 2, project: 3, exam: 4, reading: 5, other: 6 };
        const categoryDiff = (categoryOrder[a.category] || 6) - (categoryOrder[b.category] || 6);
        if (categoryDiff !== 0) return categoryDiff;
        // If same category, sort by priority
        const priorityOrder3 = { high: 3, medium: 2, low: 1 };
        return (priorityOrder3[b.priority] || 2) - (priorityOrder3[a.priority] || 2);

      case 'dateCreated':
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Newest first

      default:
        return 0;
    }
  });

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        const dateStr = deadlineDate.toISOString().split('T')[0];
        const timeStr = deadlineDate.toTimeString().slice(0, 5); // HH:mm format
        setFormData({
          title: task.title,
          description: task.description || '',
          deadline: dateStr,
          deadlineTime: timeStr,
          priority: task.priority || 'medium',
          category: task.category || 'study',
        });
      } else {
        setFormData({
          title: task.title,
          description: task.description || '',
          deadline: '',
          deadlineTime: '',
          priority: task.priority || 'medium',
          category: task.category || 'study',
        });
      }
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        deadlineTime: '',
        priority: 'medium',
        category: 'study',
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
      deadline: '',
      deadlineTime: '',
      priority: 'medium',
      category: 'study',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Please enter a task title');
      return;
    }

    // Combine date and time into ISO string
    let deadlineValue = null;
    if (formData.deadline) {
      if (formData.deadlineTime) {
        // Combine date and time
        deadlineValue = new Date(`${formData.deadline}T${formData.deadlineTime}`).toISOString();
      } else {
        // Just date, set to end of day
        deadlineValue = new Date(`${formData.deadline}T23:59:59`).toISOString();
      }
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      deadline: deadlineValue,
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
    const timeStr = format(deadlineDate, 'h:mm a'); // e.g., "2:30 PM"
    
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

  const activeTasksCount = tasks.filter(t => !t.completed).length;
  const displayedTasksCount = sortedTasks.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Manager</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {activeTasksCount} active task{activeTasksCount !== 1 ? 's' : ''}
            {searchQuery && ` • ${displayedTasksCount} result${displayedTasksCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {gamification && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 shadow transition-all duration-500 ${
                coinPulse ? 'scale-105 shadow-lg' : 'scale-100'
              }`}
            >
              <Coins size={18} className={coinPulse ? 'animate-bounce-subtle' : ''} />
              <div className={`text-sm font-semibold tabular-nums transition-all duration-500 ${coinPulse ? 'animate-number-shuffle' : ''}`}>
                {new Intl.NumberFormat().format(gamification.coins)} Coins
              </div>
            </div>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2 ripple group relative overflow-hidden justify-center"
          >
            <Plus size={20} className="transform group-hover:rotate-90 transition-transform duration-300" />
            Add Task
            <span className="hidden sm:inline text-xs opacity-75 ml-2">(⌘K)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors duration-200" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10 pr-10"
          placeholder="Search tasks by title or description..."
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'completed'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                    filter === filterType
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-full"
            >
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="title">Title (A-Z)</option>
              <option value="category">Category</option>
              <option value="dateCreated">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
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
            return (
              <div
                key={task.id}
                style={{ animationDelay: `${index * 0.05}s` }}
                className={`card flex items-start gap-4 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-slide-up ${
                  task.completed ? 'opacity-60' : ''
                } ${completedTaskId === task.id ? 'ring-4 ring-green-400 animate-pulse' : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                    task.completed
                      ? 'bg-primary-600 border-primary-600 shadow-lg'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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
                    className={`font-semibold text-lg mb-1 ${
                      task.completed
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {task.title}
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
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
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

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 animate-scale-in transform"
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time (Optional)
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
              <div className="flex gap-3 pt-4">
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
                  className="btn-secondary ripple"
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


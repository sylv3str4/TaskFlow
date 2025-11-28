/**
 * Task Manager Component
 * Handles adding, editing, deleting, and managing study tasks
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Check, Calendar, Flag, X } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const PRIORITY_COLORS = {
  low: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
};

const TaskManager = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
  });

  // Filter tasks
  const [filter, setFilter] = useState('all'); // all, active, completed
  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  // Sort tasks by priority and deadline
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const handleOpenModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        priority: task.priority,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'medium',
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
      priority: 'medium',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, {
        ...formData,
        deadline: formData.deadline || null,
      });
    } else {
      addTask({
        ...formData,
        deadline: formData.deadline || null,
      });
    }
    handleCloseModal();
  };

  const getDeadlineLabel = (deadline) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      return { label: 'Overdue', color: 'text-red-600 dark:text-red-400' };
    }
    if (isToday(deadlineDate)) {
      return { label: 'Today', color: 'text-orange-600 dark:text-orange-400' };
    }
    if (isTomorrow(deadlineDate)) {
      return { label: 'Tomorrow', color: 'text-yellow-600 dark:text-yellow-400' };
    }
    return { label: format(deadlineDate, 'MMM dd'), color: 'text-gray-600 dark:text-gray-400' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Manager</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tasks.filter(t => !t.completed).length} active tasks
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'completed'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === filterType
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'No tasks yet. Create your first task!' :
               filter === 'active' ? 'No active tasks. Great job!' :
               'No completed tasks yet.'}
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const deadlineInfo = getDeadlineLabel(task.deadline);
            return (
              <div
                key={task.id}
                className={`card flex items-start gap-4 ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                  }`}
                >
                  {task.completed && <Check size={16} className="text-white" />}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold text-lg ${
                      task.completed
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {task.priority && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}
                      >
                        <Flag size={12} />
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    )}
                    {deadlineInfo && (
                      <span
                        className={`text-xs font-medium flex items-center gap-1 ${deadlineInfo.color}`}
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
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      aria-label="Edit task"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                    Deadline
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
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingTask ? 'Update Task' : 'Add Task'}
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


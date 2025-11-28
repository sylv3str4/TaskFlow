/**
 * User Profile Component
 * Displays and manages user profile information
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Calendar, Edit2, Save, X, LogOut } from 'lucide-react';
import { format } from 'date-fns';

const UserProfile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User className="text-primary-500" size={28} />
            Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/80 shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-gray-800 dark:text-gray-100 font-semibold"
          >
            <Edit2 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
            <User className="text-white" size={40} />
          </div>
          <div>
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
            <p className="text-gray-600 dark:text-gray-400 mt-1">
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
            <button onClick={handleSave} className="btn-primary flex items-center gap-2 rounded-2xl shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95">
              <Save size={18} />
              Save Changes
            </button>
            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/80 shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-gray-800 dark:text-gray-100 font-semibold">
              <X size={18} />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h3>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/80 shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full font-semibold"
          >
            <LogOut size={18} />
            Sign Out
          </button>
      </div>
    </div>
  );
};

export default UserProfile;


/**
 * Main App Component
 * TaskFlow - A comprehensive study management application
 */

import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Signup from './components/Signup';
import TaskManager from './components/TaskManager';
import PomodoroTimer from './components/PomodoroTimer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Settings from './components/Settings';
import UserProfile from './components/UserProfile';
import { useApp } from './context/AppContext';

// Authentication wrapper
const AuthWrapper = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return showSignup ? (
      <Signup onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <Login onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  return <AppContent />;
};

// Main content component
const AppContent = () => {
  const { activeTab } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskManager />;
      case 'timer':
        return <PomodoroTimer />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'profile':
        return <UserProfile />;
      case 'settings':
        return <Settings />;
      default:
        return <TaskManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// App component
const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AuthWrapper />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;


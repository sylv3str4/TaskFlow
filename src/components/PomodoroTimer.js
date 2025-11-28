/**
 * Pomodoro Timer Component
 * Customizable Pomodoro timer with session tracking
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Play, Pause, RotateCcw, Settings, Check, Volume2 } from 'lucide-react';

// Sound notification function
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('Audio notification not available');
  }
};

const PomodoroTimer = () => {
  const { settings, addStudyLog, updateSettings, rewardFocusSession } = useApp();
  const { success, info } = useToast();
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroWork * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState('work'); // work, shortBreak, longBreak
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    pomodoroWork: settings.pomodoroWork,
    pomodoroShortBreak: settings.pomodoroShortBreak,
    pomodoroLongBreak: settings.pomodoroLongBreak,
    pomodoroLongBreakInterval: settings.pomodoroLongBreakInterval,
  });
  const intervalRef = useRef(null);

  // Update time left when settings change
  useEffect(() => {
    if (!isRunning) {
      const timeMap = {
        work: settings.pomodoroWork * 60,
        shortBreak: settings.pomodoroShortBreak * 60,
        longBreak: settings.pomodoroLongBreak * 60,
      };
      setTimeLeft(timeMap[sessionType]);
    }
  }, [settings, sessionType, isRunning]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    playNotificationSound();
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 2000);
    
    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Log the study session
      addStudyLog({
        duration: settings.pomodoroWork,
        type: 'work',
        completedAt: new Date().toISOString(),
      });

      success(`Great work! Session ${newCompletedSessions} completed! 🎉`);
      rewardFocusSession();

      // Check if it's time for a long break
      if (newCompletedSessions % settings.pomodoroLongBreakInterval === 0) {
        setSessionType('longBreak');
        setTimeLeft(settings.pomodoroLongBreak * 60);
        info('Time for a long break! ☕');
      } else {
        setSessionType('shortBreak');
        setTimeLeft(settings.pomodoroShortBreak * 60);
        info('Take a short break! 🧘');
      }
    } else {
      // Break completed, return to work
      setSessionType('work');
      setTimeLeft(settings.pomodoroWork * 60);
      info('Break over! Time to focus! 💪');
    }
  }, [sessionType, completedSessions, settings, addStudyLog, success, info, rewardFocusSession]);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      info('Timer started! Focus time! 🎯');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        handleStartPause();
      }
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handleReset = () => {
    setIsRunning(false);
    const timeMap = {
      work: settings.pomodoroWork * 60,
      shortBreak: settings.pomodoroShortBreak * 60,
      longBreak: settings.pomodoroLongBreak * 60,
    };
    setTimeLeft(timeMap[sessionType]);
  };

  const handleSessionChange = (type) => {
    if (isRunning) return;
    setSessionType(type);
    const timeMap = {
      work: settings.pomodoroWork * 60,
      shortBreak: settings.pomodoroShortBreak * 60,
      longBreak: settings.pomodoroLongBreak * 60,
    };
    setTimeLeft(timeMap[type]);
  };

  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    setShowSettings(false);
    handleReset();
    success('Timer settings saved!');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (() => {
    const timeMap = {
      work: settings.pomodoroWork * 60,
      shortBreak: settings.pomodoroShortBreak * 60,
      longBreak: settings.pomodoroLongBreak * 60,
    };
    const total = timeMap[sessionType];
    return ((total - timeLeft) / total) * 100;
  })();

  const sessionColors = {
    work: 'bg-primary-600',
    shortBreak: 'bg-green-600',
    longBreak: 'bg-blue-600',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Study Timer</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {completedSessions} completed session{completedSessions !== 1 ? 's' : ''} today
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn-secondary flex items-center gap-2"
        >
          <Settings size={20} />
          Settings
        </button>
      </div>

      {/* Timer Display */}
      <div className="card text-center">
        {/* Session Type Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { type: 'work', label: 'Work' },
            { type: 'shortBreak', label: 'Short Break' },
            { type: 'longBreak', label: 'Long Break' },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleSessionChange(type)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                sessionType === type
                  ? `${sessionColors[type]} text-white shadow-lg`
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Circular Progress */}
        <div className={`relative w-64 h-64 mx-auto mb-8 ${isPulsing ? 'animate-pulse' : ''} ${isRunning ? 'animate-float' : ''}`}>
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className={`${sessionColors[sessionType]} transition-all duration-1000 ${isRunning ? 'animate-glow' : ''}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-300 ${isPulsing ? 'scale-125 text-green-500 animate-bounce-subtle' : ''} ${isRunning ? 'transform hover:scale-110' : ''}`}>
              {formatTime(timeLeft)}
            </div>
            <div className={`text-sm text-gray-600 dark:text-gray-400 capitalize transition-all duration-200 ${isRunning ? 'font-semibold' : ''}`}>
              {sessionType === 'work' ? 'Focus Time' : sessionType === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </div>
            {!isRunning && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 animate-pulse-slow">
                Press Space to start
              </div>
            )}
            {isRunning && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium animate-pulse">
                ⏱️ Timer Running
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleStartPause}
            className={`${sessionColors[sessionType]} text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg ripple group`}
          >
            {isRunning ? (
              <>
                <Pause size={20} className="transform group-hover:scale-110 transition-transform" />
                Pause
              </>
            ) : (
              <>
                <Play size={20} className="transform group-hover:scale-110 transition-transform" />
                Start
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all duration-200"
            disabled={isRunning}
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>
        <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>Keyboard shortcuts: Space to start/pause • ⌘R to reset</p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="card animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Timer Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={tempSettings.pomodoroWork}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    pomodoroWork: parseInt(e.target.value) || 25,
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Short Break Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={tempSettings.pomodoroShortBreak}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    pomodoroShortBreak: parseInt(e.target.value) || 5,
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={tempSettings.pomodoroLongBreak}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    pomodoroLongBreak: parseInt(e.target.value) || 15,
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break Interval (sessions)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={tempSettings.pomodoroLongBreakInterval}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    pomodoroLongBreakInterval: parseInt(e.target.value) || 4,
                  })
                }
                className="input-field"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Take a long break after this many work sessions
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleSaveSettings} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Check size={18} />
                Save Settings
              </button>
              <button
                onClick={() => {
                  setTempSettings({
                    pomodoroWork: settings.pomodoroWork,
                    pomodoroShortBreak: settings.pomodoroShortBreak,
                    pomodoroLongBreak: settings.pomodoroLongBreak,
                    pomodoroLongBreakInterval: settings.pomodoroLongBreakInterval,
                  });
                  setShowSettings(false);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;


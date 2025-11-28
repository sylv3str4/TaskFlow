# Smart Study Dashboard

A comprehensive, modern web application designed to help students plan, track, and optimize their study sessions. Built with React, TailwindCSS, and featuring a beautiful, responsive UI with dark mode support.

![Smart Study Dashboard](https://img.shields.io/badge/React-18.2.0-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

### 📋 Task Manager
- **Add, Edit, Delete Tasks**: Full CRUD operations for study tasks
- **Deadlines & Priorities**: Set deadlines and assign priority levels (High, Medium, Low)
- **Task Completion**: Mark tasks as completed with automatic timestamp tracking
- **Smart Filtering**: Filter tasks by status (All, Active, Completed)
- **Intelligent Sorting**: Tasks automatically sorted by priority and deadline

### ⏱️ Study Timer (Pomodoro)
- **Customizable Intervals**: Configure work, short break, and long break durations
- **Session Tracking**: Automatically logs completed study sessions
- **Visual Progress**: Beautiful circular progress indicator
- **Session Types**: Switch between work sessions and breaks
- **Auto-break Management**: Automatically suggests breaks after work sessions

### 📊 Analytics Dashboard
- **Daily & Weekly Study Time**: Track your study hours with interactive charts
- **Productivity Charts**: Visualize your study patterns using Recharts
- **Task Completion Stats**: Monitor task completion rates and progress
- **Priority Distribution**: See how tasks are distributed across priority levels
- **Real-time Statistics**: Live updates as you complete tasks and study sessions

### ⚙️ User Settings
- **Light/Dark Mode**: Toggle between light and dark themes
- **Persistent Preferences**: All settings saved automatically
- **Data Management**: Clear all data option with confirmation

### 💾 Data Persistence
- **Local Storage**: All data stored locally in your browser
- **Automatic Saving**: Tasks, study logs, and settings saved automatically
- **No Backend Required**: Fully functional offline application

## Tech Stack

- **Frontend Framework**: React 18.2.0
- **Styling**: TailwindCSS 3.3.6
- **Charts**: Recharts 2.10.3
- **Icons**: Lucide React
- **Date Utilities**: date-fns
- **Build Tool**: Create React App

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone or navigate to the project directory**
   ```bash
   cd TaskFllow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   - The app will automatically open at `http://localhost:3000`
   - If it doesn't, navigate to the URL manually

### Build for Production

To create an optimized production build:

```bash
npm run build
```

The build folder will contain the production-ready files that can be deployed to any static hosting service.

## Usage Guide

### Getting Started

1. **Create Your First Task**
   - Click on the "Tasks" tab (default view)
   - Click "Add Task" button
   - Fill in the task details (title, description, deadline, priority)
   - Click "Add Task" to save

2. **Start a Study Session**
   - Navigate to the "Timer" tab
   - Choose your session type (Work, Short Break, or Long Break)
   - Click "Start" to begin the timer
   - The timer will automatically log your session when completed

3. **View Your Progress**
   - Go to the "Analytics" tab
   - View your daily and weekly study time
   - Check task completion statistics
   - Analyze your productivity trends

4. **Customize Settings**
   - Click on the "Settings" tab
   - Toggle dark mode on/off
   - Adjust Pomodoro timer intervals
   - Manage your data

### Task Management Tips

- **Priorities**: Use High priority for urgent tasks, Medium for normal tasks, Low for less critical items
- **Deadlines**: Set deadlines to help prioritize your work
- **Completion**: Mark tasks as complete to track your progress
- **Filtering**: Use the filter buttons to focus on active or completed tasks

### Pomodoro Technique

The app implements the Pomodoro Technique:
- **Work Session**: Focused study time (default: 25 minutes)
- **Short Break**: Quick rest between work sessions (default: 5 minutes)
- **Long Break**: Extended rest after multiple work sessions (default: 15 minutes)
- **Long Break Interval**: Number of work sessions before a long break (default: 4)

### Analytics Insights

- **Daily Study Time**: Track how much you study each day
- **Weekly Trends**: See your study patterns over time
- **Task Completion Rate**: Monitor your productivity
- **Priority Distribution**: Understand your task organization

## Project Structure

```
TaskFllow/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/         # React components
│   │   ├── TaskManager.js      # Task management component
│   │   ├── PomodoroTimer.js    # Pomodoro timer component
│   │   ├── AnalyticsDashboard.js # Analytics and charts
│   │   └── Settings.js          # Settings component
│   ├── context/
│   │   └── AppContext.js        # Global state management
│   ├── utils/
│   │   └── storage.js           # Local storage utilities
│   ├── App.js              # Main app component
│   ├── index.js            # React entry point
│   └── index.css           # Global styles and TailwindCSS
├── package.json            # Dependencies and scripts
├── tailwind.config.js     # TailwindCSS configuration
├── postcss.config.js      # PostCSS configuration
└── README.md              # This file
```

## Key Features Explained

### Local Storage Implementation

All data is stored in the browser's local storage:
- **Tasks**: Stored as JSON array
- **Study Logs**: Session history with timestamps
- **Settings**: User preferences and timer configurations

Data persists across browser sessions and page refreshes.

### State Management

The app uses React Context API for centralized state management:
- Single source of truth for all application data
- Automatic persistence to local storage
- Reactive updates across all components

### Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Great experience on tablets
- **Desktop**: Full-featured desktop interface
- **Adaptive Navigation**: Different navigation styles for mobile and desktop

### Dark Mode

- **System-Aware**: Respects user preferences
- **Smooth Transitions**: Animated theme switching
- **Persistent**: Remembers your preference
- **Complete Coverage**: All components support dark mode

## Customization

### Changing Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
colors: {
  primary: {
    // Your custom primary colors
  },
}
```

### Adjusting Animations

Modify animation durations and effects in `tailwind.config.js`:

```javascript
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
  // Add your custom animations
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Data Not Persisting

- Ensure your browser allows local storage
- Check browser console for errors
- Try clearing browser cache and reloading

### Timer Not Working

- Check browser console for JavaScript errors
- Ensure you're using a modern browser
- Try refreshing the page

### Charts Not Displaying

- Verify Recharts is installed: `npm install recharts`
- Check browser console for errors
- Ensure you have study log data

## Future Enhancements

Potential features for future versions:
- Cloud sync across devices
- Study streak tracking
- Goal setting and achievements
- Study group collaboration
- Export data functionality
- Custom themes
- Sound notifications
- Browser notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on the project repository.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

---

**Happy Studying! 📚✨**

# TaskFlow

A comprehensive, modern web application designed to help students plan, track, and optimize their study sessions. Built with React, TailwindCSS, and featuring a beautiful, responsive UI with dark mode support, account system, and interactive features.

![TaskFlow](https://img.shields.io/badge/React-18.2.0-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🔐 Account System
- **User Authentication**: Secure signup and login system
- **User Profiles**: Manage your username and profile information
- **User-Specific Data**: Each user's tasks, logs, and settings are isolated
- **Persistent Sessions**: Stay logged in across browser sessions
- **Profile Management**: Edit your profile information anytime

### 📋 Task Manager
- **Add, Edit, Delete Tasks**: Full CRUD operations for study tasks
- **Task Categories**: Organize tasks by category (Study, Homework, Project, Exam, Reading, Other)
- **Category Filtering**: Filter tasks by category for better organization
- **Deadlines & Priorities**: Set deadlines and assign priority levels (High, Medium, Low)
- **Task Completion**: Mark tasks as completed with automatic timestamp tracking and celebration animations
- **Smart Filtering**: Filter tasks by status (All, Active, Completed) and category
- **Intelligent Sorting**: Tasks automatically sorted by priority and deadline
- **Toast Notifications**: Real-time feedback for all actions
- **Keyboard Shortcuts**: Press `⌘K` (Mac) or `Ctrl+K` (Windows) to quickly add tasks
- **Interactive Animations**: Smooth hover effects and completion celebrations

### ⏱️ Study Timer (Pomodoro)
- **Customizable Intervals**: Configure work, short break, and long break durations
- **Session Tracking**: Automatically logs completed study sessions
- **Visual Progress**: Beautiful circular progress indicator with animations
- **Session Types**: Switch between work sessions and breaks
- **Auto-break Management**: Automatically suggests breaks after work sessions
- **Sound Notifications**: Audio alerts when timer completes
- **Keyboard Shortcuts**: Press `Space` to start/pause, `⌘R` to reset
- **Toast Notifications**: Celebrate completed sessions with encouraging messages

### 📊 Analytics Dashboard
- **Daily & Weekly Study Time**: Track your study hours with interactive charts
- **Productivity Charts**: Visualize your study patterns using Recharts
- **Task Completion Stats**: Monitor task completion rates and progress
- **Priority Distribution**: See how tasks are distributed across priority levels
- **Category Distribution**: Analyze tasks by category with visual charts
- **Real-time Statistics**: Live updates as you complete tasks and study sessions
- **Interactive Cards**: Hover effects on stat cards for better UX

### 🎨 Modern UI/UX
- **Sidebar Navigation**: Clean, modern sidebar navigation (replaces top nav)
- **Responsive Design**: Fully responsive layout for mobile, tablet, and desktop
- **Dark Mode**: Toggle between light and dark themes with smooth transitions
- **Toast Notifications**: Beautiful toast notifications for user feedback
- **Smooth Animations**: Polished animations throughout the application
- **Mobile Menu**: Hamburger menu for mobile devices with overlay

### ⚙️ User Settings
- **Light/Dark Mode**: Toggle between light and dark themes with smooth transitions
- **Persistent Preferences**: All settings saved automatically per user
- **Data Management**: Clear all data option with confirmation
- **Interactive UI**: Smooth animations and transitions throughout

### 💾 Data Persistence
- **User-Specific Storage**: Each user's data stored separately in local storage
- **Automatic Saving**: Tasks, study logs, and settings saved automatically
- **No Backend Required**: Fully functional offline application
- **Data Isolation**: Multiple users can use the app on the same device

## 🚀 Tech Stack

- **Frontend Framework**: React 18.2.0
- **Styling**: TailwindCSS 3.3.6
- **Charts**: Recharts 2.10.3
- **Icons**: Lucide React
- **Date Utilities**: date-fns
- **Build Tool**: Create React App
- **State Management**: React Context API

## 📦 Installation

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

## 📖 Usage Guide

### Getting Started

1. **Create an Account**
   - Click "Sign up" on the login screen
   - Enter your username, email, and password
   - You'll be automatically logged in after signup

2. **Create Your First Task**
   - Click on the "Tasks" tab in the sidebar
   - Click "Add Task" button (or press `⌘K` / `Ctrl+K`)
   - Fill in the task details:
     - Title (required)
     - Description (optional)
     - Category (Study, Homework, Project, Exam, Reading, Other)
     - Priority (Low, Medium, High)
     - Deadline (optional)
   - Click "Add Task" to save

3. **Organize Tasks**
   - Use category filters to view tasks by category
   - Filter by status (All, Active, Completed)
   - Tasks are automatically sorted by priority and deadline

4. **Start a Study Session**
   - Navigate to the "Timer" tab in the sidebar
   - Choose your session type (Work, Short Break, or Long Break)
   - Click "Start" to begin the timer (or press `Space`)
   - The timer will automatically log your session when completed

5. **View Your Progress**
   - Go to the "Analytics" tab
   - View your daily and weekly study time
   - Check task completion statistics
   - Analyze your productivity trends
   - See category and priority distributions

6. **Manage Your Profile**
   - Click on the "Profile" tab
   - View your account information
   - Edit your username and email
   - See when you joined TaskFlow

7. **Customize Settings**
   - Click on the "Settings" tab
   - Toggle dark mode on/off
   - Adjust Pomodoro timer intervals
   - Manage your data

### Task Management Tips

- **Categories**: Use categories to organize tasks by type (Study, Homework, Project, etc.)
- **Priorities**: Use High priority for urgent tasks, Medium for normal tasks, Low for less critical items
- **Deadlines**: Set deadlines to help prioritize your work
- **Completion**: Mark tasks as complete to track your progress
- **Filtering**: Use the filter buttons to focus on specific categories or statuses

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
- **Category Distribution**: See which types of tasks you focus on most

## 📁 Project Structure

```
TaskFllow/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/         # React components
│   │   ├── TaskManager.js      # Task management component
│   │   ├── PomodoroTimer.js    # Pomodoro timer component
│   │   ├── AnalyticsDashboard.js # Analytics and charts
│   │   ├── Settings.js          # Settings component
│   │   ├── Sidebar.js           # Sidebar navigation
│   │   ├── Login.js             # Login component
│   │   ├── Signup.js            # Signup component
│   │   ├── UserProfile.js       # User profile component
│   │   └── Toast.js             # Toast notification component
│   ├── context/
│   │   ├── AppContext.js        # Global state management
│   │   ├── AuthContext.js       # Authentication context
│   │   └── ToastContext.js     # Toast notifications context
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

## 🔑 Key Features Explained

### Account System

- **Authentication**: Secure user authentication with email and password
- **User Isolation**: Each user's data is completely separate
- **Session Management**: Automatic login persistence across browser sessions
- **Profile Management**: Edit username and email from the profile page

### Task Categories

- **Study**: General study tasks
- **Homework**: Assignment and homework tasks
- **Project**: Project-related tasks
- **Exam**: Exam preparation tasks
- **Reading**: Reading assignments
- **Other**: Miscellaneous tasks

### Local Storage Implementation

All data is stored in the browser's local storage:
- **User Accounts**: Stored securely with encrypted passwords (in production, use proper hashing)
- **Tasks**: Stored as JSON array per user
- **Study Logs**: Session history with timestamps per user
- **Settings**: User preferences and timer configurations per user

Data persists across browser sessions and page refreshes.

### State Management

The app uses React Context API for centralized state management:
- **AppContext**: Manages tasks, study logs, and settings
- **AuthContext**: Handles user authentication and profile
- **ToastContext**: Manages toast notifications
- Single source of truth for all application data
- Automatic persistence to local storage
- Reactive updates across all components

### Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Great experience on tablets
- **Desktop**: Full-featured desktop interface
- **Sidebar Navigation**: Collapsible sidebar with mobile menu
- **Adaptive Layout**: Different layouts for mobile and desktop

### Dark Mode

- **System-Aware**: Respects user preferences
- **Smooth Transitions**: Animated theme switching
- **Persistent**: Remembers your preference per user
- **Complete Coverage**: All components support dark mode

## 🎨 Customization

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

### Adding Categories

Edit the `CATEGORIES` array in `src/components/TaskManager.js`:

```javascript
const CATEGORIES = [
  { value: 'your-category', label: 'Your Category', color: 'bg-color-100...' },
  // Add more categories
];
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔧 Troubleshooting

### Data Not Persisting

- Ensure your browser allows local storage
- Check browser console for errors
- Try clearing browser cache and reloading
- Make sure you're logged in

### Timer Not Working

- Check browser console for JavaScript errors
- Ensure you're using a modern browser
- Try refreshing the page
- Check if audio permissions are granted

### Charts Not Displaying

- Verify Recharts is installed: `npm install recharts`
- Check browser console for errors
- Ensure you have study log data
- Try logging out and back in

### Authentication Issues

- Clear browser local storage if experiencing login issues
- Ensure email and password are correct
- Check browser console for errors
- Try creating a new account if needed

## 🚧 Future Enhancements

Potential features for future versions:
- Cloud sync across devices
- Study streak tracking
- Goal setting and achievements
- Study group collaboration
- Export data functionality
- Custom themes
- Browser notifications
- Task templates
- Recurring tasks
- Task search functionality
- Task tags (in addition to categories)
- Calendar view
- Task reminders

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For issues, questions, or suggestions, please open an issue on the project repository.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

---

**Happy Studying! 📚✨**

# DesiFit - Mobile Fitness Tracker for Indian Users

## Original Problem Statement
Build a simple mobile app prototype called "DesiFit" for Indian users. The app is a frontend-only, local-storage-based application that helps users track their daily calories, exercise, habits, and weight progress.

## Product Requirements

### Core Features
1. **Onboarding**: Simple profile setup (name, phone, age, height, current weight, goal weight) stored locally
2. **Dashboard**: Main screen displaying:
   - Daily Fitness Score (out of 100) with circular progress indicator
   - Calories consumed/burned/remaining
   - Habit completion progress
   - Current weight status
3. **Food Tracking**: Search and log common Indian foods with calorie calculations
4. **Exercise Tracking**: Log activities with duration and calorie burn calculations
5. **Habit/To-Do Tracking**: Predefined health habits + personal to-do list
6. **Monthly Progress**: Summary screen with weight chart, calorie/exercise totals, habit completion %, weekly fitness score average

### Daily Fitness Score System (100 points)
- Calories goal achieved: 40 points
- Exercise completed (200+ cal burned): 30 points
- Habit completion: 20 points
- Bonus (water/steps habits): 10 points

## Tech Stack
- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based)
- **State Management**: Zustand (user profile), useState (local state)
- **Data Storage**: AsyncStorage (local-first, no backend)
- **UI**: Standard React Native components, react-native-gifted-charts, react-native-svg
- **Backend**: DEPRECATED/UNUSED

## Architecture
```
/app/frontend/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx    (Tab navigation)
│   │   ├── dashboard.tsx  (Dashboard with Fitness Score)
│   │   ├── food.tsx       (Food logging)
│   │   ├── exercise.tsx   (Exercise logging)
│   │   ├── habits.tsx     (Habits & To-Do)
│   │   ├── progress.tsx   (Monthly progress + Weekly Score)
│   │   └── profile.tsx    (User profile)
│   ├── index.tsx          (Entry point/routing)
│   └── onboarding.tsx     (Initial setup)
├── src/
│   ├── store/authStore.ts (Zustand store)
│   └── utils/helpers.ts   (Utility functions)
└── package.json
```

## Data Structures (AsyncStorage)
- `userProfile`: { name, phone, age, height, currentWeight, goalWeight, dailyCalorieGoal }
- `foodLogs`: [{ foodName, caloriesPerUnit, quantity, totalCalories, date }]
- `exerciseLogs`: [{ exerciseName, duration, caloriesBurned, date }]
- `habits`: [{ id, habitName, completedDates[], currentStreak, longestStreak }]
- `todos`: [{ id, taskName, completed, createdDate }]
- `weightLogs`: [{ weight, date }]
- `fitness_scores`: [{ date, score }] (Last 90 days)

## What's Been Implemented (December 2025)
- [x] Local-only architecture with AsyncStorage
- [x] Onboarding/Profile setup screen
- [x] Dashboard with calorie tracking and auto-refresh
- [x] Food logging with Indian food database
- [x] Exercise logging with calorie calculations
- [x] Habits and To-Do list with deletion
- [x] Monthly Progress screen with weight chart
- [x] **Daily Fitness Score** with circular progress indicator
- [x] **Weekly Average Fitness Score** on Progress screen
- [x] Score color coding (green/amber/orange/red)
- [x] Score persistence to AsyncStorage history

## Testing Status
- Frontend tests: 8/8 passed (100%)
- Test file: `/app/tests/e2e/fitness-score.spec.ts`

## Known Issues
- AsyncStorage dependency warning (version mismatch in yarn.lock) - functional but needs cleanup

## Backlog
- [ ] Centralize AsyncStorage logic into utility module
- [ ] Remove deprecated `/app/backend` code
- [ ] Add data export/import functionality
- [ ] Push notifications for habit reminders

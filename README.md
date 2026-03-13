# DesiFit - Indian Fitness Tracker App

A simple and intuitive mobile fitness tracking app designed specifically for Indian users to track weight loss, habits, and daily calories.

## Features

### 🔐 Simple Authentication
- Phone number-based login (no password required)
- Quick profile creation with age, height, current weight, and goal weight
- Automatic BMR calculation for daily calorie goals

### 📊 Dashboard
- Real-time calorie tracking (consumed, burned, remaining)
- Habit completion progress
- Current weight status
- Pull-to-refresh for latest data

### 🍛 Food Tracker
- Pre-populated database of 15 common Indian foods:
  - Roti, Rice, Dal, Paneer Sabzi, Poha
  - Idli, Dosa, Rajma, Chole, Paratha
  - Sambar, Upma, Aloo Sabzi, Biryani, Khichdi
- Search functionality for quick food lookup
- Add custom foods with calorie information
- Log food with quantity multiplier
- View today's meals with total calories
- Delete food entries

### 🏃 Exercise Tracker
- 6 popular activities:
  - Walking (250 cal/hr)
  - Running (600 cal/hr)
  - Cycling (500 cal/hr)
  - Yoga (250 cal/hr)
  - Skipping (700 cal/hr)
  - Gym (400 cal/hr)
- Automatic calorie burn calculation based on duration
- Track multiple workouts per day
- View daily stats (total calories burned, total minutes)

### ✅ Habit Builder
- Pre-defined habits: Drink Water, Walking Steps, Workout, Avoid Sugar, Eat Vegetables, Sleep Early
- Create custom habits
- Daily check-off system
- Streak tracking (current and longest streak)
- Visual progress indicators

### ⚖️ Weight Tracker
- Weekly weight logging
- Line chart showing weight progress over time
- Total weight change calculation
- Recent entries history

### 👤 Profile Management
- View personal stats (age, height, current weight, goal weight)
- Edit daily calorie goal
- View and manage weight history
- Logout functionality

## Technical Stack

**Frontend:**
- React Native with Expo
- Expo Router (file-based routing)
- TypeScript
- Zustand (state management)
- React Native Gifted Charts
- AsyncStorage for local persistence

**Backend:**
- FastAPI (Python)
- MongoDB
- Motor (async MongoDB driver)

**Database Collections:**
- users
- foods (pre-populated + custom)
- food_logs
- exercise_logs
- habits
- weight_logs

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login with phone number

### User Management
- `GET /api/users/{user_id}` - Get user details
- `PUT /api/users/{user_id}/calorie-goal` - Update daily calorie goal

### Foods
- `GET /api/foods` - List foods (with optional search)
- `POST /api/foods` - Add custom food

### Food Logging
- `POST /api/food-logs` - Log food entry
- `GET /api/food-logs/{user_id}` - Get food logs by date
- `DELETE /api/food-logs/{log_id}` - Delete food log

### Exercise
- `POST /api/exercise-logs` - Log exercise
- `GET /api/exercise-logs/{user_id}` - Get exercise logs by date
- `DELETE /api/exercise-logs/{log_id}` - Delete exercise log

### Habits
- `POST /api/habits` - Create habit
- `POST /api/habits/toggle` - Toggle habit completion
- `GET /api/habits/{user_id}` - Get user habits

### Weight
- `POST /api/weight-logs` - Log weight
- `GET /api/weight-logs/{user_id}` - Get weight history

### Dashboard
- `GET /api/dashboard/{user_id}` - Get aggregated dashboard data

## BMR & Calorie Calculation

**BMR Formula:**
- Male: (10 × weight) + (6.25 × height) - (5 × age) + 5
- Female: (10 × weight) + (6.25 × height) - (5 × age) - 161
- Daily Goal = BMR × 1.2 (sedentary activity level)

**Exercise Calories:** Based on activity type and duration in minutes

**Net Calories:** Daily Goal - Consumed + Burned

## App Flow

1. **First Launch** → Signup screen
2. **Signup** → Enter phone, name, age, height, weights, gender → Auto-calculate calorie goal
3. **Login** → Enter phone number → Dashboard
4. **Dashboard** → See today's summary with pull-to-refresh
5. **Food Tab** → Search & log Indian foods, add custom foods
6. **Exercise Tab** → Select activity, enter duration, view stats
7. **Habits Tab** → Create & track daily habits with streaks
8. **Profile Tab** → View stats, weight graph, edit calorie goal, logout

## Development

**Start Backend:**
```bash
sudo supervisorctl restart backend
```

**Start Frontend:**
```bash
sudo supervisorctl restart expo
```

**View Logs:**
```bash
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/expo.out.log
```

## Testing

Backend APIs have been fully tested with 100% success rate:
- ✅ User authentication (signup/login)
- ✅ Food management & logging
- ✅ Exercise tracking
- ✅ Habit system with streaks
- ✅ Weight logging
- ✅ Dashboard aggregation

## App Preview

Access the app at: **https://health-score-desi.preview.emergentagent.com**

## Design Principles

- **Mobile-First**: Designed for thumb-friendly navigation
- **Clean UI**: Minimal, focused design for quick tracking
- **Indian Context**: Pre-populated with Indian foods and serving sizes
- **Quick Actions**: Modal-based inputs for fast data entry
- **Visual Feedback**: Progress bars, charts, and color-coded stats
- **Offline-Ready**: Local storage for authentication state

## Future Enhancements

- Push notifications for habit reminders
- Social features (share progress with friends)
- Meal planning and recipes
- Barcode scanner for packaged foods
- Water intake tracker with reminders
- Step counter integration
- Weekly/monthly reports

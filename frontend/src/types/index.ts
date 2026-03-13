export interface User {
  id: string;
  phone: string;
  name: string;
  age: number;
  height: number;
  currentWeight: number;
  goalWeight: number;
  gender: string;
  dailyCalorieGoal: number;
  createdAt: string;
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  servingSize: string;
  category: string;
  isCustom: boolean;
  userId?: string;
}

export interface FoodLog {
  id: string;
  userId: string;
  foodId: string;
  foodName: string;
  quantity: number;
  calories: number;
  date: string;
  timestamp: string;
}

export interface ExerciseLog {
  id: string;
  userId: string;
  activityType: string;
  duration: number;
  caloriesBurned: number;
  date: string;
  timestamp: string;
}

export interface Habit {
  id: string;
  userId: string;
  habitName: string;
  completedDates: string[];
  currentStreak: number;
  longestStreak: number;
}

export interface WeightLog {
  id: string;
  userId: string;
  weight: number;
  date: string;
  timestamp: string;
}

export interface Dashboard {
  caloriesConsumed: number;
  caloriesBurned: number;
  dailyCalorieGoal: number;
  remainingCalories: number;
  habitsCompleted: number;
  totalHabits: number;
  currentWeight: number;
  goalWeight: number;
  weightChange: number;
}

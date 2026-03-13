import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://desi-wellness.preview.emergentagent.com';
const API_BASE = `${BACKEND_URL}/api`;

console.log('API Configuration:', { BACKEND_URL, API_BASE });

export const api = {
  // Auth
  signup: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  login: async (phone: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  getUser: async (userId: string) => {
    const res = await fetch(`${API_BASE}/users/${userId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  updateCalorieGoal: async (userId: string, goal: number) => {
    const res = await fetch(`${API_BASE}/users/${userId}/calorie-goal?goal=${goal}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  // Dashboard
  getDashboard: async (userId: string, date: string) => {
    const res = await fetch(`${API_BASE}/dashboard/${userId}?date=${date}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  // Foods
  getFoods: async (userId: string, search?: string) => {
    const params = new URLSearchParams({ user_id: userId });
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/foods?${params}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  createFood: async (data: any) => {
    const res = await fetch(`${API_BASE}/foods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  logFood: async (data: any) => {
    const res = await fetch(`${API_BASE}/food-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  getFoodLogs: async (userId: string, date: string) => {
    const res = await fetch(`${API_BASE}/food-logs/${userId}?date=${date}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  deleteFoodLog: async (logId: string) => {
    const res = await fetch(`${API_BASE}/food-logs/${logId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  // Exercise
  logExercise: async (data: any) => {
    const res = await fetch(`${API_BASE}/exercise-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  getExerciseLogs: async (userId: string, date: string) => {
    const res = await fetch(`${API_BASE}/exercise-logs/${userId}?date=${date}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  deleteExerciseLog: async (logId: string) => {
    const res = await fetch(`${API_BASE}/exercise-logs/${logId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  // Habits
  createHabit: async (data: any) => {
    const res = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  toggleHabit: async (data: any) => {
    const res = await fetch(`${API_BASE}/habits/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  getHabits: async (userId: string) => {
    const res = await fetch(`${API_BASE}/habits/${userId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  // Weight
  logWeight: async (data: any) => {
    const res = await fetch(`${API_BASE}/weight-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  getWeightLogs: async (userId: string) => {
    const res = await fetch(`${API_BASE}/weight-logs/${userId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

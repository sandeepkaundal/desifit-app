import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  phone: string;
  age: number;
  height: number;
  currentWeight: number;
  goalWeight: number;
  dailyCalorieGoal: number;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  saveProfile: (profile: Omit<UserProfile, 'dailyCalorieGoal' | 'createdAt'>) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateWeight: (weight: number) => Promise<void>;
  updateCalorieGoal: (goal: number) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const calculateBMR = (weight: number, height: number, age: number): number => {
  // Simplified BMR calculation (average of male/female)
  const bmr = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(bmr * 1.2); // Sedentary activity level
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  saveProfile: async (profileData) => {
    try {
      const dailyCalorieGoal = calculateBMR(
        profileData.currentWeight,
        profileData.height,
        profileData.age
      );

      const profile: UserProfile = {
        ...profileData,
        dailyCalorieGoal,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      set({ user: profile, isLoading: false });
    } catch (error) {
      console.error('Error saving profile:', error);
      set({ isLoading: false });
    }
  },

  loadProfile: async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        set({ user: profile, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      set({ user: null, isLoading: false });
    }
  },

  updateWeight: async (weight: number) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, currentWeight: weight };
    await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  updateCalorieGoal: async (goal: number) => {
    const { user } = get();
    if (!user) return;

    const updatedUser = { ...user, dailyCalorieGoal: goal };
    await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  clearProfile: async () => {
    try {
      await AsyncStorage.removeItem('userProfile');
      set({ user: null });
    } catch (error) {
      console.error('Error clearing profile:', error);
    }
  },
}));

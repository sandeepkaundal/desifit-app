import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { getTodayString } from '../../src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLocalData = async () => {
    if (!user) return;
    
    try {
      const today = getTodayString();
      
      // Get food logs
      const foodLogsStr = await AsyncStorage.getItem('food_logs');
      const allFoodLogs = foodLogsStr ? JSON.parse(foodLogsStr) : [];
      const todayFoodLogs = allFoodLogs.filter((log: any) => log.date === today);
      const caloriesConsumed = todayFoodLogs.reduce((sum: number, log: any) => sum + (log.calories || 0), 0);
      
      // Get exercise logs
      const exerciseLogsStr = await AsyncStorage.getItem('exercise_logs');
      const allExerciseLogs = exerciseLogsStr ? JSON.parse(exerciseLogsStr) : [];
      const todayExerciseLogs = allExerciseLogs.filter((log: any) => log.date === today);
      const caloriesBurned = todayExerciseLogs.reduce((sum: number, log: any) => sum + (log.caloriesBurned || 0), 0);
      
      // Get habits
      const habitsStr = await AsyncStorage.getItem('habits');
      const habits = habitsStr ? JSON.parse(habitsStr) : [];
      const totalHabits = habits.length;
      const habitsCompleted = habits.filter((habit: any) => 
        habit.completedDates && habit.completedDates.includes(today)
      ).length;
      
      // Get weight logs
      const weightLogsStr = await AsyncStorage.getItem('weight_logs');
      const weightLogs = weightLogsStr ? JSON.parse(weightLogsStr) : [];
      const weightChange = weightLogs.length > 1 
        ? weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight 
        : 0;
      
      const dashboardData = {
        caloriesConsumed,
        caloriesBurned,
        dailyCalorieGoal: user.dailyCalorieGoal,
        remainingCalories: user.dailyCalorieGoal - caloriesConsumed + caloriesBurned,
        habitsCompleted,
        totalHabits,
        currentWeight: user.currentWeight,
        goalWeight: user.goalWeight,
        weightChange,
      };
      
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocalData();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLocalData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!dashboard || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Unable to load dashboard</Text>
      </View>
    );
  }

  const calorieProgress = Math.max(
    0,
    Math.min(100, (dashboard.caloriesConsumed / dashboard.dailyCalorieGoal) * 100)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user.name}!</Text>
            <Text style={styles.date}>{new Date().toDateString()}</Text>
          </View>
          <Ionicons name="fitness" size={32} color="#10b981" />
        </View>

        {/* Calorie Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Calories</Text>
          <View style={styles.calorieMain}>
            <Text style={styles.calorieNumber}>
              {Math.round(dashboard.remainingCalories)}
            </Text>
            <Text style={styles.calorieLabel}>remaining</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${calorieProgress}%` },
              ]}
            />
          </View>

          <View style={styles.calorieStats}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant" size={20} color="#ef4444" />
              <Text style={styles.statLabel}>Consumed</Text>
              <Text style={styles.statValue}>
                {Math.round(dashboard.caloriesConsumed)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#f59e0b" />
              <Text style={styles.statLabel}>Burned</Text>
              <Text style={styles.statValue}>
                {Math.round(dashboard.caloriesBurned)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="flag" size={20} color="#10b981" />
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>
                {Math.round(dashboard.dailyCalorieGoal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Habits Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Habits</Text>
            <Text style={styles.habitCount}>
              {dashboard.habitsCompleted} / {dashboard.totalHabits}
            </Text>
          </View>
          <View style={styles.habitProgress}>
            <View
              style={[
                styles.habitProgressFill,
                {
                  width: `${dashboard.totalHabits > 0 ? (dashboard.habitsCompleted / dashboard.totalHabits) * 100 : 0}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.habitText}>
            {dashboard.habitsCompleted === dashboard.totalHabits && dashboard.totalHabits > 0
              ? '🎉 All habits completed today!'
              : dashboard.totalHabits === 0
              ? 'Add habits in the Habits tab'
              : `Keep going! ${dashboard.totalHabits - dashboard.habitsCompleted} habits left`}
          </Text>
        </View>

        {/* Weight Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weight Progress</Text>
          <View style={styles.weightRow}>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Current</Text>
              <Text style={styles.weightValue}>
                {dashboard.currentWeight.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Goal</Text>
              <Text style={styles.weightValue}>
                {dashboard.goalWeight.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Change</Text>
              <Text
                style={[
                  styles.weightValue,
                  dashboard.weightChange < 0
                    ? styles.weightLoss
                    : styles.weightGain,
                ]}
              >
                {dashboard.weightChange > 0 ? '+' : ''}
                {dashboard.weightChange.toFixed(1)} kg
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>All data stored locally on your device</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  calorieMain: {
    alignItems: 'center',
    marginVertical: 16,
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10b981',
  },
  calorieLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  calorieStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  habitProgress: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  habitProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  habitText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weightItem: {
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  weightLoss: {
    color: '#10b981',
  },
  weightGain: {
    color: '#ef4444',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

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
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';

// Circular Progress Component
const CircularProgress = ({ score, size = 140, strokeWidth = 12 }: { score: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, Math.max(0, score)) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  
  // Color based on score
  const getScoreColor = () => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Amber
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: 'bold', color: getScoreColor() }}>{score}</Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>/ 100</Text>
      </View>
    </View>
  );
};

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
      const caloriesConsumed = todayFoodLogs.reduce((sum: number, log: any) => sum + (log.totalCalories || 0), 0);
      
      // Get exercise logs
      const exerciseLogsStr = await AsyncStorage.getItem('exercise_logs');
      const allExerciseLogs = exerciseLogsStr ? JSON.parse(exerciseLogsStr) : [];
      const todayExerciseLogs = allExerciseLogs.filter((log: any) => log.date === today);
      const caloriesBurned = todayExerciseLogs.reduce((sum: number, log: any) => sum + (log.caloriesBurned || 0), 0);
      
      // Get habits
      const habitsStr = await AsyncStorage.getItem('habits');
      const habits = habitsStr ? JSON.parse(habitsStr) : [];
      
      // Get todos
      const todosStr = await AsyncStorage.getItem('todos');
      const todos = todosStr ? JSON.parse(todosStr) : [];
      
      // Calculate habit completion for today
      const habitsCompleted = habits.filter((habit: any) => 
        habit.completedDates && habit.completedDates.includes(today)
      ).length;
      
      // Calculate todo completion (all completed todos count)
      const todosCompleted = todos.filter((todo: any) => todo.completed).length;
      
      // Total tasks = all habits + incomplete todos
      const incompleteTodos = todos.filter((todo: any) => !todo.completed).length;
      const totalTasks = habits.length + incompleteTodos;
      
      // Total completed = habits completed today + todos completed
      const totalCompleted = habitsCompleted + todosCompleted;
      
      // Get weight logs
      const weightLogsStr = await AsyncStorage.getItem('weight_logs');
      const weightLogs = weightLogsStr ? JSON.parse(weightLogsStr) : [];
      const weightChange = weightLogs.length > 1 
        ? weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight 
        : 0;
      
      // Calculate Daily Fitness Score (out of 100)
      const dailyGoal = user.dailyCalorieGoal;
      
      // 1. Calories goal achieved (40 points)
      const calorieProgress = Math.min(100, (caloriesConsumed / dailyGoal) * 100);
      const caloriesScore = Math.min(40, (calorieProgress / 100) * 40);
      
      // 2. Exercise completed - minimum 200 cal burned (30 points)
      const exerciseScore = caloriesBurned >= 200 ? 30 : (caloriesBurned / 200) * 30;
      
      // 3. Habit completion (20 points)
      const habitScore = totalTasks > 0 ? (totalCompleted / totalTasks) * 20 : 0;
      
      // 4. Additional healthy actions - check for water or steps habits (10 points)
      const hasWaterHabit = habitsCompleted > 0 && habits.some((h: any) => 
        (h.habitName.toLowerCase().includes('water') || h.habitName.toLowerCase().includes('steps')) &&
        h.completedDates && h.completedDates.includes(today)
      );
      const additionalScore = hasWaterHabit ? 10 : 0;
      
      // Total fitness score
      const fitnessScore = Math.round(caloriesScore + exerciseScore + habitScore + additionalScore);
      
      // Save today's score to history
      const scoresStr = await AsyncStorage.getItem('fitness_scores');
      const allScores = scoresStr ? JSON.parse(scoresStr) : [];
      
      // Update or add today's score
      const existingScoreIndex = allScores.findIndex((s: any) => s.date === today);
      const scoreEntry = { date: today, score: fitnessScore };
      
      if (existingScoreIndex >= 0) {
        allScores[existingScoreIndex] = scoreEntry;
      } else {
        allScores.unshift(scoreEntry);
      }
      
      // Keep only last 90 days
      const scoresToKeep = allScores.slice(0, 90);
      await AsyncStorage.setItem('fitness_scores', JSON.stringify(scoresToKeep));
      
      const dashboardData = {
        caloriesConsumed,
        caloriesBurned,
        dailyCalorieGoal: user.dailyCalorieGoal,
        remainingCalories: user.dailyCalorieGoal - caloriesConsumed + caloriesBurned,
        habitsCompleted: totalCompleted,
        totalHabits: totalTasks,
        currentWeight: user.currentWeight,
        goalWeight: user.goalWeight,
        weightChange,
        fitnessScore,
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

  // Auto-reload when dashboard tab becomes active
  useFocusEffect(
    useCallback(() => {
      fetchLocalData();
    }, [user])
  );

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

        {/* Daily Fitness Score Card */}
        <View style={styles.fitnessScoreCard}>
          <Text style={styles.fitnessScoreTitle}>Daily Fitness Score</Text>
          <View style={styles.fitnessScoreContent}>
            <CircularProgress score={dashboard.fitnessScore} />
            <View style={styles.scoreBreakdown}>
              <View style={styles.scoreItem}>
                <View style={[styles.scoreDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.scoreLabel}>Calories</Text>
                <Text style={styles.scorePoints}>40 pts</Text>
              </View>
              <View style={styles.scoreItem}>
                <View style={[styles.scoreDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.scoreLabel}>Exercise</Text>
                <Text style={styles.scorePoints}>30 pts</Text>
              </View>
              <View style={styles.scoreItem}>
                <View style={[styles.scoreDot, { backgroundColor: '#8b5cf6' }]} />
                <Text style={styles.scoreLabel}>Habits</Text>
                <Text style={styles.scorePoints}>20 pts</Text>
              </View>
              <View style={styles.scoreItem}>
                <View style={[styles.scoreDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.scoreLabel}>Bonus</Text>
                <Text style={styles.scorePoints}>10 pts</Text>
              </View>
            </View>
          </View>
          <Text style={styles.fitnessScoreHint}>
            {dashboard.fitnessScore >= 80
              ? '🎯 Excellent! Keep it up!'
              : dashboard.fitnessScore >= 60
              ? '💪 Good progress! Almost there!'
              : dashboard.fitnessScore >= 40
              ? '🚀 Getting started! Keep pushing!'
              : '🌱 Every step counts!'}
          </Text>
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
  fitnessScoreCard: {
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
  fitnessScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  fitnessScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  scoreBreakdown: {
    flex: 1,
    marginLeft: 20,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  scoreLabel: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
  scorePoints: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  fitnessScoreHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
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

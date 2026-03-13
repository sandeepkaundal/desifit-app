import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyData, setMonthlyData] = useState<any>(null);

  const fetchMonthlyProgress = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Helper to check if date is in current month
      const isCurrentMonth = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      };

      // Get all logs from AsyncStorage
      const foodLogsStr = await AsyncStorage.getItem('food_logs');
      const exerciseLogsStr = await AsyncStorage.getItem('exercise_logs');
      const weightLogsStr = await AsyncStorage.getItem('weight_logs');
      const habitsStr = await AsyncStorage.getItem('habits');

      const allFoodLogs = foodLogsStr ? JSON.parse(foodLogsStr) : [];
      const allExerciseLogs = exerciseLogsStr ? JSON.parse(exerciseLogsStr) : [];
      const allWeightLogs = weightLogsStr ? JSON.parse(weightLogsStr) : [];
      const habits = habitsStr ? JSON.parse(habitsStr) : [];

      // Filter for current month
      const monthFoodLogs = allFoodLogs.filter((log: any) => isCurrentMonth(log.date));
      const monthExerciseLogs = allExerciseLogs.filter((log: any) => isCurrentMonth(log.date));
      const monthWeightLogs = allWeightLogs.filter((log: any) => isCurrentMonth(log.date));

      // Calculate weight progress
      const sortedWeightLogs = [...monthWeightLogs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const startingWeight = sortedWeightLogs[0]?.weight || user.currentWeight;
      const currentWeight = user.currentWeight;
      const weightChange = currentWeight - startingWeight;

      // Calculate calorie summary
      const totalCaloriesConsumed = monthFoodLogs.reduce(
        (sum: number, log: any) => sum + (log.totalCalories || 0),
        0
      );
      const daysInMonth = now.getDate();
      const avgDailyCalories = daysInMonth > 0 ? totalCaloriesConsumed / daysInMonth : 0;

      // Calculate exercise summary
      const totalCaloriesBurned = monthExerciseLogs.reduce(
        (sum: number, log: any) => sum + (log.caloriesBurned || 0),
        0
      );

      // Calculate habit progress
      let totalHabitDays = 0;
      let completedHabitDays = 0;

      habits.forEach((habit: any) => {
        const monthCompletions = (habit.completedDates || []).filter(
          (date: string) => isCurrentMonth(date)
        );
        completedHabitDays += monthCompletions.length;
      });

      totalHabitDays = habits.length * daysInMonth;
      const habitCompletionPercentage = totalHabitDays > 0 
        ? (completedHabitDays / totalHabitDays) * 100 
        : 0;

      // Prepare weight chart data
      const chartData = sortedWeightLogs.map((log: any) => ({
        value: log.weight,
        label: new Date(log.date).getDate().toString(),
        dataPointText: log.weight.toFixed(1),
      }));

      setMonthlyData({
        startingWeight,
        currentWeight,
        weightChange,
        totalCaloriesConsumed,
        avgDailyCalories,
        totalCaloriesBurned,
        habitCompletionPercentage,
        chartData,
        daysInMonth,
      });
    } catch (error) {
      console.error('Error fetching monthly progress:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh when screen becomes active
  useFocusEffect(
    useCallback(() => {
      fetchMonthlyProgress();
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMonthlyProgress();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!monthlyData || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Unable to load progress</Text>
      </View>
    );
  }

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
          <Ionicons name="analytics" size={32} color="#10b981" />
          <Text style={styles.title}>Monthly Progress</Text>
        </View>
        <Text style={styles.subtitle}>{monthName}</Text>

        {/* Weight Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness" size={24} color="#10b981" />
            <Text style={styles.cardTitle}>Weight Progress</Text>
          </View>

          <View style={styles.weightRow}>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Starting</Text>
              <Text style={styles.weightValue}>
                {monthlyData.startingWeight.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Current</Text>
              <Text style={styles.weightValue}>
                {monthlyData.currentWeight.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>Change</Text>
              <Text
                style={[
                  styles.weightValue,
                  monthlyData.weightChange < 0
                    ? styles.weightLoss
                    : styles.weightGain,
                ]}
              >
                {monthlyData.weightChange > 0 ? '+' : ''}
                {monthlyData.weightChange.toFixed(1)} kg
              </Text>
            </View>
          </View>

          {monthlyData.chartData.length > 1 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Weight Trend This Month</Text>
              <LineChart
                data={monthlyData.chartData}
                width={320}
                height={180}
                spacing={monthlyData.chartData.length > 10 ? 20 : 40}
                initialSpacing={10}
                color="#10b981"
                thickness={3}
                hideRules
                yAxisTextStyle={{ color: '#6b7280', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10 }}
                dataPointsColor="#10b981"
                dataPointsRadius={3}
                textShiftY={-8}
                textShiftX={-5}
                textFontSize={9}
                textColor="#1f2937"
                curved
              />
            </View>
          )}
        </View>

        {/* Calorie Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="restaurant" size={24} color="#ef4444" />
            <Text style={styles.cardTitle}>Calorie Summary</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {Math.round(monthlyData.totalCaloriesConsumed).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Consumed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {Math.round(monthlyData.avgDailyCalories)}
              </Text>
              <Text style={styles.statLabel}>Avg Daily</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color="#3b82f6" />
            <Text style={styles.infoText}>
              Based on {monthlyData.daysInMonth} days in {new Date().toLocaleDateString('en-US', { month: 'long' })}
            </Text>
          </View>
        </View>

        {/* Exercise Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={24} color="#f59e0b" />
            <Text style={styles.cardTitle}>Exercise Summary</Text>
          </View>

          <View style={styles.bigStatContainer}>
            <Text style={styles.bigStatNumber}>
              {Math.round(monthlyData.totalCaloriesBurned).toLocaleString()}
            </Text>
            <Text style={styles.bigStatLabel}>Total Calories Burned</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="trending-up" size={16} color="#f59e0b" />
            <Text style={styles.infoText}>
              Average {Math.round(monthlyData.totalCaloriesBurned / monthlyData.daysInMonth)} cal/day
            </Text>
          </View>
        </View>

        {/* Habit Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
            <Text style={styles.cardTitle}>Habit Progress</Text>
          </View>

          <View style={styles.habitProgressContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>
                {Math.round(monthlyData.habitCompletionPercentage)}%
              </Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, monthlyData.habitCompletionPercentage)}%` },
              ]}
            />
          </View>

          <Text style={styles.habitText}>
            {monthlyData.habitCompletionPercentage >= 80
              ? '🎉 Excellent consistency!'
              : monthlyData.habitCompletionPercentage >= 50
              ? '💪 Keep going!'
              : '📈 Room for improvement'}
          </Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>All data calculated from your logs</Text>
          <Text style={styles.footerText}>Pull down to refresh</Text>
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
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  bigStatContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  bigStatNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  bigStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    flex: 1,
  },
  habitProgressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#8b5cf6',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  progressLabel: {
    fontSize: 12,
    color: '#7c3aed',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  habitText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { getTodayString } from '../../src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { router } from 'expo-router';

// Simple local storage for weight logs
const WEIGHT_LOGS_KEY = 'weight_logs';

export default function ProfileScreen() {
  const { user, updateWeight, updateCalorieGoal, clearProfile } = useAuthStore();
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editGoalModal, setEditGoalModal] = useState(false);
  const [weight, setWeight] = useState('');
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    loadWeightLogs();
  }, []);

  const loadWeightLogs = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const logsStr = await AsyncStorage.getItem(WEIGHT_LOGS_KEY);
      if (logsStr) {
        setWeightLogs(JSON.parse(logsStr));
      }
    } catch (error) {
      console.error('Error loading weight logs:', error);
    }
  };

  const handleLogWeight = async () => {
    if (!user) return;

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const newLog = {
        id: Date.now().toString(),
        weight: weightNum,
        date: getTodayString(),
        timestamp: new Date().toISOString(),
      };

      const updatedLogs = [newLog, ...weightLogs];
      await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updatedLogs));
      setWeightLogs(updatedLogs);
      await updateWeight(weightNum);

      setModalVisible(false);
      setWeight('');
      Alert.alert('Success', 'Weight logged successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to log weight');
    }
  };

  const handleResetProfile = () => {
    Alert.alert('Reset Profile', 'Are you sure? All local data will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearProfile();
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem(WEIGHT_LOGS_KEY);
          await AsyncStorage.removeItem('food_logs');
          await AsyncStorage.removeItem('exercise_logs');
          await AsyncStorage.removeItem('habits');
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const handleUpdateGoal = async () => {
    const goalNum = parseFloat(newGoal);
    if (isNaN(goalNum) || goalNum <= 0) {
      Alert.alert('Error', 'Please enter a valid calorie goal');
      return;
    }

    try {
      await updateCalorieGoal(goalNum);
      setEditGoalModal(false);
      setNewGoal('');
      Alert.alert('Success', 'Calorie goal updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  // Prepare chart data
  const chartData =
    weightLogs.length > 0
      ? weightLogs
          .slice(0, 10)
          .reverse()
          .map((log) => ({
            value: log.weight,
            label: log.date.substring(5),
            dataPointText: log.weight.toFixed(1),
          }))
      : [];

  const weightChange =
    weightLogs.length > 1
      ? weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight
      : 0;

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#10b981" />
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.phone}>{user.phone}</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Age</Text>
              <Text style={styles.statValue}>{user.age}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Height</Text>
              <Text style={styles.statValue}>{user.height} cm</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>{user.currentWeight} kg</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{user.goalWeight} kg</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editGoalButton}
            onPress={() => {
              setNewGoal(user.dailyCalorieGoal.toString());
              setEditGoalModal(true);
            }}
          >
            <Text style={styles.editGoalText}>
              Daily Calorie Goal: {Math.round(user.dailyCalorieGoal)} cal
            </Text>
            <Ionicons name="pencil" size={16} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Weight Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weight Progress</Text>
            <TouchableOpacity
              style={styles.logWeightButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>

          {weightLogs.length > 0 ? (
            <>
              <View style={styles.weightChangeCard}>
                <Text style={styles.weightChangeLabel}>Total Change</Text>
                <Text
                  style={[
                    styles.weightChangeValue,
                    weightChange < 0 ? styles.weightLoss : styles.weightGain,
                  ]}
                >
                  {weightChange > 0 ? '+' : ''}
                  {weightChange.toFixed(1)} kg
                </Text>
              </View>

              {chartData.length > 1 && (
                <View style={styles.chartContainer}>
                  <LineChart
                    data={chartData}
                    width={320}
                    height={200}
                    spacing={40}
                    initialSpacing={20}
                    color="#10b981"
                    thickness={3}
                    hideRules
                    yAxisTextStyle={{ color: '#6b7280' }}
                    xAxisLabelTextStyle={{ color: '#6b7280', fontSize: 10 }}
                    dataPointsColor="#10b981"
                    dataPointsRadius={4}
                    textShiftY={-8}
                    textShiftX={-5}
                    textFontSize={10}
                    textColor="#1f2937"
                    curved
                  />
                </View>
              )}

              <View style={styles.recentLogs}>
                <Text style={styles.recentTitle}>Recent Entries</Text>
                {weightLogs.slice(0, 5).map((log) => (
                  <View key={log.id} style={styles.logRow}>
                    <Text style={styles.logDate}>{log.date}</Text>
                    <Text style={styles.logWeight}>{log.weight.toFixed(1)} kg</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>
              No weight entries yet. Tap + to log your first weight.
            </Text>
          )}
        </View>

        {/* Reset Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleResetProfile}>
          <Ionicons name="refresh-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Reset Profile</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>All data is stored locally on your device</Text>
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Weight</Text>

            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogWeight}
              >
                <Text style={styles.confirmButtonText}>Log Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Calorie Goal Modal */}
      <Modal
        visible={editGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditGoalModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Calorie Goal</Text>

            <TextInput
              style={styles.input}
              placeholder="Daily Calories"
              value={newGoal}
              onChangeText={setNewGoal}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditGoalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUpdateGoal}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  phone: {
    fontSize: 16,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  editGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  editGoalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10b981',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logWeightButton: {
    padding: 4,
  },
  weightChangeCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  weightChangeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  weightChangeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  weightLoss: {
    color: '#10b981',
  },
  weightGain: {
    color: '#ef4444',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  recentLogs: {
    marginTop: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  logWeight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footerNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

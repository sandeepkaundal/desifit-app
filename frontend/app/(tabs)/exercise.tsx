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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Exercise activities with calories per minute
const ACTIVITIES = [
  { name: 'Walking', icon: 'walk', color: '#3b82f6', caloriesPerMinute: 4.2 },
  { name: 'Running', icon: 'flash', color: '#ef4444', caloriesPerMinute: 10.0 },
  { name: 'Cycling', icon: 'bicycle', color: '#8b5cf6', caloriesPerMinute: 8.3 },
  { name: 'Yoga', icon: 'fitness', color: '#10b981', caloriesPerMinute: 4.2 },
  { name: 'Skipping', icon: 'trending-up', color: '#f59e0b', caloriesPerMinute: 11.7 },
  { name: 'Gym', icon: 'barbell', color: '#6366f1', caloriesPerMinute: 6.7 },
];

export default function ExerciseScreen() {
  const { user } = useAuthStore();
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [duration, setDuration] = useState('');

  useEffect(() => {
    loadExerciseLogs();
  }, []);

  const loadExerciseLogs = async () => {
    try {
      const logsStr = await AsyncStorage.getItem('exercise_logs');
      const allLogs = logsStr ? JSON.parse(logsStr) : [];
      const today = getTodayString();
      const todayLogs = allLogs.filter((log: any) => log.date === today);
      setExerciseLogs(todayLogs);
    } catch (error) {
      console.error('Error loading exercise logs:', error);
    }
  };

  const handleSelectActivity = (activity: any) => {
    setSelectedActivity(activity);
    setDuration('');
    setModalVisible(true);
  };

  const handleLogExercise = async () => {
    if (!selectedActivity) return;

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Please enter valid duration in minutes');
      return;
    }

    try {
      // Calculate: Calories Burned = Calories per minute × Duration
      const caloriesBurned = selectedActivity.caloriesPerMinute * durationNum;

      const newLog = {
        id: Date.now().toString(),
        exerciseName: selectedActivity.name,
        caloriesPerMinute: selectedActivity.caloriesPerMinute,
        duration: durationNum,
        caloriesBurned: caloriesBurned,
        date: getTodayString(),
        timestamp: new Date().toISOString(),
      };

      // Load existing logs
      const logsStr = await AsyncStorage.getItem('exercise_logs');
      const allLogs = logsStr ? JSON.parse(logsStr) : [];

      // Add new log
      allLogs.unshift(newLog);

      // Save back to storage
      await AsyncStorage.setItem('exercise_logs', JSON.stringify(allLogs));

      // Update UI
      loadExerciseLogs();
      setModalVisible(false);
      setDuration('');

      Alert.alert(
        'Success',
        `Logged ${durationNum} mins of ${selectedActivity.name} (${Math.round(caloriesBurned)} cal burned)`
      );
    } catch (error) {
      console.error('Error logging exercise:', error);
      Alert.alert('Error', 'Failed to log exercise');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const logsStr = await AsyncStorage.getItem('exercise_logs');
      const allLogs = logsStr ? JSON.parse(logsStr) : [];

      // Remove the log
      const updatedLogs = allLogs.filter((log: any) => log.id !== logId);

      // Save back
      await AsyncStorage.setItem('exercise_logs', JSON.stringify(updatedLogs));

      // Update UI
      loadExerciseLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
      Alert.alert('Error', 'Failed to delete log');
    }
  };

  const totalCalories = exerciseLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
  const totalDuration = exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Tracker</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={32} color="#ef4444" />
          <Text style={styles.statValue}>{Math.round(totalCalories)}</Text>
          <Text style={styles.statLabel}>Calories Burned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="time" size={32} color="#10b981" />
          <Text style={styles.statValue}>{totalDuration}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activities */}
        <Text style={styles.sectionTitle}>Activities</Text>
        <View style={styles.activitiesGrid}>
          {ACTIVITIES.map((activity) => (
            <TouchableOpacity
              key={activity.name}
              style={[styles.activityCard, { borderColor: activity.color }]}
              onPress={() => handleSelectActivity(activity)}
            >
              <Ionicons name={activity.icon as any} size={32} color={activity.color} />
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityRate}>
                ~{activity.caloriesPerMinute} cal/min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Logs */}
        <Text style={styles.sectionTitle}>Today's Workouts</Text>
        {exerciseLogs.length === 0 ? (
          <Text style={styles.emptyText}>No exercise logged yet today</Text>
        ) : (
          exerciseLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logInfo}>
                <Text style={styles.logName}>{log.exerciseName}</Text>
                <Text style={styles.logDetails}>
                  {log.duration} mins • {log.caloriesPerMinute} cal/min = {Math.round(log.caloriesBurned)} cal burned
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Log Exercise Modal */}
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
            <Text style={styles.modalTitle}>Log {selectedActivity?.name}</Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Calories per minute:</Text>
              <Text style={styles.infoValue}>
                {selectedActivity?.caloriesPerMinute} cal/min
              </Text>
            </View>

            <Text style={styles.inputLabel}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter duration"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />

            <View style={styles.calculationBox}>
              <Text style={styles.calculationLabel}>Calories Burned:</Text>
              <Text style={styles.calculationValue}>
                {selectedActivity?.caloriesPerMinute} × {duration || 0} = {Math.round((selectedActivity?.caloriesPerMinute || 0) * parseFloat(duration || '0'))} cal
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogExercise}
              >
                <Text style={styles.confirmButtonText}>Log Exercise</Text>
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
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  activityCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  activityRate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  logDetails: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
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
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#0369a1',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284c7',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calculationBox: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  calculationLabel: {
    fontSize: 14,
    color: '#b45309',
    fontWeight: '600',
    marginBottom: 4,
  },
  calculationValue: {
    fontSize: 18,
    color: '#92400e',
    fontWeight: 'bold',
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

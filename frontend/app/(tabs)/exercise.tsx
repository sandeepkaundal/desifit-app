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
import { api } from '../../src/utils/api';
import { getTodayString, calculateExerciseCalories } from '../../src/utils/helpers';
import { ExerciseLog } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

const ACTIVITIES = [
  { name: 'Walking', icon: 'walk', color: '#3b82f6' },
  { name: 'Running', icon: 'flash', color: '#ef4444' },
  { name: 'Cycling', icon: 'bicycle', color: '#8b5cf6' },
  { name: 'Yoga', icon: 'fitness', color: '#10b981' },
  { name: 'Skipping', icon: 'trending-up', color: '#f59e0b' },
  { name: 'Gym', icon: 'barbell', color: '#6366f1' },
];

export default function ExerciseScreen() {
  const { user } = useAuthStore();
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    fetchExerciseLogs();
  }, [user]);

  const fetchExerciseLogs = async () => {
    if (!user) return;
    try {
      const data = await api.getExerciseLogs(user.id, getTodayString());
      setExerciseLogs(data);
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
    }
  };

  const handleSelectActivity = (activityName: string) => {
    setSelectedActivity(activityName);
    setDuration('');
    setModalVisible(true);
  };

  const handleLogExercise = async () => {
    if (!user || !selectedActivity) return;

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Please enter valid duration in minutes');
      return;
    }

    const caloriesBurned = calculateExerciseCalories(selectedActivity, durationNum);

    try {
      await api.logExercise({
        userId: user.id,
        activityType: selectedActivity,
        duration: durationNum,
        caloriesBurned,
        date: getTodayString(),
      });

      setModalVisible(false);
      fetchExerciseLogs();
      Alert.alert('Success', `Logged ${durationNum} minutes of ${selectedActivity}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to log exercise');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await api.deleteExerciseLog(logId);
      fetchExerciseLogs();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete log');
    }
  };

  const totalCalories = exerciseLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);
  const totalDuration = exerciseLogs.reduce((sum, log) => sum + log.duration, 0);

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
              onPress={() => handleSelectActivity(activity.name)}
            >
              <Ionicons name={activity.icon as any} size={32} color={activity.color} />
              <Text style={styles.activityName}>{activity.name}</Text>
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
                <Text style={styles.logName}>{log.activityType}</Text>
                <Text style={styles.logDetails}>
                  {log.duration} mins • {Math.round(log.caloriesBurned)} cal burned
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
            <Text style={styles.modalTitle}>Log {selectedActivity}</Text>

            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />

            {duration && (
              <Text style={styles.estimateText}>
                Estimated: ~{calculateExerciseCalories(selectedActivity, parseInt(duration) || 0)} calories
              </Text>
            )}

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
    fontSize: 14,
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  estimateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 24,
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

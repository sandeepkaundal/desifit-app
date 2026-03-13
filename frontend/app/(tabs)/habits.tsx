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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/utils/api';
import { getTodayString } from '../../src/utils/helpers';
import { Habit } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_HABITS = [
  { name: 'Drink Water', icon: 'water' },
  { name: 'Walking Steps', icon: 'walk' },
  { name: 'Workout', icon: 'barbell' },
  { name: 'Avoid Sugar', icon: 'fast-food' },
  { name: 'Eat Vegetables', icon: 'leaf' },
  { name: 'Sleep Early', icon: 'moon' },
];

export default function HabitsScreen() {
  const { user } = useAuthStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [customHabit, setCustomHabit] = useState('');

  useEffect(() => {
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    if (!user) return;
    try {
      const data = await api.getHabits(user.id);
      setHabits(data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const handleAddHabit = async (habitName: string) => {
    if (!user) return;
    
    // Check if habit already exists
    if (habits.find(h => h.habitName === habitName)) {
      Alert.alert('Info', 'This habit already exists!');
      return;
    }

    try {
      await api.createHabit({
        userId: user.id,
        habitName,
      });
      fetchHabits();
      setModalVisible(false);
      setCustomHabit('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add habit');
    }
  };

  const handleToggleHabit = async (habit: Habit) => {
    if (!user) return;

    const today = getTodayString();
    const isCompleted = habit.completedDates.includes(today);

    try {
      await api.toggleHabit({
        userId: user.id,
        habitName: habit.habitName,
        date: today,
        completed: !isCompleted,
      });
      fetchHabits();
    } catch (error) {
      Alert.alert('Error', 'Failed to update habit');
    }
  };

  const isHabitCompletedToday = (habit: Habit) => {
    return habit.completedDates.includes(getTodayString());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habit Tracker</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={32} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No habits yet!</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first habit</Text>
          </View>
        ) : (
          habits.map((habit) => {
            const isCompleted = isHabitCompletedToday(habit);
            return (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitCard,
                  isCompleted && styles.habitCardCompleted,
                ]}
                onPress={() => handleToggleHabit(habit)}
              >
                <View style={styles.habitLeft}>
                  <View
                    style={[
                      styles.checkbox,
                      isCompleted && styles.checkboxCompleted,
                    ]}
                  >
                    {isCompleted && (
                      <Ionicons name="checkmark" size={20} color="#ffffff" />
                    )}
                  </View>
                  <View style={styles.habitInfo}>
                    <Text
                      style={[
                        styles.habitName,
                        isCompleted && styles.habitNameCompleted,
                      ]}
                    >
                      {habit.habitName}
                    </Text>
                    <Text style={styles.habitStreak}>
                      {habit.currentStreak > 0
                        ? `🔥 ${habit.currentStreak} day streak`
                        : 'Start your streak today!'}
                    </Text>
                  </View>
                </View>
                <View style={styles.habitRight}>
                  <Text style={styles.longestStreak}>Best: {habit.longestStreak}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Habit</Text>

            <Text style={styles.sectionLabel}>Popular Habits</Text>
            <View style={styles.defaultHabits}>
              {DEFAULT_HABITS.map((habit) => (
                <TouchableOpacity
                  key={habit.name}
                  style={styles.defaultHabitButton}
                  onPress={() => handleAddHabit(habit.name)}
                >
                  <Ionicons name={habit.icon as any} size={20} color="#10b981" />
                  <Text style={styles.defaultHabitText}>{habit.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Custom Habit</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter habit name"
              value={customHabit}
              onChangeText={setCustomHabit}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setCustomHabit('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (customHabit.trim()) {
                    handleAddHabit(customHabit.trim());
                  } else {
                    Alert.alert('Error', 'Please enter a habit name');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Add Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  habitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  habitCardCompleted: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  habitNameCompleted: {
    color: '#10b981',
  },
  habitStreak: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  habitRight: {
    alignItems: 'flex-end',
  },
  longestStreak: {
    fontSize: 12,
    color: '#6b7280',
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  defaultHabits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  defaultHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  defaultHabitText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
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

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
import { getTodayString } from '../../src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_HABITS = [
  { name: 'Drink Water', icon: 'water' },
  { name: 'Walk 8000 Steps', icon: 'walk' },
  { name: 'Workout', icon: 'barbell' },
  { name: 'Sleep before 11', icon: 'moon' },
  { name: 'Eat Vegetables', icon: 'leaf' },
  { name: 'Avoid Sugar', icon: 'fast-food' },
];

const calculateStreaks = (completedDates: string[]): { current: number; longest: number } => {
  if (completedDates.length === 0) return { current: 0, longest: 0 };

  const sorted = completedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = getTodayString();
  
  let currentStreak = 0;
  const todayDate = new Date(today);
  
  for (let i = 0; i < sorted.length; i++) {
    const expectedDate = new Date(todayDate);
    expectedDate.setDate(todayDate.getDate() - i);
    const expectedStr = expectedDate.toISOString().split('T')[0];
    
    if (sorted[i] === expectedStr) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  let longestStreak = 1;
  let tempStreak = 1;
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const date1 = new Date(sorted[i]);
    const date2 = new Date(sorted[i + 1]);
    const diff = Math.abs(date1.getTime() - date2.getTime());
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  
  return { current: currentStreak, longest: longestStreak };
};

export default function HabitsScreen() {
  const [habits, setHabits] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'habit' | 'todo'>('habit');
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    loadHabits();
    loadTodos();
  }, []);

  const loadHabits = async () => {
    try {
      const habitsStr = await AsyncStorage.getItem('habits');
      const loadedHabits = habitsStr ? JSON.parse(habitsStr) : [];
      setHabits(loadedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadTodos = async () => {
    try {
      const todosStr = await AsyncStorage.getItem('todos');
      const loadedTodos = todosStr ? JSON.parse(todosStr) : [];
      setTodos(loadedTodos);
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const handleAddHabit = async (habitName: string) => {
    if (habits.find(h => h.habitName === habitName)) {
      Alert.alert('Info', 'This habit already exists!');
      return;
    }

    try {
      const newHabit = {
        id: Date.now().toString(),
        habitName,
        type: 'habit',
        completedDates: [],
        currentStreak: 0,
        longestStreak: 0,
      };

      const updatedHabits = [...habits, newHabit];
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
      
      setHabits(updatedHabits);
      setModalVisible(false);
      setCustomInput('');
    } catch (error) {
      console.error('Error adding habit:', error);
      Alert.alert('Error', 'Failed to add habit');
    }
  };

  const handleAddTodo = async (taskName: string) => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    try {
      const newTodo = {
        id: Date.now().toString(),
        taskName: taskName.trim(),
        type: 'todo',
        completed: false,
        createdDate: getTodayString(),
      };

      const updatedTodos = [...todos, newTodo];
      await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
      
      setTodos(updatedTodos);
      setModalVisible(false);
      setCustomInput('');
    } catch (error) {
      console.error('Error adding todo:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleToggleHabit = async (habit: any) => {
    const today = getTodayString();
    const isCompleted = habit.completedDates.includes(today);

    try {
      let updatedDates;
      if (isCompleted) {
        updatedDates = habit.completedDates.filter((d: string) => d !== today);
      } else {
        updatedDates = [...habit.completedDates, today];
      }

      const streaks = calculateStreaks(updatedDates);

      const updatedHabit = {
        ...habit,
        completedDates: updatedDates,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
      };

      const updatedHabits = habits.map(h => 
        h.id === habit.id ? updatedHabit : h
      );

      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Error toggling habit:', error);
      Alert.alert('Error', 'Failed to update habit');
    }
  };

  const handleToggleTodo = async (todo: any) => {
    try {
      const updatedTodo = {
        ...todo,
        completed: !todo.completed,
        completedDate: !todo.completed ? getTodayString() : null,
      };

      const updatedTodos = todos.map(t => 
        t.id === todo.id ? updatedTodo : t
      );

      await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error toggling todo:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedTodos = todos.filter(t => t.id !== todoId);
            await AsyncStorage.setItem('todos', JSON.stringify(updatedTodos));
            setTodos(updatedTodos);
          } catch (error) {
            console.error('Error deleting todo:', error);
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const isHabitCompletedToday = (habit: any) => {
    return habit.completedDates.includes(getTodayString());
  };

  const openAddModal = (type: 'habit' | 'todo') => {
    setModalType(type);
    setCustomInput('');
    setModalVisible(true);
  };

  // Calculate today's completion for dashboard
  const todayHabitsCompleted = habits.filter(h => isHabitCompletedToday(h)).length;
  const todayTodosCompleted = todos.filter(t => t.completed).length;
  const totalTasksToday = habits.length + todos.filter(t => !t.completed).length;
  const totalCompletedToday = todayHabitsCompleted + todayTodosCompleted;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks & Habits</Text>
          <Text style={styles.subtitle}>
            {totalCompletedToday}/{totalTasksToday} completed today
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Health Habits Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="fitness" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Health Habits</Text>
            </View>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => openAddModal('habit')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#10b981" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDesc}>Daily habits that reset every day</Text>

          {habits.length === 0 ? (
            <Text style={styles.emptyText}>No health habits yet. Tap + to add one!</Text>
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
        </View>

        {/* Personal To-Do List Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="list" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Personal To-Do List</Text>
            </View>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={() => openAddModal('todo')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDesc}>Tasks that stay until completed</Text>

          {todos.length === 0 ? (
            <Text style={styles.emptyText}>No tasks yet. Tap + to add a task!</Text>
          ) : (
            <>
              {/* Active Tasks */}
              {todos.filter(t => !t.completed).map((todo) => (
                <View key={todo.id} style={styles.todoCard}>
                  <TouchableOpacity
                    style={styles.todoLeft}
                    onPress={() => handleToggleTodo(todo)}
                  >
                    <View style={styles.todoCheckbox}>
                      <Ionicons name="square-outline" size={24} color="#6b7280" />
                    </View>
                    <Text style={styles.todoName}>{todo.taskName}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteTodo(todo.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Completed Tasks */}
              {todos.filter(t => t.completed).length > 0 && (
                <>
                  <Text style={styles.completedHeader}>Completed</Text>
                  {todos.filter(t => t.completed).map((todo) => (
                    <View key={todo.id} style={styles.todoCardCompleted}>
                      <TouchableOpacity
                        style={styles.todoLeft}
                        onPress={() => handleToggleTodo(todo)}
                      >
                        <View style={styles.todoCheckbox}>
                          <Ionicons name="checkmark-square" size={24} color="#10b981" />
                        </View>
                        <Text style={styles.todoNameCompleted}>{todo.taskName}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteTodo(todo.id)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Task/Habit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'habit' ? 'Add Health Habit' : 'Add To-Do Task'}
            </Text>

            {modalType === 'habit' && (
              <>
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
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder={
                modalType === 'habit'
                  ? 'Enter habit name'
                  : 'Enter task description'
              }
              value={customInput}
              onChangeText={setCustomInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setCustomInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (modalType === 'habit') {
                    if (customInput.trim()) {
                      handleAddHabit(customInput.trim());
                    } else {
                      Alert.alert('Error', 'Please enter a habit name');
                    }
                  } else {
                    handleAddTodo(customInput);
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>
                  {modalType === 'habit' ? 'Add Habit' : 'Add Task'}
                </Text>
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
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  addIconButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginVertical: 20,
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
  todoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  todoCardCompleted: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  todoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoCheckbox: {
    marginRight: 12,
  },
  todoName: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  todoNameCompleted: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    flex: 1,
  },
  completedHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
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

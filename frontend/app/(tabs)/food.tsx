import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/utils/api';
import { getTodayString } from '../../src/utils/helpers';
import { Food, FoodLog } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function FoodScreen() {
  const { user } = useAuthStore();
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [addFoodModal, setAddFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  
  // Add custom food states
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customServing, setCustomServing] = useState('100g');

  useEffect(() => {
    fetchFoods();
    fetchFoodLogs();
  }, [user]);

  const fetchFoods = async () => {
    if (!user) return;
    try {
      const data = await api.getFoods(user.id, search);
      setFoods(data);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodLogs = async () => {
    if (!user) return;
    try {
      const data = await api.getFoodLogs(user.id, getTodayString());
      setFoodLogs(data);
    } catch (error) {
      console.error('Error fetching food logs:', error);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchFoods();
  };

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity('1');
    setModalVisible(true);
  };

  const handleLogFood = async () => {
    if (!user || !selectedFood) return;
    
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      await api.logFood({
        userId: user.id,
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        quantity: qty,
        calories: selectedFood.calories * qty,
        date: getTodayString(),
      });
      
      setModalVisible(false);
      fetchFoodLogs();
      Alert.alert('Success', 'Food logged successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to log food');
    }
  };

  const handleAddCustomFood = async () => {
    if (!user) return;
    
    if (!customName.trim() || !customCalories) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await api.createFood({
        name: customName,
        calories: parseFloat(customCalories),
        servingSize: customServing,
        category: 'custom',
        isCustom: true,
        userId: user.id,
      });
      
      setAddFoodModal(false);
      setCustomName('');
      setCustomCalories('');
      setCustomServing('100g');
      fetchFoods();
      Alert.alert('Success', 'Custom food added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await api.deleteFoodLog(logId);
      fetchFoodLogs();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete log');
    }
  };

  const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Tracker</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddFoodModal(true)}
        >
          <Ionicons name="add-circle" size={32} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Today's Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Today's Calories</Text>
        <Text style={styles.totalValue}>{Math.round(totalCalories)} cal</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Logs */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {foodLogs.length === 0 ? (
          <Text style={styles.emptyText}>No food logged yet today</Text>
        ) : (
          foodLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logInfo}>
                <Text style={styles.logName}>{log.foodName}</Text>
                <Text style={styles.logDetails}>
                  Quantity: {log.quantity}x • {Math.round(log.calories)} cal
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Available Foods */}
        <Text style={styles.sectionTitle}>Available Foods</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" />
        ) : (
          foods.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.foodItem}
              onPress={() => handleSelectFood(food)}
            >
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodDetails}>
                  {food.calories} cal per {food.servingSize}
                  {food.isCustom && ' • Custom'}
                </Text>
              </View>
              <Ionicons name="add-circle-outline" size={24} color="#10b981" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Log Food Modal */}
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
            <Text style={styles.modalTitle}>Log Food</Text>
            <Text style={styles.foodNameModal}>{selectedFood?.name}</Text>
            <Text style={styles.foodCalModal}>
              {selectedFood?.calories} cal per {selectedFood?.servingSize}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />

            <Text style={styles.totalCalText}>
              Total: {Math.round((selectedFood?.calories || 0) * parseFloat(quantity || '0'))} calories
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogFood}
              >
                <Text style={styles.confirmButtonText}>Log Food</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Custom Food Modal */}
      <Modal
        visible={addFoodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddFoodModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Food</Text>

            <TextInput
              style={styles.input}
              placeholder="Food Name"
              value={customName}
              onChangeText={setCustomName}
            />

            <TextInput
              style={styles.input}
              placeholder="Calories"
              value={customCalories}
              onChangeText={setCustomCalories}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Serving Size (e.g., 100g, 1 piece)"
              value={customServing}
              onChangeText={setCustomServing}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddFoodModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddCustomFood}
              >
                <Text style={styles.confirmButtonText}>Add Food</Text>
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
  totalCard: {
    backgroundColor: '#10b981',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 12,
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
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  foodDetails: {
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
    marginBottom: 16,
  },
  foodNameModal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  foodCalModal: {
    fontSize: 14,
    color: '#6b7280',
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
  totalCalText: {
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

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
import { getTodayString } from '../../src/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pre-populated Indian foods database
const INDIAN_FOODS = [
  { id: '1', name: 'Roti (Chapati)', calories: 70, servingSize: '1 piece' },
  { id: '2', name: 'Rice (Cooked)', calories: 130, servingSize: '100g' },
  { id: '3', name: 'Dal (Cooked)', calories: 100, servingSize: '100g' },
  { id: '4', name: 'Paneer Sabzi', calories: 180, servingSize: '100g' },
  { id: '5', name: 'Poha', calories: 160, servingSize: '100g' },
  { id: '6', name: 'Idli', calories: 39, servingSize: '1 piece' },
  { id: '7', name: 'Dosa', calories: 120, servingSize: '1 piece' },
  { id: '8', name: 'Rajma', calories: 140, servingSize: '100g' },
  { id: '9', name: 'Chole', calories: 164, servingSize: '100g' },
  { id: '10', name: 'Paratha', calories: 300, servingSize: '1 piece' },
  { id: '11', name: 'Sambar', calories: 80, servingSize: '100g' },
  { id: '12', name: 'Upma', calories: 150, servingSize: '100g' },
  { id: '13', name: 'Aloo Sabzi', calories: 130, servingSize: '100g' },
  { id: '14', name: 'Biryani', calories: 200, servingSize: '100g' },
  { id: '15', name: 'Khichdi', calories: 120, servingSize: '100g' },
];

export default function FoodScreen() {
  const { user } = useAuthStore();
  const [foods, setFoods] = useState<any[]>([]);
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [addFoodModal, setAddFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  
  // Add custom food states
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customServing, setCustomServing] = useState('100g');

  useEffect(() => {
    loadFoods();
    loadFoodLogs();
  }, []);

  const loadFoods = async () => {
    try {
      // Load custom foods from storage
      const customFoodsStr = await AsyncStorage.getItem('custom_foods');
      const customFoods = customFoodsStr ? JSON.parse(customFoodsStr) : [];
      
      // Combine with pre-populated foods
      const allFoods = [...INDIAN_FOODS, ...customFoods];
      
      // Filter by search
      if (search.trim()) {
        const filtered = allFoods.filter(food => 
          food.name.toLowerCase().includes(search.toLowerCase())
        );
        setFoods(filtered);
      } else {
        setFoods(allFoods);
      }
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  };

  const loadFoodLogs = async () => {
    try {
      const logsStr = await AsyncStorage.getItem('food_logs');
      const allLogs = logsStr ? JSON.parse(logsStr) : [];
      const today = getTodayString();
      const todayLogs = allLogs.filter((log: any) => log.date === today);
      setFoodLogs(todayLogs);
    } catch (error) {
      console.error('Error loading food logs:', error);
    }
  };

  const handleSearch = () => {
    loadFoods();
  };

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    setQuantity('1');
    setModalVisible(true);
  };

  const handleLogFood = async () => {
    if (!selectedFood) return;
    
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      // Calculate total calories: Food Calories × Quantity
      const totalCalories = selectedFood.calories * qty;
      
      const newLog = {
        id: Date.now().toString(),
        foodName: selectedFood.name,
        caloriesPerUnit: selectedFood.calories,
        servingSize: selectedFood.servingSize,
        quantity: qty,
        totalCalories: totalCalories,
        date: getTodayString(),
        timestamp: new Date().toISOString(),
      };

      // Load existing logs
      const logsStr = await AsyncStorage.getItem('food_logs');
      const allLogs = logsStr ? JSON.parse(logsStr) : [];
      
      // Add new log
      allLogs.unshift(newLog);
      
      // Save back to storage
      await AsyncStorage.setItem('food_logs', JSON.stringify(allLogs));
      
      // Update UI
      loadFoodLogs();
      setModalVisible(false);
      setQuantity('1');
      
      Alert.alert('Success', `Logged ${qty}x ${selectedFood.name} (${Math.round(totalCalories)} cal)`);
    } catch (error) {
      console.error('Error logging food:', error);
      Alert.alert('Error', 'Failed to log food');
    }
  };

  const handleAddCustomFood = async () => {
    if (!customName.trim() || !customCalories) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const newFood = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        calories: parseFloat(customCalories),
        servingSize: customServing.trim(),
        isCustom: true,
      };

      // Load existing custom foods
      const customFoodsStr = await AsyncStorage.getItem('custom_foods');
      const customFoods = customFoodsStr ? JSON.parse(customFoodsStr) : [];
      
      // Add new food
      customFoods.push(newFood);
      
      // Save back
      await AsyncStorage.setItem('custom_foods', JSON.stringify(customFoods));
      
      // Reset form
      setAddFoodModal(false);
      setCustomName('');
      setCustomCalories('');
      setCustomServing('100g');
      
      // Reload foods
      loadFoods();
      
      Alert.alert('Success', 'Custom food added!');
    } catch (error) {
      console.error('Error adding custom food:', error);
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const logsStr = await AsyncStorage.getItem('food_logs');
      const allLogs = logsStr ? JSON.parse(logsStr) : [];
      
      // Remove the log
      const updatedLogs = allLogs.filter((log: any) => log.id !== logId);
      
      // Save back
      await AsyncStorage.setItem('food_logs', JSON.stringify(updatedLogs));
      
      // Update UI
      loadFoodLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
      Alert.alert('Error', 'Failed to delete log');
    }
  };

  // Calculate total calories for today
  const totalCalories = foodLogs.reduce((sum, log) => sum + (log.totalCalories || 0), 0);

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
        <Text style={styles.totalSubtext}>{foodLogs.length} items logged</Text>
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
                  {log.quantity}x {log.servingSize} • {log.caloriesPerUnit} cal/unit = {Math.round(log.totalCalories)} cal total
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
        ) : foods.length === 0 ? (
          <Text style={styles.emptyText}>No foods found</Text>
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

            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter quantity (e.g., 2)"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />

            <View style={styles.calculationBox}>
              <Text style={styles.calculationLabel}>Total Calories:</Text>
              <Text style={styles.calculationValue}>
                {selectedFood?.calories} × {quantity || 0} = {Math.round((selectedFood?.calories || 0) * parseFloat(quantity || '0'))} cal
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

            <Text style={styles.inputLabel}>Food Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Homemade Dal"
              value={customName}
              onChangeText={setCustomName}
            />

            <Text style={styles.inputLabel}>Calories per Serving</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 150"
              value={customCalories}
              onChangeText={setCustomCalories}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Serving Size</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 100g or 1 bowl"
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
  totalSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
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
    fontSize: 13,
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
    minHeight: 400,
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
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  calculationLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  calculationValue: {
    fontSize: 18,
    color: '#047857',
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

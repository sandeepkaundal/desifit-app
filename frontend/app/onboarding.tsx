import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const { saveProfile } = useAuthStore();

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number');
      return;
    }
    if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Required', 'Please enter a valid age');
      return;
    }
    if (!height || parseFloat(height) < 50 || parseFloat(height) > 300) {
      Alert.alert('Required', 'Please enter a valid height (in cm)');
      return;
    }
    if (!currentWeight || parseFloat(currentWeight) < 20) {
      Alert.alert('Required', 'Please enter a valid current weight (in kg)');
      return;
    }
    if (!goalWeight || parseFloat(goalWeight) < 20) {
      Alert.alert('Required', 'Please enter a valid goal weight (in kg)');
      return;
    }

    setLoading(true);
    try {
      await saveProfile({
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age),
        height: parseFloat(height),
        currentWeight: parseFloat(currentWeight),
        goalWeight: parseFloat(goalWeight),
      });

      // Navigate to dashboard
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Ionicons name="fitness" size={64} color="#10b981" />
            <Text style={styles.title}>Welcome to DesiFit</Text>
            <Text style={styles.subtitle}>Let's set up your profile</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="170"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Current Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="75"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Goal Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="65"
                  value={goalWeight}
                  onChangeText={setGoalWeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Get Started</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              All data is stored locally on your device
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});

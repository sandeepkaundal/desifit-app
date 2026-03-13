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
import { api } from '../src/utils/api';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [loading, setLoading] = useState(false);
  
  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const user = await api.login(phone);
      await setUser(user);
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('Error', 'Phone number not found. Please sign up first.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!phone.trim() || !name.trim() || !age || !height || !currentWeight || !goalWeight) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await api.signup({
        phone,
        name,
        age: parseInt(age),
        height: parseFloat(height),
        currentWeight: parseFloat(currentWeight),
        goalWeight: parseFloat(goalWeight),
        gender,
      });
      await setUser(user);
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Signup failed');
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
            <Text style={styles.title}>DesiFit</Text>
            <Text style={styles.subtitle}>Track your fitness journey</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />

            {isSignup && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Height (cm)"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Current Weight (kg)"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  keyboardType="decimal-pad"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Goal Weight (kg)"
                  value={goalWeight}
                  onChangeText={setGoalWeight}
                  keyboardType="decimal-pad"
                />

                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'male' && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender('male')}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'male' && styles.genderTextActive,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === 'female' && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender('female')}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === 'female' && styles.genderTextActive,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={isSignup ? handleSignup : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignup ? 'Sign Up' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSignup(!isSignup)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isSignup
                  ? 'Already have an account? Login'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
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
    marginTop: 40,
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
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
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  genderText: {
    fontSize: 16,
    color: '#6b7280',
  },
  genderTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#10b981',
    fontSize: 16,
  },
});

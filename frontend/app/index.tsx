import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, isLoading, loadProfile } = useAuthStore();

  useEffect(() => {
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // If no user profile exists, show onboarding
  if (!user) {
    return <Redirect href="/onboarding" />;
  }

  // If user profile exists, go to dashboard
  return <Redirect href="/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

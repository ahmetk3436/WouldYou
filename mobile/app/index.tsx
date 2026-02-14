import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const value = await AsyncStorage.getItem('onboarding_complete');
      setOnboardingComplete(value === 'true');
      setOnboardingChecked(true);
    };
    checkOnboarding();
  }, []);

  if (isLoading || !onboardingChecked) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0A0A12' }}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (isAuthenticated || isGuest) {
    return <Redirect href="/(protected)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}

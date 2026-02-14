import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import AppleSignInButton from '../../components/ui/AppleSignInButton';
import { hapticSelection } from '../../lib/haptics';

export default function LoginScreen() {
  const { login, continueAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    hapticSelection();
    await continueAsGuest();
    router.replace('/(protected)/home');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: '#0A0A12' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="px-8">
          {/* Branding */}
          <View className="mb-8 items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl" style={{ backgroundColor: 'rgba(255, 107, 157, 0.15)' }}>
              <Ionicons name="help-circle" size={48} color="#FF6B9D" />
            </View>
            <Text className="text-3xl font-bold text-white">Welcome back</Text>
            <Text className="mt-2 text-base text-gray-400">Sign in to continue playing</Text>
          </View>

          {/* Error */}
          {error ? (
            <View className="mb-4 flex-row items-center rounded-2xl border border-red-800 bg-red-900/30 p-4">
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text className="ml-3 flex-1 text-sm text-red-400">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="mb-4">
            <Input
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              className="bg-gray-900 border-gray-700 text-white"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View className="mb-6">
            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              className="bg-gray-900 border-gray-700 text-white"
              placeholderTextColor="#6b7280"
            />
          </View>

          {/* Sign In Button */}
          <Pressable
            className="w-full items-center rounded-2xl py-4"
            style={{ backgroundColor: '#FF6B9D' }}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-bold text-white">Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-gray-700" />
            <Text className="mx-4 text-sm text-gray-500">or</Text>
            <View className="h-px flex-1 bg-gray-700" />
          </View>

          {/* Apple Sign In */}
          <AppleSignInButton onError={(msg) => setError(msg)} />

          {/* Skip Option */}
          <Pressable
            className="mt-5 items-center py-4"
            onPress={handleGuestMode}
          >
            <Text className="text-base font-semibold" style={{ color: '#FF6B9D' }}>Skip for now</Text>
            <Text className="mt-1 text-xs text-gray-500">Play 3 free rounds without an account</Text>
          </Pressable>

          {/* Footer */}
          <View className="mt-4 mb-8 flex-row items-center justify-center">
            <Text className="text-gray-400">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <Text className="font-semibold" style={{ color: '#FF6B9D' }}>Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

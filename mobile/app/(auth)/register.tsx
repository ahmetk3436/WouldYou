import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="px-8">
          {/* Branding */}
          <View className="mb-8 items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl bg-orange-900/40">
              <Ionicons name="person-add" size={48} color="#ea580c" />
            </View>
            <Text className="text-3xl font-bold text-white">Create account</Text>
            <Text className="mt-2 text-base text-gray-400">Join thousands of players</Text>
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
              label="Email"
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

          <View className="mb-4">
            <Input
              label="Password"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              className="bg-gray-900 border-gray-700 text-white"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View className="mb-6">
            <Input
              label="Confirm Password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              className="bg-gray-900 border-gray-700 text-white"
              placeholderTextColor="#6b7280"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            className="w-full items-center rounded-2xl bg-orange-600 py-4"
            onPress={handleRegister}
            disabled={isLoading}
            style={({ pressed }) => ({ opacity: pressed || isLoading ? 0.8 : 1 })}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-bold text-white">Create Account</Text>
            )}
          </Pressable>

          {/* Footer */}
          <View className="mt-6 mb-8 flex-row items-center justify-center">
            <Text className="text-gray-400">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text className="font-semibold text-orange-500">Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

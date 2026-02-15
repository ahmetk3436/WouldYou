import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppleSignInButton from '../../components/ui/AppleSignInButton';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSuccess, hapticError, hapticSelection } from '../../lib/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { login, continueAsGuest } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (): Promise<void> => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      hapticError();
      return;
    }
    if (!password) {
      setError('Please enter your password');
      hapticError();
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      hapticSuccess();
      router.replace('/(protected)/home');
    } catch (err: any) {
      hapticError();
      setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async (): Promise<void> => {
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
      <View className="flex-1" style={{ backgroundColor: '#0A0A12' }}>
        {/* Gradient Orb */}
        <LinearGradient
          colors={['#FF6B9D', '#C44DFF']}
          style={{
            position: 'absolute',
            top: 0,
            left: '-50%',
            width: '200%',
            height: 300,
            opacity: 0.15,
            borderBottomLeftRadius: 999,
            borderBottomRightRadius: 999,
          }}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: 48 }}>
            <Text className="text-3xl font-bold text-white">Welcome Back</Text>
            <Text className="text-sm mt-2" style={{ color: '#B8B8D0' }}>
              Log in to continue your streak 🔥
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Email Input */}
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: emailFocused ? '#FF6B9D' : 'rgba(255,255,255,0.1)',
              }}
              className="flex-row items-center"
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? '#FF6B9D' : '#6B6B8A'}
                style={{ marginLeft: 16 }}
              />
              <TextInput
                className="flex-1 text-white"
                style={{ paddingVertical: 16, paddingHorizontal: 12 }}
                placeholder="Email address"
                placeholderTextColor="#6B6B8A"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            {/* Password Input */}
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: passwordFocused ? '#FF6B9D' : 'rgba(255,255,255,0.1)',
              }}
              className="flex-row items-center"
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? '#FF6B9D' : '#6B6B8A'}
                style={{ marginLeft: 16 }}
              />
              <TextInput
                className="flex-1 text-white"
                style={{ paddingVertical: 16, paddingHorizontal: 12 }}
                placeholder="Password"
                placeholderTextColor="#6B6B8A"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                textContentType="password"
              />
              <Pressable
                onPress={() => {
                  hapticSelection();
                  setShowPassword(!showPassword);
                }}
                style={{ paddingRight: 16 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B6B8A"
                />
              </Pressable>
            </View>

            {/* Forgot Password */}
            <Pressable style={{ alignSelf: 'flex-end' }}>
              <Text className="text-sm" style={{ color: '#6B6B8A' }}>
                Forgot password?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={{ marginTop: 8, opacity: isLoading ? 0.7 : 1 }}
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16 }}
                className="py-4"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center text-base">
                    Log In
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px" style={{ backgroundColor: '#1A1A2E' }} />
              <Text className="text-sm mx-4" style={{ color: '#6B6B8A' }}>
                or
              </Text>
              <View className="flex-1 h-px" style={{ backgroundColor: '#1A1A2E' }} />
            </View>

            {/* Apple Sign In */}
            <AppleSignInButton onError={(msg: string) => setError(msg)} />

            {/* Skip for now */}
            <Pressable onPress={handleSkip} className="mt-4">
              <Text className="text-center text-sm" style={{ color: '#6B6B8A' }}>
                Skip for now
              </Text>
            </Pressable>

            {/* Sign Up Link */}
            <View className="mt-6 mb-8">
              <Pressable
                className="flex-row justify-center"
                onPress={() => {
                  hapticSelection();
                  router.push('/(auth)/register');
                }}
              >
                <Text style={{ color: '#6B6B8A' }}>Don't have an account? </Text>
                <Text className="font-semibold" style={{ color: '#FF6B9D' }}>
                  Sign up
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={{ marginTop: 16 }}>
              <Text className="text-center text-sm" style={{ color: '#FF5757' }}>
                {error}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Loading Overlay */}
        {isLoading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(10, 10, 18, 0.5)',
            }}
            pointerEvents="none"
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import AppleSignInButton from '../../components/ui/AppleSignInButton';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSuccess, hapticError, hapticSelection } from '../../lib/haptics';

const CONFETTI_COLORS = ['#FF6B9D', '#C44DFF', '#00D4AA', '#FFE66D', '#FF6B9D', '#C44DFF'];

function ConfettiDot({
  color,
  angle,
  distance,
  trigger,
}: {
  color: string;
  angle: number;
  distance: number;
  trigger: boolean;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      const radians = (angle * Math.PI) / 180;
      const targetX = Math.cos(radians) * distance;
      const targetY = Math.sin(radians) * distance;

      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 1400 })
      );
      translateX.value = withSpring(targetX, { damping: 8 });
      translateY.value = withSpring(targetY, { damping: 8 });
      scale.value = withSequence(
        withSpring(1, { damping: 6 }),
        withTiming(0, { duration: 1000 })
      );
      rotation.value = withTiming(720, { duration: 1500 });
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          top: '50%',
          left: '50%',
        },
        animatedStyle,
      ]}
    />
  );
}

function calculatePasswordStrength(pwd: string): 'weak' | 'medium' | 'strong' {
  if (pwd.length < 8) return 'weak';

  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  if (pwd.length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecial) {
    return 'strong';
  } else if (pwd.length >= 8 && hasUpperCase && hasLowerCase) {
    return 'medium';
  }
  return 'weak';
}

function getStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return '#00D4AA';
    case 'medium':
      return '#FFE66D';
    case 'weak':
    default:
      return '#FF5757';
  }
}

function getStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'Strong password';
    case 'medium':
      return 'Medium strength';
    case 'weak':
    default:
      return 'Add 8+ characters with mixed case & numbers';
  }
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [nameFocused, setNameFocused] = useState<boolean>(false);
  const [emailFocused, setEmailFocused] = useState<boolean>(false);
  const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  const confettiConfigs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        angle: 60 * i + Math.random() * 30,
        distance: 80 + Math.random() * 40,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );

  const handleRegister = async (): Promise<void> => {
    setError('');

    if (!name.trim()) {
      setError('Please enter a display name');
      hapticError();
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      hapticError();
      return;
    }
    if (!password) {
      setError('Please enter a password');
      hapticError();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      hapticError();
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), password);
      hapticSuccess();
      setShowConfetti(true);
      setTimeout(() => {
        router.replace('/(protected)/home');
      }, 1500);
    } catch (err: any) {
      hapticError();
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

        {/* Confetti Container */}
        {showConfetti && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
            pointerEvents="none"
          >
            {confettiConfigs.map((config, i) => (
              <ConfettiDot
                key={i}
                color={config.color}
                angle={config.angle}
                distance={config.distance}
                trigger={showConfetti}
              />
            ))}
          </View>
        )}

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: 48 }}>
            <Text className="text-3xl font-bold text-white">Create Account</Text>
            <Text className="text-sm mt-2" style={{ color: '#B8B8D0' }}>
              Join 50K+ players worldwide 🎮
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Name Input */}
            <View
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: nameFocused ? '#FF6B9D' : 'rgba(255,255,255,0.1)',
              }}
              className="flex-row items-center"
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={nameFocused ? '#FF6B9D' : '#6B6B8A'}
                style={{ marginLeft: 16 }}
              />
              <TextInput
                className="flex-1 text-white"
                style={{ paddingVertical: 16, paddingHorizontal: 12 }}
                placeholder="Display name"
                placeholderTextColor="#6B6B8A"
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoCapitalize="words"
                textContentType="name"
              />
            </View>

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
                textContentType="newPassword"
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

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View className="mt-2">
                <View className="flex-row" style={{ gap: 4 }}>
                  <View
                    className="flex-1 rounded-full"
                    style={{
                      height: 4,
                      backgroundColor:
                        passwordStrength === 'weak'
                          ? '#FF5757'
                          : passwordStrength === 'medium'
                          ? '#FFE66D'
                          : '#00D4AA',
                    }}
                  />
                  <View
                    className="flex-1 rounded-full"
                    style={{
                      height: 4,
                      backgroundColor:
                        passwordStrength === 'weak'
                          ? '#1A1A2E'
                          : passwordStrength === 'medium'
                          ? '#FFE66D'
                          : '#00D4AA',
                    }}
                  />
                  <View
                    className="flex-1 rounded-full"
                    style={{
                      height: 4,
                      backgroundColor: passwordStrength === 'strong' ? '#00D4AA' : '#1A1A2E',
                    }}
                  />
                </View>
                <Text
                  className="text-xs mt-1"
                  style={{ color: getStrengthColor(passwordStrength) }}
                >
                  {getStrengthText(passwordStrength)}
                </Text>
              </View>
            )}

            {/* Create Account Button */}
            <Pressable
              onPress={handleRegister}
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
                    Create Account
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

            {/* Log In Link */}
            <View className="mt-6 mb-8">
              <Pressable
                className="flex-row justify-center"
                onPress={() => {
                  hapticSelection();
                  router.push('/(auth)/login');
                }}
              >
                <Text style={{ color: '#6B6B8A' }}>Already have an account? </Text>
                <Text className="font-semibold" style={{ color: '#FF6B9D' }}>
                  Log in
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

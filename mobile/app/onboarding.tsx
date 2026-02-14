import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const step = Math.round(contentOffset / width);
    setCurrentStep(step);
  };

  const scrollToStep = (step: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollRef.current?.scrollTo({
      x: step * width,
      animated: true
    });
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollToStep(1);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollToStep(2);
  };

  const handlePlayAsGuest = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await AsyncStorage.setItem('guest_mode', 'true');
    await AsyncStorage.setItem('guest_uses_remaining', '3');
    router.replace('/(protected)/home');
  };

  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  const DotIndicators = ({ step }: { step: number }) => (
    <View
      className="flex-row justify-center items-center py-4"
      style={{ marginBottom: insets.bottom > 0 ? insets.bottom : 16 }}
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className="w-3 h-3 rounded-full mx-1"
          style={{
            backgroundColor: index === step ? '#FF6B9D' : '#1A1A2E'
          }}
        />
      ))}
    </View>
  );

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      className="flex-1"
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={{ width, flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* STEP 1: Welcome with Gradient Background */}
        <LinearGradient
          colors={['#FF6B9D', '#C44DFF', '#00D4AA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, width }}
        >
          <View className="flex-1 justify-center items-center p-6">
            <View className="w-32 h-32 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="help-circle" size={64} color="white" />
            </View>
            <Text className="text-4xl font-bold text-white mt-6">
              WouldYou
            </Text>
            <Text className="text-base text-white/70 text-center mt-3 px-4">
              The party game that never runs out of questions
            </Text>
            <Pressable onPress={handleGetStarted} className="mt-8">
              <View className="bg-white rounded-full py-4 px-8">
                <Text
                  className="text-lg font-semibold"
                  style={{ color: '#FF6B9D' }}
                >
                  Get Started
                </Text>
              </View>
            </Pressable>
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <DotIndicators step={0} />
          </View>
        </LinearGradient>

        {/* STEP 2: Features with Glassmorphism Cards */}
        <View
          className="flex-1"
          style={{ backgroundColor: '#0A0A12', width }}
        >
          {/* Decorative gradient orb */}
          <View
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 256,
              height: 256,
              opacity: 0.3
            }}
          >
            <LinearGradient
              colors={['#C44DFF', '#FF6B9D']}
              style={{ flex: 1, borderRadius: 128 }}
            />
          </View>

          <View className="flex-1 justify-center p-6">
            <Text className="text-3xl font-bold text-white mb-8">
              Why You'll Love It
            </Text>

            {/* Feature Card 1 */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="bg-white/10 border border-white/20 rounded-2xl p-4 flex-row items-center mb-4"
            >
              <Ionicons
                name="infinite-outline"
                size={24}
                color="#C44DFF"
              />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-semibold text-white">
                  Endless AI Questions
                </Text>
                <Text className="text-sm text-white/60 mt-1">
                  Never play the same question twice
                </Text>
              </View>
            </Animated.View>

            {/* Feature Card 2 */}
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              className="bg-white/10 border border-white/20 rounded-2xl p-4 flex-row items-center mb-4"
            >
              <Ionicons
                name="people-outline"
                size={24}
                color="#C44DFF"
              />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-semibold text-white">
                  Free Friend Lobbies
                </Text>
                <Text className="text-sm text-white/60 mt-1">
                  No subscription, just a room code
                </Text>
              </View>
            </Animated.View>

            {/* Feature Card 3 */}
            <Animated.View
              entering={FadeInDown.delay(600).springify()}
              className="bg-white/10 border border-white/20 rounded-2xl p-4 flex-row items-center mb-4"
            >
              <Ionicons
                name="share-social-outline"
                size={24}
                color="#C44DFF"
              />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-semibold text-white">
                  Share Your Takes
                </Text>
                <Text className="text-sm text-white/60 mt-1">
                  Viral-ready cards for Stories & TikTok
                </Text>
              </View>
            </Animated.View>

            <Pressable onPress={handleContinue} className="mt-6">
              <View
                className="rounded-full py-4 px-8"
                style={{ backgroundColor: '#C44DFF' }}
              >
                <Text className="text-white text-lg font-semibold text-center">
                  Continue
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <DotIndicators step={1} />
          </View>
        </View>

        {/* STEP 3: Ready to Play with CTAs */}
        <View
          className="flex-1"
          style={{ backgroundColor: '#0A0A12', width }}
        >
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-6xl">🎉</Text>
            <Text className="text-3xl font-bold text-white mt-4">
              Ready to Play?
            </Text>
            <Text className="text-sm text-gray-400 mt-2">
              3 free rounds — no account needed
            </Text>

            {/* Play as Guest Button */}
            <Pressable onPress={handlePlayAsGuest} className="mt-8 w-full">
              <View
                className="border-2 rounded-full py-4 px-8"
                style={{ borderColor: '#C44DFF' }}
              >
                <Text
                  className="text-center text-lg"
                  style={{ color: '#C44DFF' }}
                >
                  Play as Guest
                </Text>
              </View>
            </Pressable>

            {/* Create Account Button */}
            <Pressable onPress={handleCreateAccount} className="mt-4 w-full">
              <LinearGradient
                colors={['#FF6B9D', '#C44DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-full py-4 px-8"
              >
                <Text className="text-center text-lg font-semibold text-white">
                  Create Account
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Login Link */}
            <Pressable onPress={handleLogin} className="mt-6">
              <Text className="text-gray-500">
                Already have an account?{' '}
                <Text style={{ color: '#C44DFF' }}>Log in</Text>
              </Text>
            </Pressable>
          </View>

          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <DotIndicators step={2} />
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

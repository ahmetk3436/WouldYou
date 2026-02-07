import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { hapticSelection, hapticSuccess } from '../lib/haptics';

const { width } = Dimensions.get('window');

const pages = [
  {
    icon: 'help-circle' as const,
    iconSize: 100,
    iconColor: '#ea580c',
    title: 'Would You Rather?',
    subtitle: 'The ultimate dilemma game that reveals who you really are',
  },
  {
    icon: 'stats-chart' as const,
    iconSize: 80,
    iconColor: '#ea580c',
    title: 'Discover & Compare',
    subtitle: 'Vote on daily challenges and see how your choices stack up against the world',
    features: [
      { icon: 'calendar-outline' as const, label: 'Daily Challenges', desc: 'New dilemma every day' },
      { icon: 'stats-chart-outline' as const, label: 'See How Others Think', desc: 'Compare your choices with the world' },
      { icon: 'flame-outline' as const, label: 'Build Your Streak', desc: 'Vote daily to climb the leaderboard' },
    ],
  },
  {
    icon: 'rocket-outline' as const,
    iconSize: 80,
    iconColor: '#ea580c',
    title: 'Ready to Choose?',
    subtitle: 'Jump in and start making tough decisions',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    hapticSuccess();
    router.replace('/(auth)/login');
  };

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    if (page !== currentPage) {
      setCurrentPage(page);
      hapticSelection();
    }
  };

  return (
    <View className="flex-1 bg-gray-950">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Page 1: Welcome */}
        <View style={{ width }} className="flex-1 items-center justify-center px-8">
          <View className="mb-6 h-32 w-32 items-center justify-center rounded-3xl bg-orange-900/30">
            <Ionicons name={pages[0].icon} size={pages[0].iconSize} color={pages[0].iconColor} />
          </View>
          <Text className="mt-4 text-center text-4xl font-bold text-white">
            {pages[0].title}
          </Text>
          <Text className="mt-4 text-center text-lg text-gray-400">
            {pages[0].subtitle}
          </Text>
        </View>

        {/* Page 2: Features */}
        <View style={{ width }} className="flex-1 items-center justify-center px-8">
          <Text className="mb-8 text-center text-3xl font-bold text-white">
            {pages[1].title}
          </Text>
          {pages[1].features?.map((feature, index) => (
            <View key={index} className="mb-6 w-full flex-row items-center">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-orange-900/30">
                <Ionicons name={feature.icon} size={28} color="#ea580c" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-semibold text-white">{feature.label}</Text>
                <Text className="mt-0.5 text-sm text-gray-400">{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Page 3: CTA */}
        <View style={{ width }} className="flex-1 items-center justify-center px-8">
          <View className="mb-6 h-28 w-28 items-center justify-center rounded-full bg-orange-900/30">
            <Ionicons name={pages[2].icon} size={pages[2].iconSize} color={pages[2].iconColor} />
          </View>
          <Text className="mt-4 text-center text-3xl font-bold text-white">
            {pages[2].title}
          </Text>
          <Text className="mt-3 text-center text-base text-gray-400">
            {pages[2].subtitle}
          </Text>

          <Pressable
            className="mt-10 w-full items-center rounded-2xl bg-orange-600 py-4"
            onPress={handleComplete}
          >
            <Text className="text-lg font-bold text-white">Start Playing</Text>
          </Pressable>

          <Pressable
            className="mt-4 items-center py-3"
            onPress={handleComplete}
          >
            <Text className="text-base font-semibold text-orange-500">
              I already have an account
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Dot indicators */}
      <View className="flex-row items-center justify-center pb-16">
        {pages.map((_, index) => (
          <View
            key={index}
            className={`mx-1.5 rounded-full ${
              index === currentPage
                ? 'h-3 w-3 bg-orange-600'
                : 'h-2 w-2 bg-gray-600'
            }`}
          />
        ))}
      </View>
    </View>
  );
}

import React, { useEffect } from 'react';
import { View, Text, Pressable, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  SlideInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring
} from 'react-native-reanimated';
import { hapticSuccess, hapticStreakMilestone, hapticShare } from '../../lib/haptics';

interface PersonalityResult {
  name: string;
  emoji: string;
  gradient: readonly [string, string];
  desc: string;
}

const getPersonality = (majorityCount: number, total: number): PersonalityResult => {
  const ratio = majorityCount / total;
  if (ratio > 0.7) {
    return {
      name: 'Crowd Pleaser',
      emoji: '🎉',
      gradient: ['#00D4AA', '#00B894'] as const,
      desc: 'You go with the flow! Most of your choices matched the majority.'
    };
  }
  if (ratio >= 0.4) {
    return {
      name: 'Wild Card',
      emoji: '🃏',
      gradient: ['#FF6B9D', '#C44DFF'] as const,
      desc: 'Unpredictable and unique! You dance to your own rhythm.'
    };
  }
  return {
    name: 'Rebel',
    emoji: '🦄',
    gradient: ['#FFE66D', '#FF9F43'] as const,
    desc: 'You march to your own beat! A true independent thinker.'
  };
};

export default function RoundSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse route params
  const majorityCount = parseInt(params.majorityCount as string, 10) || 0;
  const totalQuestions = parseInt(params.totalQuestions as string, 10) || 10;
  const boldestPercent = parseInt(params.boldestPercent as string, 10) || 0;
  const streakCount = parseInt(params.streakCount as string, 10) || 0;

  // Parse boldest question JSON
  let boldestQuestionText = 'You made bold choices!';
  try {
    const boldestData = JSON.parse(params.boldestQuestion as string);
    boldestQuestionText = boldestData.text || boldestQuestionText;
  } catch {
    // Use default text if parsing fails
  }

  const personality = getPersonality(majorityCount, totalQuestions);

  // Flame pulse animation
  const flameScale = useSharedValue(1);

  useEffect(() => {
    hapticStreakMilestone();
  }, []);

  useEffect(() => {
    if (streakCount > 0) {
      flameScale.value = withRepeat(
        withSequence(
          withSpring(1.3, { damping: 2 }),
          withSpring(1, { damping: 2 })
        ),
        -1,
        true
      );
    }
  }, [streakCount]);

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }]
  }));

  const handleShare = async () => {
    hapticShare();
    const shareMessage = `🎮 Would You Rather - Round Complete!

${personality.emoji} I'm a "${personality.name}"!
${personality.desc}

📊 Agreed with majority: ${majorityCount}/${totalQuestions} times
🔥 Current streak: ${streakCount} days

💭 My boldest take: "${boldestQuestionText}"
Only ${boldestPercent}% agreed with me!

Think you can beat that? Download now!`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'Would You Rather Results'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handlePlayAgain = () => {
    hapticSuccess();
    router.replace('/(protected)/gameplay');
  };

  const handleGoHome = () => {
    hapticSuccess();
    router.replace('/(protected)/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A12]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 px-6 pt-8 pb-6">

          {/* Header */}
          <Animated.View
            entering={SlideInUp.delay(100).springify()}
            className="mb-8"
          >
            <Text className="text-3xl font-bold text-white text-center">
              🎉 Round Complete!
            </Text>
          </Animated.View>

          {/* Stats Card */}
          <Animated.View
            entering={FadeIn.delay(200)}
            className="bg-[#1A1A2E] rounded-3xl p-6 mb-5"
          >
            <Text className="text-gray-400 text-center mb-2">
              You agreed with the majority
            </Text>
            <View className="flex-row items-center justify-center">
              <Text className="text-4xl font-bold text-[#FF6B9D]">
                {majorityCount}
              </Text>
              <Text className="text-2xl text-gray-500 mx-1">/</Text>
              <Text className="text-2xl text-gray-400">
                {totalQuestions}
              </Text>
            </View>
            <Text className="text-gray-400 text-center mt-1">times</Text>
          </Animated.View>

          {/* Personality Badge */}
          <Animated.View
            entering={ZoomIn.delay(400).springify()}
            className="mb-5"
          >
            <LinearGradient
              colors={[...personality.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-6 items-center"
            >
              <Text className="text-5xl mb-2">{personality.emoji}</Text>
              <Text className="text-2xl font-bold text-white mb-1">
                {personality.name}
              </Text>
              <Text className="text-sm text-white/70 text-center">
                {personality.desc}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Streak Section */}
          {streakCount > 0 && (
            <Animated.View
              entering={FadeIn.delay(600)}
              className="bg-[#1A1A2E] rounded-2xl p-5 flex-row items-center justify-center mb-5"
            >
              <Animated.View style={flameAnimatedStyle}>
                <Ionicons name="flame" size={28} color="#FF9F43" />
              </Animated.View>
              <Text className="text-lg font-bold text-[#FF9F43] ml-2">
                +1 Day 🔥
              </Text>
              <Text className="text-base text-white/80 ml-2">
                Current Streak: {streakCount}
              </Text>
            </Animated.View>
          )}

          {/* Boldest Take Card */}
          <Animated.View
            entering={SlideInUp.delay(800).springify()}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-5 mb-6"
          >
            <View className="flex-row items-center mb-3">
              <Ionicons name="sparkles" size={20} color="#FF6B9D" />
              <Text className="text-lg font-semibold text-white ml-2">
                Your Boldest Take
              </Text>
            </View>
            <Text className="text-base text-white/90 leading-6 mb-3">
              {boldestQuestionText}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="people" size={16} color="#FF6B9D" />
              <Text className="text-sm text-[#FF6B9D] font-medium ml-2">
                Only {boldestPercent}% agree with you
              </Text>
            </View>
          </Animated.View>

          {/* Share Button */}
          <Animated.View
            entering={FadeIn.delay(1000)}
            className="mb-4"
          >
            <Pressable
              onPress={handleShare}
              className="active:opacity-80"
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-2xl py-4 flex-row items-center justify-center"
              >
                <Ionicons name="share-outline" size={22} color="white" />
                <Text className="text-lg font-semibold text-white ml-2">
                  Share Your Results
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Bottom Buttons */}
          <Animated.View
            entering={SlideInUp.delay(1200).springify()}
            className="flex-row gap-3"
          >
            <Pressable
              onPress={handlePlayAgain}
              className="flex-1 active:opacity-80"
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-2xl py-4 items-center"
              >
                <Text className="text-base font-semibold text-white">
                  Play Again
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleGoHome}
              className="flex-1 active:opacity-80"
            >
              <View className="border border-gray-700 rounded-2xl py-4 items-center bg-transparent">
                <Text className="text-base font-semibold text-white">
                  Home
                </Text>
              </View>
            </Pressable>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

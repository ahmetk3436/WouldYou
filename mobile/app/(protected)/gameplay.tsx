import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, Dimensions, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { hapticVote, hapticSuccess, hapticError, hapticMedium, hapticLight } from '../../lib/haptics';
import ResultsOverlay, { ChallengeResult as OverlayChallengeResult } from '../../components/ui/ResultsOverlay';

interface Challenge {
  id: string;
  option_a: string;
  option_b: string;
  category: string;
}

interface ChallengeResult {
  option_a_percentage: number;
  option_b_percentage: number;
  total_votes: number;
  user_choice: 'A' | 'B';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;

export default function GameplayScreen() {
  const { category = 'all', mode = 'solo' } = useLocalSearchParams<{ category: string; mode: string }>();

  const [questions, setQuestions] = useState<Challenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayResult, setOverlayResult] = useState<OverlayChallengeResult | null>(null);

  const translateX = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const resultOpacity = useSharedValue(0);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint: string;

      if (mode === 'daily') {
        endpoint = '/challenges/daily';
      } else {
        endpoint = `/challenges/category/${category}?limit=10`;
      }

      const response = await api.get(endpoint);
      const data = response.data.challenges || response.data;
      setQuestions(Array.isArray(data) ? data : [data]);
      setCurrentIndex(0);
      setResult(null);
      setShowResult(false);
    } catch (error) {
      hapticError();
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [category, mode]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const advanceToNext = useCallback(() => {
    resultOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setShowResult)(false);
      runOnJS(setResult)(null);

      if (currentIndex < questions.length - 1) {
        runOnJS(setCurrentIndex)(currentIndex + 1);
        translateX.value = 0;
        runOnJS(setIsAnimating)(false);
      } else {
        runOnJS(router.back)();
      }
    });
  }, [currentIndex, questions.length]);

  const handleVote = useCallback(async (choice: 'A' | 'B') => {
    if (isAnimating || showResult || showOverlay) return;

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    setIsAnimating(true);
    hapticVote();

    try {
      const response = await api.post('/challenges/vote', {
        challenge_id: currentQuestion.id,
        choice: choice,
      });

      // Build overlay result with option text included
      const overlayData: OverlayChallengeResult = {
        option_a: currentQuestion.option_a,
        option_b: currentQuestion.option_b,
        percent_a: response.data.percent_a ?? response.data.option_a_percentage ?? 50,
        percent_b: response.data.percent_b ?? response.data.option_b_percentage ?? 50,
        total_votes: response.data.total_votes ?? 0,
        user_choice: choice,
      };

      setOverlayResult(overlayData);
      setShowOverlay(true);
      hapticSuccess();
    } catch (error) {
      hapticError();
      console.error('Failed to vote:', error);
      setIsAnimating(false);
      translateX.value = withSpring(0);
    }
  }, [questions, currentIndex, isAnimating, showResult, showOverlay]);

  const handleNextQuestion = useCallback(() => {
    setShowOverlay(false);
    setOverlayResult(null);
    translateX.value = 0;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsAnimating(false);
    } else {
      router.back();
    }
  }, [currentIndex, questions.length]);

  const handleShareResult = useCallback(async () => {
    if (!overlayResult) return;

    const userChoice = overlayResult.user_choice === 'A'
      ? overlayResult.option_a
      : overlayResult.option_b;
    const percentage = overlayResult.user_choice === 'A'
      ? Math.round(overlayResult.percent_a)
      : Math.round(overlayResult.percent_b);

    const shareMessage = `\u{1F914} Would You Rather?\n\nI chose "${userChoice}"\n${percentage}% of people agree with me!\n\nPlay now and see what others chose!`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'Would You Rather - My Choice',
      });
      hapticSuccess();
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [overlayResult]);

  const skipQuestion = useCallback(() => {
    if (isAnimating) return;
    hapticLight();
    advanceToNext();
  }, [isAnimating, advanceToNext]);

  const goBack = useCallback(() => {
    hapticMedium();
    router.back();
  }, []);

  const panGesture = Gesture.Pan()
    .enabled(!isAnimating && !showResult && !showOverlay)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD && Math.abs(event.translationX) < SWIPE_THRESHOLD + 10) {
        runOnJS(hapticLight)();
      }
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 });
        runOnJS(handleVote)('A');
      } else if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 });
        runOnJS(handleVote)('B');
      } else {
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, SCREEN_WIDTH],
      [0.5, 0.8, 1, 0.8, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate}deg` },
        { scale: cardScale.value },
      ],
      opacity,
    };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, -SWIPE_THRESHOLD, 0],
      [1, 0.8, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD, SCREEN_WIDTH],
      [0, 0.8, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const resultOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: resultOpacity.value,
    };
  });

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0A0A12' }}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        {/* Back Button */}
        <Pressable
          onPress={goBack}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: '#1A1A2E' }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        {/* Category Badge */}
        <View className="px-4 py-2 rounded-full" style={{ backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Text className="text-sm font-medium text-white capitalize">
            {category}
          </Text>
        </View>

        {/* Question Counter */}
        <View className="px-3 py-2 rounded-full" style={{ backgroundColor: '#1A1A2E' }}>
          <Text className="text-sm font-semibold" style={{ color: '#FF6B9D' }}>
            {currentIndex + 1}/{questions.length || 10}
          </Text>
        </View>
      </View>

      {/* Swipe Instruction */}
      <View className="flex-row justify-center items-center py-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="arrow-back" size={16} color="#FF6B9D" />
          <Text className="text-xs font-medium" style={{ color: '#FF6B9D' }}>Option A</Text>
        </View>
        <Text className="text-xs mx-4" style={{ color: '#6B7280' }}>|</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-medium" style={{ color: '#00D4AA' }}>Option B</Text>
          <Ionicons name="arrow-forward" size={16} color="#00D4AA" />
        </View>
      </View>

      {/* Main Card Area */}
      <View className="flex-1 items-center justify-center">
        {loading ? (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color="#FF6B9D" />
            <Text className="text-base" style={{ color: '#9CA3AF' }}>Loading questions...</Text>
          </View>
        ) : questions.length === 0 ? (
          <View className="items-center gap-4 px-6">
            <Ionicons name="sad-outline" size={48} color="#6B7280" />
            <Text className="text-lg font-semibold text-white">No questions available</Text>
            <Text className="text-center" style={{ color: '#9CA3AF' }}>Check back later for new questions!</Text>
            <Pressable
              onPress={goBack}
              className="mt-4 px-6 py-3 rounded-full"
              style={{ backgroundColor: '#FF6B9D' }}
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
            {/* Left Edge Overlay (Option A) */}
            <Animated.View
              style={[leftOverlayStyle, StyleSheet.absoluteFillObject, { borderRadius: 24, overflow: 'hidden' }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['#FF6B9D', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0.5, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="absolute left-6" style={{ top: '50%', marginTop: -16 }}>
                <Text className="text-white text-2xl font-bold">A</Text>
              </View>
            </Animated.View>

            {/* Right Edge Overlay (Option B) */}
            <Animated.View
              style={[rightOverlayStyle, StyleSheet.absoluteFillObject, { borderRadius: 24, overflow: 'hidden' }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['transparent', '#00D4AA']}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View className="absolute right-6" style={{ top: '50%', marginTop: -16 }}>
                <Text className="text-white text-2xl font-bold">B</Text>
              </View>
            </Animated.View>

            {/* Swipeable Card */}
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[cardAnimatedStyle, { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 24, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }]}
              >
                {/* Card Content */}
                <View className="flex-1 p-6">
                  {/* Header Label */}
                  <Text className="text-sm font-semibold tracking-wider uppercase text-center mb-4" style={{ color: '#FF6B9D' }}>
                    Would You Rather...
                  </Text>

                  {/* Option A */}
                  <View className="flex-1 justify-center">
                    <Text className="text-xl font-bold text-center text-white leading-7">
                      {questions[currentIndex]?.option_a}
                    </Text>
                  </View>

                  {/* OR Divider */}
                  <View className="flex-row items-center justify-center my-4">
                    <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                    <View className="mx-4 w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#FF6B9D' }}>
                      <Text className="text-white text-sm font-bold">OR</Text>
                    </View>
                    <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  </View>

                  {/* Option B */}
                  <View className="flex-1 justify-center">
                    <Text className="text-xl font-bold text-center text-white leading-7">
                      {questions[currentIndex]?.option_b}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </GestureDetector>

          </View>
        )}
      </View>

      {/* Bottom Skip Button */}
      {!loading && questions.length > 0 && !showOverlay && (
        <View className="px-6 pb-6">
          <Pressable
            onPress={skipQuestion}
            disabled={isAnimating}
            className="py-3 items-center"
          >
            <Text className="text-sm font-medium" style={{ color: '#6B7280' }}>Skip this question</Text>
          </Pressable>
        </View>
      )}

      {/* Results Overlay */}
      {showOverlay && overlayResult && (
        <View style={StyleSheet.absoluteFillObject}>
          <ResultsOverlay
            result={overlayResult}
            onNext={handleNextQuestion}
            onShare={handleShareResult}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

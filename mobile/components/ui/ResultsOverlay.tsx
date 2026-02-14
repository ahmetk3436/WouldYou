import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { hapticSuccess, hapticSelection } from '../../lib/haptics';

export interface ChallengeResult {
  option_a: string;
  option_b: string;
  percent_a: number;
  percent_b: number;
  total_votes: number;
  user_choice: 'A' | 'B';
}

interface ResultsOverlayProps {
  result: ChallengeResult;
  onNext: () => void;
  onShare: () => void;
  questionNumber: number;
  totalQuestions: number;
}

const ResultsOverlay: React.FC<ResultsOverlayProps> = ({
  result,
  onNext,
  onShare,
  questionNumber,
  totalQuestions,
}) => {
  // Bar container width for calculating animated bar pixel widths
  const [barContainerWidth, setBarContainerWidth] = useState(0);

  // Animation shared values
  const barAWidth = useSharedValue(0);
  const barBWidth = useSharedValue(0);
  const fadeIn = useSharedValue(0);
  const scaleValue = useSharedValue(0.9);

  // Trigger animations on mount / result change
  useEffect(() => {
    barAWidth.value = 0;
    barBWidth.value = 0;
    fadeIn.value = 0;
    scaleValue.value = 0.9;

    fadeIn.value = withTiming(1, { duration: 300 });
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    barAWidth.value = withDelay(
      200,
      withSpring(result.percent_a, { damping: 15, stiffness: 90 })
    );
    barBWidth.value = withDelay(
      400,
      withSpring(result.percent_b, { damping: 15, stiffness: 90 })
    );

    hapticSuccess();
  }, [result]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: scaleValue.value }],
  }));

  const barAStyle = useAnimatedStyle(() => {
    const widthPx = interpolate(barAWidth.value, [0, 100], [0, barContainerWidth]);
    return { width: widthPx };
  });

  const barBStyle = useAnimatedStyle(() => {
    const widthPx = interpolate(barBWidth.value, [0, 100], [0, barContainerWidth]);
    return { width: widthPx };
  });

  const percentAOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(barAWidth.value, [0, 30], [0, 1]),
  }));

  const percentBOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(barBWidth.value, [0, 30], [0, 1]),
  }));

  // Helper functions
  const getMajorityInfo = () => {
    const userPickedMajority =
      (result.user_choice === 'A' && result.percent_a > 50) ||
      (result.user_choice === 'B' && result.percent_b > 50);

    if (userPickedMajority) {
      return {
        isMajority: true,
        message: "You're with the majority!",
        bgColor: 'bg-green-500/20',
        textColor: 'text-green-400',
        icon: 'trending-up-outline' as const,
      };
    } else {
      const minorityPercent =
        result.user_choice === 'A' ? result.percent_a : result.percent_b;
      return {
        isMajority: false,
        message: `Bold choice! Only ${minorityPercent}% agree`,
        bgColor: 'bg-[#FF6B9D]/20',
        textColor: 'text-[#FF6B9D]',
        icon: 'flash-outline' as const,
      };
    }
  };

  const handleNextPress = () => {
    hapticSelection();
    onNext();
  };

  const handleSharePress = () => {
    hapticSelection();
    onShare();
  };

  const onBarLayout = (e: LayoutChangeEvent) => {
    setBarContainerWidth(e.nativeEvent.layout.width);
  };

  const majorityInfo = getMajorityInfo();
  const isLastQuestion = questionNumber === totalQuestions;
  const userChoiceText =
    result.user_choice === 'A' ? result.option_a : result.option_b;
  const userChoiceColor =
    result.user_choice === 'A' ? 'text-[#FF6B9D]' : 'text-[#00D4AA]';

  return (
    <Pressable
      className="flex-1 justify-center items-center"
      style={{ backgroundColor: 'rgba(10,10,18,0.95)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      onPress={handleNextPress}
    >
      <Animated.View
        style={containerStyle}
        className="w-[90%] max-w-[380px]"
      >
        <View className="rounded-3xl p-6" style={{ backgroundColor: '#1A1A2E', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 }}>
          {/* Header */}
          <View className="items-center mb-4">
            <Text className="text-xs uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
              Question {questionNumber} of {totalQuestions}
            </Text>
            <Text className="text-sm" style={{ color: '#9CA3AF' }}>You chose...</Text>
          </View>

          {/* User Choice Display */}
          <View className="items-center mb-6">
            <Text className={`text-lg font-bold ${userChoiceColor}`}>
              "{userChoiceText}"
            </Text>
          </View>

          {/* Option A Bar */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm flex-1" style={{ color: '#D1D5DB' }} numberOfLines={1}>
                {result.option_a}
              </Text>
            </View>
            <View
              className="h-10 rounded-xl overflow-hidden relative"
              style={{ backgroundColor: 'rgba(31,41,55,0.5)' }}
              onLayout={onBarLayout}
            >
              <Animated.View style={barAStyle} className="h-full rounded-xl overflow-hidden">
                <LinearGradient
                  colors={['#FF6B9D', '#C44DFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
              <Animated.Text
                style={[percentAOpacity, { position: 'absolute', right: 12, top: 0, bottom: 0, textAlignVertical: 'center', lineHeight: 40 }]}
                className="text-white font-bold text-sm"
              >
                {Math.round(result.percent_a)}%
              </Animated.Text>
            </View>
          </View>

          {/* Option B Bar */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm flex-1" style={{ color: '#D1D5DB' }} numberOfLines={1}>
                {result.option_b}
              </Text>
            </View>
            <View
              className="h-10 rounded-xl overflow-hidden relative"
              style={{ backgroundColor: 'rgba(31,41,55,0.5)' }}
            >
              <Animated.View style={barBStyle} className="h-full rounded-xl overflow-hidden">
                <LinearGradient
                  colors={['#00D4AA', '#00B894']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
              <Animated.Text
                style={[percentBOpacity, { position: 'absolute', right: 12, top: 0, bottom: 0, textAlignVertical: 'center', lineHeight: 40 }]}
                className="text-white font-bold text-sm"
              >
                {Math.round(result.percent_b)}%
              </Animated.Text>
            </View>
          </View>

          {/* Stats Section */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="people-outline" size={16} color="#9CA3AF" />
              <Text className="text-sm" style={{ color: '#9CA3AF' }}>
                {result.total_votes.toLocaleString()} total votes
              </Text>
            </View>
          </View>

          {/* Majority Badge */}
          <View
            className={`${majorityInfo.bgColor} rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 mt-4`}
          >
            <Ionicons
              name={majorityInfo.icon}
              size={18}
              color={majorityInfo.isMajority ? '#4ADE80' : '#FF6B9D'}
            />
            <Text className={`${majorityInfo.textColor} font-medium text-sm`}>
              {majorityInfo.message}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={handleSharePress}
              className="flex-1 overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4"
              >
                <Text className="text-white font-semibold text-center">
                  Share This
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleNextPress}
              className="flex-1 rounded-2xl py-4"
              style={{ borderWidth: 1, borderColor: '#374151' }}
            >
              <Text className="font-medium text-center" style={{ color: '#D1D5DB' }}>
                {isLastQuestion ? 'See Results' : 'Next Question'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default ResultsOverlay;

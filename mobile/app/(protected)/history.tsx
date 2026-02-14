import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Share, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import api from '../../lib/api';
import { hapticSuccess, hapticSelection, hapticError } from '../../lib/haptics';
import { formatRelativeTime } from '../../lib/dateUtils';
import type { ChallengeResult } from '../../types/challenge';

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    life: '#FF6B9D',
    deep: '#C44DFF',
    superpower: '#FFE66D',
    funny: '#00D4AA',
    love: '#FF6B9D',
    tech: '#0EA5E9',
  };
  return colors[category] || '#FF6B9D';
};

const getTrendInfo = (userChoice: string, percentA: number, percentB: number): { icon: string; color: string; isMajority: boolean } => {
  const userPercent = userChoice === 'A' ? percentA : percentB;
  const isMajority = userPercent > 50;
  return {
    icon: isMajority ? 'trending-up' : 'trending-down',
    color: isMajority ? '#00D4AA' : '#FF6B9D',
    isMajority,
  };
};

const SkeletonCard = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/10">
      <View className="flex-row justify-between mb-3">
        <Animated.View className="h-6 w-16 rounded-full bg-[#2A2A4A]" style={animatedStyle} />
        <Animated.View className="h-6 w-20 rounded-full bg-[#2A2A4A]" style={animatedStyle} />
      </View>
      <Animated.View className="h-5 w-full rounded-lg bg-[#2A2A4A] mb-4" style={animatedStyle} />
      <Animated.View className="h-4 w-3/4 rounded-lg bg-[#2A2A4A] mb-2" style={animatedStyle} />
      <Animated.View className="h-2 w-full rounded-full bg-[#2A2A4A] mb-3" style={animatedStyle} />
      <Animated.View className="h-4 w-2/3 rounded-lg bg-[#2A2A4A] mb-2" style={animatedStyle} />
      <Animated.View className="h-2 w-full rounded-full bg-[#2A2A4A]" style={animatedStyle} />
    </View>
  );
};

const LoadingState = () => (
  <View className="flex-1">
    <SkeletonCard />
    <View className="h-2" />
    <SkeletonCard />
    <View className="h-2" />
    <SkeletonCard />
  </View>
);

export default function HistoryScreen() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<ChallengeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/challenges/history');
      setHistoryItems(res.data.data || []);
    } catch (error) {
      hapticError();
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    hapticSelection();
    await fetchHistory();
    setRefreshing(false);
  }, []);

  const handleShareItem = async (item: ChallengeResult) => {
    hapticSelection();
    const userPercent = item.user_choice === 'A' ? item.percent_a : item.percent_b;
    const chosenOption = item.user_choice === 'A' ? item.challenge.option_a : item.challenge.option_b;
    const shareMessage = `🤔 Would You Rather?\n\n${item.challenge.option_a} or ${item.challenge.option_b}?\n\nI chose "${chosenOption}" (${userPercent}% agreed!)\n\nPlay now and see what others think!`;

    try {
      await Share.share({ message: shareMessage });
      hapticSuccess();
    } catch (error) {
      hapticError();
    }
  };

  const renderHistoryItem = ({ item }: { item: ChallengeResult }) => {
    const trendInfo = getTrendInfo(item.user_choice, item.percent_a, item.percent_b);
    const categoryColor = getCategoryColor(item.challenge.category || 'life');
    const relativeTime = formatRelativeTime(item.challenge.daily_date);

    return (
      <Pressable
        className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/10 active:opacity-80"
        onPress={() => hapticSelection()}
      >
        {/* Header Row: Category + Trend */}
        <View className="flex-row justify-between items-start mb-3">
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: categoryColor + '30' }}
          >
            <Text className="text-xs font-medium capitalize" style={{ color: categoryColor }}>
              {item.challenge.category || 'life'}
            </Text>
          </View>

          <View
            className="flex-row items-center px-2 py-1 rounded-full"
            style={{ backgroundColor: trendInfo.color + '20' }}
          >
            <Ionicons
              name={trendInfo.icon as any}
              size={14}
              color={trendInfo.color}
            />
            <Text className="text-xs ml-1" style={{ color: trendInfo.color }}>
              {trendInfo.isMajority ? 'Majority' : 'Minority'}
            </Text>
          </View>
        </View>

        {/* Question */}
        <Text className="text-white font-semibold text-base mb-4">
          {item.challenge.option_a} or {item.challenge.option_b}?
        </Text>

        {/* Option A */}
        <View className="flex-row items-center mb-1">
          {item.user_choice === 'A' ? (
            <Ionicons name="checkmark-circle" size={18} color="#FF6B9D" style={{ marginRight: 6 }} />
          ) : (
            <View style={{ width: 24 }} />
          )}
          <Text className="text-gray-300 text-sm flex-1" numberOfLines={1}>
            {item.challenge.option_a}
          </Text>
          <Text className="text-white font-semibold text-sm">
            {item.percent_a}%
          </Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden bg-white/10 mb-3">
          <LinearGradient
            colors={['#FF6B9D', '#C44DFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${item.percent_a}%`, height: '100%', borderRadius: 4 }}
          />
        </View>

        {/* Option B */}
        <View className="flex-row items-center mb-1">
          {item.user_choice === 'B' ? (
            <Ionicons name="checkmark-circle" size={18} color="#00D4AA" style={{ marginRight: 6 }} />
          ) : (
            <View style={{ width: 24 }} />
          )}
          <Text className="text-gray-300 text-sm flex-1" numberOfLines={1}>
            {item.challenge.option_b}
          </Text>
          <Text className="text-white font-semibold text-sm">
            {item.percent_b}%
          </Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden bg-white/10">
          <LinearGradient
            colors={['#00D4AA', '#00B894']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${item.percent_b}%`, height: '100%', borderRadius: 4 }}
          />
        </View>

        {/* Footer: Time + Share */}
        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-gray-500 text-xs">
            {relativeTime}
          </Text>
          <TouchableOpacity onPress={() => handleShareItem(item)}>
            <Ionicons name="share-outline" size={20} color="#FF6B9D" />
          </TouchableOpacity>
        </View>
      </Pressable>
    );
  };

  const ItemSeparator = () => <View className="h-2" />;

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-24 h-24 rounded-full bg-[#1A1A2E] items-center justify-center mb-6">
        <Ionicons name="time-outline" size={48} color="#FF6B9D" />
      </View>
      <Text className="text-xl font-bold text-white mb-2">
        No history yet
      </Text>
      <Text className="text-sm text-gray-500 text-center px-8 mb-8">
        Start voting to see your choices here
      </Text>
      <TouchableOpacity
        onPress={() => {
          hapticSelection();
          router.push('/(protected)/home');
        }}
      >
        <LinearGradient
          colors={['#FF6B9D', '#C44DFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-8 py-4 rounded-2xl"
        >
          <Text className="text-white font-semibold text-base">
            Play Now
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D1A]">
      {/* Header */}
      <LinearGradient
        colors={['#FF6B9D', '#C44DFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View className="flex-row items-center justify-between px-6 py-5">
          <Text className="text-2xl font-bold text-white">History</Text>
          <View className="bg-white/20 rounded-full px-3 py-1">
            <Text className="text-sm text-white font-medium">{historyItems.length} votes</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <FlatList
        data={historyItems}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.challenge.id}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={isLoading ? LoadingState : EmptyState}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B9D"
            colors={['#FF6B9D']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

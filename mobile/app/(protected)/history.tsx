import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Share, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../lib/api';
import { hapticSelection, hapticSuccess } from '../../lib/haptics';
import type { ChallengeResult } from '../../types/challenge';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ChallengeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/challenges/history');
      setHistory(res.data.data || []);
    } catch (err) {
      setError('Could not load your history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleShareChallenge = async (item: ChallengeResult) => {
    hapticSelection();
    const myChoice = item.user_choice === 'A' ? item.challenge.option_a : item.challenge.option_b;
    const myPercent = item.user_choice === 'A' ? item.percent_a : item.percent_b;
    try {
      await Share.share({
        message: `Would You Rather...\n\nA: ${item.challenge.option_a}\nB: ${item.challenge.option_b}\n\nI chose "${myChoice}"! (${myPercent}% agree with me)\n\nPlay now: https://wouldyou.app`,
      });
      hapticSuccess();
    } catch {
      // User cancelled share
    }
  };

  const renderItem = ({ item }: { item: ChallengeResult }) => {
    const yourPercent = item.user_choice === 'A' ? item.percent_a : item.percent_b;
    const isPopular = yourPercent > 50;

    return (
      <View className="mx-4 mb-4 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        {/* Top bar */}
        <View className="flex-row items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-3">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text className="ml-1 text-xs text-gray-500">
              {new Date(item.challenge.daily_date).toLocaleDateString()}
            </Text>
          </View>
          {item.challenge.category && (
            <View className="rounded-full bg-orange-900/40 px-3 py-1">
              <Text className="text-xs font-semibold uppercase text-orange-400">{item.challenge.category}</Text>
            </View>
          )}
        </View>

        {/* Options section */}
        <View className="p-4">
          {/* Option A */}
          <View className="mb-3 flex-row items-center">
            <View className={`mr-3 h-3 w-3 rounded-full ${item.user_choice === 'A' ? 'bg-blue-500' : 'bg-gray-700'}`} />
            <Text className={`flex-1 ${item.user_choice === 'A' ? 'font-semibold text-white' : 'text-gray-400'}`}>
              {item.challenge.option_a}
            </Text>
            <Text className="ml-2 font-bold text-blue-400">{item.percent_a}%</Text>
          </View>
          <View className="mb-3 ml-6 h-1.5 overflow-hidden rounded-full bg-gray-800">
            <View className="h-full rounded-full bg-blue-500" style={{ width: `${item.percent_a}%` }} />
          </View>

          {/* Option B */}
          <View className="mb-1 flex-row items-center">
            <View className={`mr-3 h-3 w-3 rounded-full ${item.user_choice === 'B' ? 'bg-red-500' : 'bg-gray-700'}`} />
            <Text className={`flex-1 ${item.user_choice === 'B' ? 'font-semibold text-white' : 'text-gray-400'}`}>
              {item.challenge.option_b}
            </Text>
            <Text className="ml-2 font-bold text-red-400">{item.percent_b}%</Text>
          </View>
          <View className="ml-6 h-1.5 overflow-hidden rounded-full bg-gray-800">
            <View className="h-full rounded-full bg-red-500" style={{ width: `${item.percent_b}%` }} />
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-gray-800 px-4 py-3">
          <View className="flex-row items-center">
            <Ionicons
              name={isPopular ? 'trending-up' : 'trending-down'}
              size={16}
              color={isPopular ? '#22c55e' : '#ef4444'}
            />
            <Text className={`ml-1 text-xs ${isPopular ? 'text-green-500' : 'text-red-400'}`}>
              {isPopular ? 'Popular choice' : 'Unique opinion'}
            </Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Pressable onPress={() => handleShareChallenge(item)} hitSlop={8}>
              <Ionicons name="share-outline" size={18} color="#6b7280" />
            </Pressable>
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#6b7280" />
              <Text className="ml-1 text-xs text-gray-500">{item.total_votes.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="mt-4 text-base text-gray-500">Loading your history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-950">
        <View className="bg-orange-600 px-6 pb-6 pt-16">
          <Text className="text-3xl font-bold text-white">Your Choices</Text>
          <Text className="mt-1 text-base text-orange-200">See how your opinions compare</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={64} color="#4b5563" />
          <Text className="mt-4 text-center text-lg font-semibold text-gray-300">{error}</Text>
          <Pressable
            className="mt-6 rounded-2xl bg-orange-600 px-8 py-3"
            onPress={() => { setLoading(true); fetchHistory(); }}
          >
            <Text className="font-bold text-white">Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="bg-orange-600 px-6 pb-6 pt-16">
        <Text className="text-3xl font-bold text-white">Your Choices</Text>
        <Text className="mt-1 text-base text-orange-200">See how your opinions compare</Text>
      </View>

      {history.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="time-outline" size={80} color="#9a3412" />
          <Text className="mt-6 text-xl font-bold text-gray-200">No choices yet</Text>
          <Text className="mt-2 text-center text-base text-gray-500">
            Vote on today's challenge to start building your history!
          </Text>
          <Pressable
            className="mt-6 rounded-2xl bg-orange-600 px-8 py-3"
            onPress={() => router.push('/(protected)/home' as any)}
          >
            <Text className="font-bold text-white">Play Now</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.challenge.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
          }
        />
      )}
    </View>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import type { ChallengeResult } from '../../types/challenge';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ChallengeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/challenges/history');
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
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

  const renderItem = ({ item }: { item: ChallengeResult }) => {
    const yourChoice = item.user_choice === 'A' ? item.challenge.option_a : item.challenge.option_b;
    const yourPercent = item.user_choice === 'A' ? item.percent_a : item.percent_b;
    const isPopular = yourPercent > 50;

    return (
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text className="ml-1 text-xs text-gray-400">
              {new Date(item.challenge.daily_date).toLocaleDateString()}
            </Text>
          </View>
          {item.challenge.category && (
            <View className="rounded-full bg-orange-100 px-2 py-1">
              <Text className="text-xs font-medium text-orange-600">{item.challenge.category}</Text>
            </View>
          )}
        </View>

        <View className="mb-3">
          <View className="mb-2 flex-row items-center">
            <View className={`mr-2 h-2 w-2 rounded-full ${item.user_choice === 'A' ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <Text className={`flex-1 text-sm ${item.user_choice === 'A' ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {item.challenge.option_a}
            </Text>
            <Text className="text-sm font-medium text-blue-600">{item.percent_a}%</Text>
          </View>
          <View className="flex-row items-center">
            <View className={`mr-2 h-2 w-2 rounded-full ${item.user_choice === 'B' ? 'bg-red-500' : 'bg-gray-300'}`} />
            <Text className={`flex-1 text-sm ${item.user_choice === 'B' ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {item.challenge.option_b}
            </Text>
            <Text className="text-sm font-medium text-red-600">{item.percent_b}%</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
          <View className="flex-row items-center">
            <Ionicons
              name={isPopular ? "trending-up" : "trending-down"}
              size={16}
              color={isPopular ? "#22c55e" : "#ef4444"}
            />
            <Text className={`ml-1 text-xs ${isPopular ? 'text-green-600' : 'text-red-500'}`}>
              {isPopular ? 'Popular choice' : 'Unique opinion'}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{item.total_votes.toLocaleString()} votes</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-orange-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-orange-50">
      <View className="flex-1 px-6 pt-8">
        <Text className="mb-2 text-3xl font-bold text-orange-900">Your Choices</Text>
        <Text className="mb-6 text-base text-gray-500">See how your opinions compare</Text>

        {history.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="help-circle-outline" size={64} color="#fed7aa" />
            <Text className="mt-4 text-lg font-semibold text-gray-700">No choices yet</Text>
            <Text className="mt-2 text-center text-sm text-gray-500">
              Play today's challenge to start building your history
            </Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.challenge.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

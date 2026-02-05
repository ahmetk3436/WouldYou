import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Share, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { hapticSuccess, hapticSelection, hapticError } from '../../lib/haptics';
import type { Challenge, ChallengeResult, ChallengeStats } from '../../types/challenge';

export default function HomeScreen() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDaily = useCallback(async () => {
    try {
      const [challengeRes, statsRes] = await Promise.all([
        api.get('/challenges/daily'),
        api.get('/challenges/stats'),
      ]);
      setChallenge(challengeRes.data.challenge);
      setResult(challengeRes.data.user_voted ? challengeRes.data : null);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch daily challenge:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  const handleVote = async (choice: 'A' | 'B') => {
    if (!challenge || voting || result) return;
    hapticSelection();
    setVoting(true);
    try {
      const res = await api.post('/challenges/vote', {
        challenge_id: challenge.id,
        choice,
      });
      setResult(res.data);
      hapticSuccess();
    } catch (err) {
      hapticError();
      console.error('Vote failed:', err);
    } finally {
      setVoting(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    hapticSelection();
    const myChoice = result.user_choice === 'A' ? result.challenge.option_a : result.challenge.option_b;
    const myPercent = result.user_choice === 'A' ? result.percent_a : result.percent_b;
    try {
      await Share.share({
        message: `Would You Rather?\n\n${result.challenge.option_a} vs ${result.challenge.option_b}\n\nI chose: "${myChoice}" (${myPercent}% agree)\n\nPlay now: wouldyou.app`,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDaily();
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
      >
        <View className="flex-1 px-6 pt-8">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-orange-900">Would You</Text>
              <Text className="text-3xl font-bold text-orange-600">Rather?</Text>
            </View>
            {stats && (
              <View className="items-center rounded-2xl bg-orange-100 px-4 py-2">
                <Text className="text-2xl font-bold text-orange-600">{stats.current_streak}</Text>
                <Text className="text-xs text-orange-500">day streak</Text>
              </View>
            )}
          </View>

          {/* Daily Challenge */}
          <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
            <View className="mb-3 flex-row items-center">
              <Ionicons name="today-outline" size={20} color="#ea580c" />
              <Text className="ml-2 text-sm font-medium text-orange-600">Daily Challenge</Text>
              {challenge?.category && (
                <View className="ml-auto rounded-full bg-orange-100 px-3 py-1">
                  <Text className="text-xs font-medium text-orange-700">{challenge.category}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Options */}
          {challenge && !result && (
            <View className="flex-1 justify-center">
              <TouchableOpacity
                className="mb-4 rounded-2xl bg-blue-500 p-6 shadow-lg"
                onPress={() => handleVote('A')}
                disabled={voting}
                activeOpacity={0.8}
              >
                <Text className="text-center text-xl font-bold text-white">{challenge.option_a}</Text>
              </TouchableOpacity>

              <View className="my-2 items-center">
                <View className="rounded-full bg-orange-200 px-4 py-2">
                  <Text className="text-sm font-bold text-orange-700">OR</Text>
                </View>
              </View>

              <TouchableOpacity
                className="mt-4 rounded-2xl bg-red-500 p-6 shadow-lg"
                onPress={() => handleVote('B')}
                disabled={voting}
                activeOpacity={0.8}
              >
                <Text className="text-center text-xl font-bold text-white">{challenge.option_b}</Text>
              </TouchableOpacity>

              {voting && (
                <View className="mt-6 items-center">
                  <ActivityIndicator size="small" color="#ea580c" />
                </View>
              )}
            </View>
          )}

          {/* Results */}
          {result && (
            <View className="flex-1 justify-center">
              <View className={`mb-4 rounded-2xl p-6 ${result.user_choice === 'A' ? 'bg-blue-500' : 'bg-blue-100'}`}>
                <Text className={`text-center text-xl font-bold ${result.user_choice === 'A' ? 'text-white' : 'text-blue-800'}`}>
                  {result.challenge.option_a}
                </Text>
                <View className="mt-3 flex-row items-center justify-center">
                  <View className="mr-2 h-3 flex-1 overflow-hidden rounded-full bg-white/30">
                    <View className="h-full rounded-full bg-white" style={{ width: `${result.percent_a}%` }} />
                  </View>
                  <Text className={`text-lg font-bold ${result.user_choice === 'A' ? 'text-white' : 'text-blue-600'}`}>
                    {result.percent_a}%
                  </Text>
                </View>
                {result.user_choice === 'A' && (
                  <View className="mt-2 flex-row items-center justify-center">
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text className="ml-1 text-sm font-medium text-white">Your choice</Text>
                  </View>
                )}
              </View>

              <View className={`mb-4 rounded-2xl p-6 ${result.user_choice === 'B' ? 'bg-red-500' : 'bg-red-100'}`}>
                <Text className={`text-center text-xl font-bold ${result.user_choice === 'B' ? 'text-white' : 'text-red-800'}`}>
                  {result.challenge.option_b}
                </Text>
                <View className="mt-3 flex-row items-center justify-center">
                  <View className="mr-2 h-3 flex-1 overflow-hidden rounded-full bg-white/30">
                    <View className="h-full rounded-full bg-white" style={{ width: `${result.percent_b}%` }} />
                  </View>
                  <Text className={`text-lg font-bold ${result.user_choice === 'B' ? 'text-white' : 'text-red-600'}`}>
                    {result.percent_b}%
                  </Text>
                </View>
                {result.user_choice === 'B' && (
                  <View className="mt-2 flex-row items-center justify-center">
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text className="ml-1 text-sm font-medium text-white">Your choice</Text>
                  </View>
                )}
              </View>

              <View className="items-center">
                <Text className="text-sm text-gray-500">{result.total_votes.toLocaleString()} total votes</Text>
              </View>

              <TouchableOpacity
                className="mt-6 flex-row items-center justify-center rounded-2xl bg-orange-500 py-4"
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <Text className="ml-2 text-lg font-bold text-white">Share Result</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats Footer */}
          {stats && (
            <View className="mt-6 flex-row justify-around rounded-2xl bg-white p-4 shadow-sm">
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-600">{stats.total_votes}</Text>
                <Text className="text-xs text-gray-500">Total Votes</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-600">{stats.current_streak}</Text>
                <Text className="text-xs text-gray-500">Current Streak</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-orange-600">{stats.longest_streak}</Text>
                <Text className="text-xs text-gray-500">Best Streak</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

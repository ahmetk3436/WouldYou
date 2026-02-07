import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Share,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { hapticSuccess, hapticSelection, hapticError } from '../../lib/haptics';
import type { Challenge, ChallengeResult, ChallengeStats } from '../../types/challenge';

interface StreakMilestone {
  name: string;
  icon: string;
  color: string;
  threshold: number;
  nextThreshold: number;
}

function getStreakMilestone(streak: number): StreakMilestone {
  const milestones = [
    { name: 'Crown', icon: 'trophy', color: '#F59E0B', threshold: 50, nextThreshold: 100 },
    { name: 'Fire', icon: 'flame', color: '#EF4444', threshold: 30, nextThreshold: 50 },
    { name: 'Diamond', icon: 'diamond', color: '#60A5FA', threshold: 21, nextThreshold: 30 },
    { name: 'Gold', icon: 'medal', color: '#FFD700', threshold: 14, nextThreshold: 21 },
    { name: 'Silver', icon: 'medal', color: '#C0C0C0', threshold: 7, nextThreshold: 14 },
    { name: 'Bronze', icon: 'medal', color: '#CD7F32', threshold: 3, nextThreshold: 7 },
  ];

  for (const m of milestones) {
    if (streak >= m.threshold) return m;
  }

  return { name: 'Starter', icon: 'flame-outline', color: '#9CA3AF', threshold: 0, nextThreshold: 3 };
}

export default function HomeScreen() {
  const { user, isGuest, guestUsageCount, canUseFeature, incrementGuestUsage } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const fetchDaily = useCallback(async () => {
    try {
      setError('');
      const requests: Promise<any>[] = [api.get('/challenges/daily')];
      if (!isGuest) {
        requests.push(api.get('/challenges/stats'));
      }

      const results = await Promise.all(requests);
      const challengeRes = results[0];

      setChallenge(challengeRes.data.challenge);
      if (challengeRes.data.user_voted) {
        setResult(challengeRes.data);
      } else {
        setResult(null);
      }

      if (!isGuest && results[1]) {
        setStats(results[1].data);
      }
    } catch (err) {
      setError('Could not load the challenge. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuest]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  useEffect(() => {
    if (result) {
      setShowSharePrompt(false);
      const timer = setTimeout(() => setShowSharePrompt(true), 2000);
      return () => clearTimeout(timer);
    }
    setShowSharePrompt(false);
  }, [result]);

  const handleVote = async (choice: 'A' | 'B') => {
    if (!challenge || voting || result) return;

    if (isGuest && !canUseFeature()) {
      Alert.alert(
        'Free Plays Used',
        'You have used all 3 free plays. Create an account to continue playing!',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/(auth)/register') },
        ]
      );
      return;
    }

    hapticSelection();
    setVoting(true);
    try {
      await api.post('/challenges/vote', {
        challenge_id: challenge.id,
        choice,
      });
      if (isGuest) {
        await incrementGuestUsage();
      }
      // Re-fetch to get updated percentages
      const res = await api.get('/challenges/daily');
      setChallenge(res.data.challenge);
      setResult(res.data);
      if (!isGuest) {
        const statsRes = await api.get('/challenges/stats');
        setStats(statsRes.data);
      }
      hapticSuccess();
    } catch (err) {
      hapticError();
    } finally {
      setVoting(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    hapticSelection();
    const myChoice = result.user_choice === 'A' ? result.challenge.option_a : result.challenge.option_b;
    const myPercent = result.user_choice === 'A' ? result.percent_a : result.percent_b;
    const streakText = stats && stats.current_streak > 0 ? `\nStreak: ${stats.current_streak} days` : '';
    try {
      await Share.share({
        message: `Would You Rather...\n\nA: ${result.challenge.option_a}\nB: ${result.challenge.option_b}\n\nI chose "${myChoice}"! (${myPercent}% agree with me)${streakText}\n\nPlay now: https://wouldyou.app`,
      });
      hapticSuccess();
    } catch (err) {
      // User cancelled share
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDaily();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="mt-4 text-base text-gray-500">Loading today's challenge...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950 px-8">
        <Ionicons name="cloud-offline-outline" size={64} color="#4b5563" />
        <Text className="mt-4 text-center text-lg font-semibold text-gray-300">{error}</Text>
        <Pressable
          className="mt-6 rounded-2xl bg-orange-600 px-8 py-3"
          onPress={() => { setLoading(true); fetchDaily(); }}
        >
          <Text className="font-bold text-white">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const streakInfo = stats ? getStreakMilestone(stats.current_streak) : null;

  return (
    <View className="flex-1 bg-gray-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
      >
        {/* Header */}
        <View className="bg-orange-600 px-6 pb-8 pt-16" style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
          <Text className="text-center text-3xl font-bold text-white">Would You Rather?</Text>
          <View className="mt-3 flex-row items-center justify-center gap-4">
            {stats && stats.current_streak > 0 && (
              <View className="flex-row items-center gap-2 rounded-full bg-white/20 px-4 py-2">
                <Ionicons name="flame" size={18} color="white" />
                <Text className="text-sm font-semibold text-white">{stats.current_streak} day streak</Text>
              </View>
            )}
            {stats && (
              <View className="flex-row items-center gap-2 rounded-full bg-white/20 px-4 py-2">
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text className="text-sm font-semibold text-white">{stats.total_votes} votes</Text>
              </View>
            )}
            {isGuest && (
              <View className="flex-row items-center gap-2 rounded-full bg-white/20 px-4 py-2">
                <Ionicons name="gift-outline" size={18} color="white" />
                <Text className="text-sm font-semibold text-white">{3 - guestUsageCount} free left</Text>
              </View>
            )}
          </View>
        </View>

        {/* Streak Warning */}
        {stats && stats.current_streak > 0 && !result && (
          <View className="mx-6 mt-4 flex-row items-center rounded-xl border border-yellow-700 bg-yellow-900/30 p-3">
            <Ionicons name="warning-outline" size={20} color="#ca8a04" />
            <Text className="ml-2 flex-1 text-sm text-yellow-500">
              Don't lose your {stats.current_streak}-day streak! Vote now!
            </Text>
          </View>
        )}

        {/* Streak Milestone */}
        {stats && stats.current_streak > 0 && streakInfo && (
          <View className="mx-6 mt-4 rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name={streakInfo.icon as any} size={28} color={streakInfo.color} />
                <View className="ml-3">
                  <Text className="text-2xl font-bold text-white">{stats.current_streak}</Text>
                  <Text className="text-xs text-gray-500">day streak</Text>
                </View>
              </View>
              <View className="items-end">
                <Ionicons name={streakInfo.icon as any} size={20} color={streakInfo.color} />
                <Text className="text-xs font-semibold" style={{ color: streakInfo.color }}>{streakInfo.name}</Text>
              </View>
            </View>
            {streakInfo.nextThreshold > stats.current_streak && (
              <View className="mt-3">
                <Text className="mb-1 text-xs text-gray-500">
                  Next: {getStreakMilestone(streakInfo.nextThreshold).name} in {streakInfo.nextThreshold - stats.current_streak} days
                </Text>
                <View className="h-2 overflow-hidden rounded-full bg-gray-800">
                  <View
                    className="h-full rounded-full bg-orange-500"
                    style={{
                      width: `${Math.min(100, ((stats.current_streak - streakInfo.threshold) / (streakInfo.nextThreshold - streakInfo.threshold)) * 100)}%`,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Challenge Card - Before Voting */}
        {challenge && !result && (
          <View className="mx-6 mt-6 rounded-3xl border border-gray-800 bg-gray-900 p-6">
            {/* Category */}
            {challenge.category && (
              <View className="mb-6 self-start rounded-full bg-orange-900/40 px-4 py-1.5">
                <Text className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  {challenge.category}
                </Text>
              </View>
            )}

            {/* Option A */}
            <Pressable
              className="w-full rounded-2xl bg-blue-600 py-5"
              onPress={() => handleVote('A')}
              disabled={voting}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            >
              <View className="flex-row items-center justify-center px-4">
                <Ionicons name="hand-left-outline" size={20} color="white" />
                <Text className="ml-2 text-center text-lg font-bold text-white">{challenge.option_a}</Text>
              </View>
            </Pressable>

            {/* VS Divider */}
            <View className="my-4 flex-row items-center">
              <View className="h-px flex-1 bg-gray-700" />
              <View className="mx-3 h-10 w-10 items-center justify-center rounded-full bg-orange-900/40">
                <Text className="text-xs font-bold text-orange-400">VS</Text>
              </View>
              <View className="h-px flex-1 bg-gray-700" />
            </View>

            {/* Option B */}
            <Pressable
              className="w-full rounded-2xl bg-red-600 py-5"
              onPress={() => handleVote('B')}
              disabled={voting}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            >
              <View className="flex-row items-center justify-center px-4">
                <Ionicons name="hand-right-outline" size={20} color="white" />
                <Text className="ml-2 text-center text-lg font-bold text-white">{challenge.option_b}</Text>
              </View>
            </Pressable>

            {voting && (
              <View className="mt-6 items-center">
                <ActivityIndicator size="small" color="#ea580c" />
              </View>
            )}
          </View>
        )}

        {/* Results Section */}
        {result && (
          <View className="mx-6 mt-6 rounded-3xl border border-gray-800 bg-gray-900 p-6">
            <Text className="mb-6 text-center text-xl font-bold text-white">Results are in!</Text>

            {/* Option A Result */}
            <View className="relative mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base text-gray-200">{result.challenge.option_a}</Text>
                <Text className="ml-2 text-lg font-bold text-blue-400">{result.percent_a}%</Text>
              </View>
              <View className="mt-2 h-3 overflow-hidden rounded-full bg-gray-800">
                <View
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${result.percent_a}%` }}
                />
              </View>
              {result.user_choice === 'A' && (
                <View className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              )}
            </View>

            {/* Option B Result */}
            <View className="relative mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-base text-gray-200">{result.challenge.option_b}</Text>
                <Text className="ml-2 text-lg font-bold text-red-400">{result.percent_b}%</Text>
              </View>
              <View className="mt-2 h-3 overflow-hidden rounded-full bg-gray-800">
                <View
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${result.percent_b}%` }}
                />
              </View>
              {result.user_choice === 'B' && (
                <View className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-500">
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              )}
            </View>

            {/* Total votes */}
            <View className="mt-4 flex-row items-center justify-center border-t border-gray-800 pt-4">
              <Ionicons name="people-outline" size={18} color="#9ca3af" />
              <Text className="ml-2 text-sm text-gray-400">{result.total_votes.toLocaleString()} people voted</Text>
            </View>

            {/* Share Button */}
            <Pressable
              className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4"
              onPress={handleShare}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Ionicons name="share-outline" size={20} color="white" />
              <Text className="text-base font-bold text-white">Share Your Choice</Text>
            </Pressable>
          </View>
        )}

        {/* Share Prompt */}
        {showSharePrompt && result && (
          <View className="mx-6 mt-4 flex-row items-center rounded-2xl border border-orange-800 bg-orange-900/30 p-4">
            <Ionicons name="share-social" size={24} color="#ea580c" />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-orange-200">Share your choice!</Text>
              <Text className="mt-0.5 text-xs text-orange-400">Let your friends know where you stand</Text>
            </View>
            <Pressable className="rounded-xl bg-orange-600 px-4 py-2" onPress={handleShare}>
              <Text className="text-sm font-semibold text-white">Share</Text>
            </Pressable>
          </View>
        )}

        {/* Stats Footer */}
        {stats && (
          <View className="mx-6 mt-6 flex-row justify-around rounded-2xl bg-gray-900 p-4">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-orange-400">{stats.total_votes}</Text>
              <Text className="mt-1 text-xs text-gray-500">Total Votes</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-orange-400">{stats.current_streak}</Text>
              <Text className="mt-1 text-xs text-gray-500">Current Streak</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-orange-400">{stats.longest_streak}</Text>
              <Text className="mt-1 text-xs text-gray-500">Best Streak</Text>
            </View>
          </View>
        )}

        {/* Explore More */}
        <Pressable
          className="mx-6 mt-6 flex-row items-center justify-center gap-2 rounded-2xl border-2 border-orange-800 py-4"
          onPress={() => router.push('/(protected)/explore' as any)}
        >
          <Ionicons name="compass-outline" size={22} color="#ea580c" />
          <Text className="text-base font-semibold text-orange-500">Explore More Challenges</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

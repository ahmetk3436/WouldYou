import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import {
  hapticSuccess,
  hapticSelection,
  hapticError,
  hapticVote,
  hapticShare,
  hapticMedium,
} from '../../lib/haptics';
import type { Challenge, ChallengeResult, ChallengeStats } from '../../types/challenge';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'deep', label: 'Deep', emoji: '🧠' },
  { id: 'superpowers', label: 'Superpowers', emoji: '⚡' },
  { id: 'love', label: 'Love', emoji: '❤️' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
];

export default function HomeScreen() {
  const { user, isGuest, guestUsageCount, canUseFeature, incrementGuestUsage } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const handleVote = async (choice: 'A' | 'B') => {
    if (!challenge || voting || result) return;

    if (isGuest && !canUseFeature()) {
      hapticSelection();
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

    hapticVote();
    setVoting(true);
    try {
      await api.post('/challenges/vote', {
        challenge_id: challenge.id,
        choice,
      });
      if (isGuest) {
        await incrementGuestUsage();
      }
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
    hapticShare();
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
    hapticSelection();
    setRefreshing(true);
    fetchDaily();
  };

  const handleQuickPlay = useCallback(() => {
    hapticMedium();
    router.push('/gameplay?category=all&mode=solo');
  }, []);

  const handleCategoryPress = (categoryId: string) => {
    hapticSelection();
    setSelectedCategory(categoryId);
    router.push(`/gameplay?category=${categoryId}&mode=solo`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: '#0D0D1A' }}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text className="text-gray-400 mt-4">Loading today's challenge...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-8" style={{ backgroundColor: '#0D0D1A' }}>
        <Ionicons name="cloud-offline-outline" size={64} color="#4b5563" />
        <Text className="mt-4 text-center text-lg font-semibold text-gray-300">{error}</Text>
        <Pressable
          className="mt-6 rounded-2xl px-8 py-3"
          style={{ backgroundColor: '#FF6B9D' }}
          onPress={() => { setLoading(true); fetchDaily(); }}
        >
          <Text className="font-bold text-white">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0D0D1A' }} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#FF6B9D', '#C44DFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          paddingHorizontal: 24,
          paddingVertical: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View className="flex-row items-center">
          {/* Streak Badge */}
          <View className="bg-[#1A1A2E] rounded-full px-3 py-1.5 flex-row items-center">
            <Ionicons name="flame" size={18} color="#FF9F43" />
            <Text className="text-white font-bold ml-1">
              {stats ? stats.current_streak : 0}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold ml-3">Would You Rather</Text>
        </View>

        {/* Settings Button */}
        <Pressable onPress={() => { hapticSelection(); router.push('/settings'); }}>
          <Ionicons name="settings-outline" size={24} color="white" />
        </Pressable>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B9D" />}
      >
        {/* Daily Challenge Card */}
        {challenge && !result && (
          <View className="mt-6 px-6">
            <View className="rounded-3xl overflow-hidden">
              {/* Gradient Border */}
              <LinearGradient
                colors={['#FF6B9D', '#C44DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 1, borderRadius: 24 }}
              >
                {/* Inner Card */}
                <View className="bg-[#1A1A2E] rounded-3xl p-6">
                  {/* Badge */}
                  <View className="self-start mb-4">
                    <LinearGradient
                      colors={['#FF6B9D', '#C44DFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}
                    >
                      <Text className="text-xs font-bold text-white">DAILY CHALLENGE</Text>
                    </LinearGradient>
                  </View>

                  {/* Category */}
                  {challenge.category && (
                    <Text className="text-gray-400 text-sm mb-1">{challenge.category}</Text>
                  )}

                  {/* Question */}
                  <Text className="text-white text-xl font-bold mb-6">Would you rather...</Text>

                  {/* Voting Options */}
                  <View style={{ gap: 12 }}>
                    <Pressable
                      onPress={() => handleVote('A')}
                      disabled={voting}
                      className="rounded-2xl py-5"
                      style={{ backgroundColor: '#FF6B9D' }}
                    >
                      <Text className="text-white text-center font-semibold text-base px-4">
                        {challenge.option_a}
                      </Text>
                    </Pressable>

                    {/* VS Circle */}
                    <View className="items-center" style={{ marginTop: -30, marginBottom: -30, zIndex: 10 }}>
                      <LinearGradient
                        colors={['#FF6B9D', '#C44DFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text className="text-white font-bold text-sm">VS</Text>
                      </LinearGradient>
                    </View>

                    <Pressable
                      onPress={() => handleVote('B')}
                      disabled={voting}
                      className="rounded-2xl py-5"
                      style={{ backgroundColor: '#00D4AA' }}
                    >
                      <Text className="text-white text-center font-semibold text-base px-4">
                        {challenge.option_b}
                      </Text>
                    </Pressable>
                  </View>

                  {voting && (
                    <View className="mt-4 items-center">
                      <ActivityIndicator size="small" color="#FF6B9D" />
                    </View>
                  )}

                  {/* Vote Count */}
                  <Text className="text-gray-500 text-sm text-center mt-4">
                    {(challenge.votes_a + challenge.votes_b).toLocaleString()} total votes
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Results Section */}
        {result && (
          <View className="mt-6 px-6">
            <View className="rounded-3xl overflow-hidden">
              <LinearGradient
                colors={['#FF6B9D', '#C44DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 1, borderRadius: 24 }}
              >
                <View className="bg-[#1A1A2E] rounded-3xl p-6">
                  {/* Badge */}
                  <View className="self-start mb-4">
                    <LinearGradient
                      colors={['#FF6B9D', '#C44DFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}
                    >
                      <Text className="text-xs font-bold text-white">DAILY CHALLENGE</Text>
                    </LinearGradient>
                  </View>

                  <Text className="text-white text-xl font-bold mb-6">Results are in!</Text>

                  {/* Option A Result */}
                  <View className="mb-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-white text-sm flex-1" numberOfLines={1}>
                        {result.challenge.option_a}
                      </Text>
                      <Text className="text-white font-bold ml-2">{result.percent_a}%</Text>
                    </View>
                    <View className="bg-[#2A2A3E] rounded-full h-3 overflow-hidden">
                      <LinearGradient
                        colors={['#FF6B9D', '#C44DFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: `${result.percent_a}%`, height: '100%', borderRadius: 999 }}
                      />
                    </View>
                    {result.user_choice === 'A' && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="checkmark-circle" size={16} color="#FF6B9D" />
                        <Text className="text-gray-400 text-sm ml-1">Your vote</Text>
                      </View>
                    )}
                  </View>

                  {/* Option B Result */}
                  <View className="mb-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-white text-sm flex-1" numberOfLines={1}>
                        {result.challenge.option_b}
                      </Text>
                      <Text className="text-white font-bold ml-2">{result.percent_b}%</Text>
                    </View>
                    <View className="bg-[#2A2A3E] rounded-full h-3 overflow-hidden">
                      <LinearGradient
                        colors={['#00D4AA', '#00B894']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: `${result.percent_b}%`, height: '100%', borderRadius: 999 }}
                      />
                    </View>
                    {result.user_choice === 'B' && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="checkmark-circle" size={16} color="#00D4AA" />
                        <Text className="text-gray-400 text-sm ml-1">Your vote</Text>
                      </View>
                    )}
                  </View>

                  {/* Total votes */}
                  <View className="mt-2 flex-row items-center justify-center border-t border-gray-800 pt-4">
                    <Ionicons name="people-outline" size={18} color="#9ca3af" />
                    <Text className="ml-2 text-sm text-gray-400">{result.total_votes.toLocaleString()} people voted</Text>
                  </View>

                  {/* Share Button */}
                  <Pressable
                    onPress={handleShare}
                    className="bg-[#2A2A3E] rounded-xl py-3 flex-row items-center justify-center mt-4"
                  >
                    <Ionicons name="share-outline" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">Share Result</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Quick Play Section */}
        <View className="mt-8 px-6">
          <Pressable onPress={handleQuickPlay} className="rounded-2xl overflow-hidden">
            <LinearGradient
              colors={['#FF6B9D', '#C44DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="play-outline" size={24} color="white" />
              <Text className="text-white text-lg font-bold ml-2">Quick Play</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Category Chips */}
        <View className="mt-6 px-6">
          <Text className="text-white text-lg font-bold mb-3">Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                className="rounded-full overflow-hidden"
              >
                {selectedCategory === category.id ? (
                  <LinearGradient
                    colors={['#FF6B9D', '#C44DFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}
                  >
                    <Text className="text-white font-semibold text-sm">
                      {category.label} {category.emoji}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    className="px-4 py-2"
                    style={{ backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }}
                  >
                    <Text className="text-white font-semibold text-sm">
                      {category.label} {category.emoji}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Stats Section */}
        {stats && (
          <View className="mt-8 px-6">
            <Text className="text-white text-lg font-bold mb-4">Your Stats</Text>
            <View className="flex-row justify-between bg-[#1A1A2E] rounded-2xl p-6">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>{stats.total_votes}</Text>
                <Text className="text-gray-400 text-sm mt-1">Total Votes</Text>
              </View>
              <View className="items-center flex-1" style={{ borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>{stats.current_streak}</Text>
                <Text className="text-gray-400 text-sm mt-1">Streak</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>{stats.longest_streak}</Text>
                <Text className="text-gray-400 text-sm mt-1">Best Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Guest Stats Placeholder */}
        {isGuest && (
          <View className="mt-8 px-6">
            <Text className="text-white text-lg font-bold mb-4">Your Stats</Text>
            <View className="flex-row justify-between bg-[#1A1A2E] rounded-2xl p-6">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>{guestUsageCount}</Text>
                <Text className="text-gray-400 text-sm mt-1">Played</Text>
              </View>
              <View className="items-center flex-1" style={{ borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>{3 - guestUsageCount}</Text>
                <Text className="text-gray-400 text-sm mt-1">Free Left</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>0</Text>
                <Text className="text-gray-400 text-sm mt-1">Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Explore Button */}
        <View className="mt-6 px-6">
          <Pressable
            onPress={() => { hapticSelection(); router.push('/(protected)/explore' as any); }}
            className="rounded-2xl py-4"
            style={{ borderWidth: 2, borderColor: '#C44DFF' }}
          >
            <Text className="text-center font-semibold" style={{ color: '#C44DFF' }}>
              Explore More Challenges
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

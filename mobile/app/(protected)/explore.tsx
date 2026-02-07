import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import type { ChallengeResult } from '../../types/challenge';

const categories = [
  { id: 'life', label: 'Life', icon: 'heart-outline' as const, bgActive: 'bg-red-600', bgInactive: 'bg-gray-800' },
  { id: 'deep', label: 'Deep', icon: 'moon-outline' as const, bgActive: 'bg-purple-600', bgInactive: 'bg-gray-800' },
  { id: 'superpower', label: 'Superpowers', icon: 'flash-outline' as const, bgActive: 'bg-yellow-600', bgInactive: 'bg-gray-800' },
  { id: 'funny', label: 'Funny', icon: 'happy-outline' as const, bgActive: 'bg-green-600', bgInactive: 'bg-gray-800' },
  { id: 'love', label: 'Love', icon: 'heart-half-outline' as const, bgActive: 'bg-pink-600', bgInactive: 'bg-gray-800' },
  { id: 'tech', label: 'Tech', icon: 'laptop-outline' as const, bgActive: 'bg-blue-600', bgInactive: 'bg-gray-800' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<ChallengeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const loadCategory = useCallback(async (category: string) => {
    hapticSelection();
    setSelectedCategory(category);
    setLoading(true);
    try {
      const res = await api.get(`/challenges/category/${category}`);
      setChallenges(res.data.data || []);
    } catch (err) {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVote = async (challengeId: string, choice: 'A' | 'B') => {
    hapticSelection();
    setVotingId(challengeId);
    try {
      await api.post('/challenges/vote', {
        challenge_id: challengeId,
        choice,
      });
      hapticSuccess();
      // Refresh the category
      if (selectedCategory) {
        const res = await api.get(`/challenges/category/${selectedCategory}`);
        setChallenges(res.data.data || []);
      }
    } catch (err) {
      hapticError();
    } finally {
      setVotingId(null);
    }
  };

  const renderChallenge = ({ item }: { item: ChallengeResult }) => {
    const hasVoted = item.user_choice !== '';
    const isVoting = votingId === item.challenge.id;

    return (
      <View className="mx-4 mb-4 rounded-2xl border border-gray-800 bg-gray-900 p-5">
        {/* Category badge */}
        {item.challenge.category && (
          <View className="mb-4 self-start rounded-full bg-orange-900/40 px-3 py-1">
            <Text className="text-xs font-semibold uppercase text-orange-400">{item.challenge.category}</Text>
          </View>
        )}

        {hasVoted ? (
          // Results view
          <View>
            <View className="mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-gray-200">{item.challenge.option_a}</Text>
                <Text className="ml-2 font-bold text-blue-400">{item.percent_a}%</Text>
              </View>
              <View className="mt-1 h-2 overflow-hidden rounded-full bg-gray-800">
                <View className="h-full rounded-full bg-blue-500" style={{ width: `${item.percent_a}%` }} />
              </View>
            </View>
            <View>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-gray-200">{item.challenge.option_b}</Text>
                <Text className="ml-2 font-bold text-red-400">{item.percent_b}%</Text>
              </View>
              <View className="mt-1 h-2 overflow-hidden rounded-full bg-gray-800">
                <View className="h-full rounded-full bg-red-500" style={{ width: `${item.percent_b}%` }} />
              </View>
            </View>
            <Text className="mt-3 text-center text-xs text-gray-500">{item.total_votes} votes</Text>
          </View>
        ) : (
          // Voting view
          <View>
            <Pressable
              className="mb-3 w-full rounded-xl bg-blue-600 py-3"
              onPress={() => handleVote(item.challenge.id, 'A')}
              disabled={isVoting}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-center text-sm font-bold text-white">{item.challenge.option_a}</Text>
            </Pressable>
            <View className="my-1 items-center">
              <Text className="text-xs font-bold text-gray-600">OR</Text>
            </View>
            <Pressable
              className="mt-2 w-full rounded-xl bg-red-600 py-3"
              onPress={() => handleVote(item.challenge.id, 'B')}
              disabled={isVoting}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-center text-sm font-bold text-white">{item.challenge.option_b}</Text>
            </Pressable>
            {isVoting && (
              <View className="mt-3 items-center">
                <ActivityIndicator size="small" color="#ea580c" />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="bg-orange-600 px-6 pb-6 pt-16">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="ml-3 text-3xl font-bold text-white">Explore</Text>
        </View>
      </View>

      {/* Category selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4 max-h-12 px-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              className={`mr-2 flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                isSelected ? 'bg-orange-600' : 'border border-gray-700 bg-gray-800'
              }`}
              onPress={() => loadCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={isSelected ? 'white' : '#9ca3af'}
              />
              <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {!selectedCategory && (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="compass-outline" size={64} color="#9a3412" />
          <Text className="mt-4 text-center text-lg font-semibold text-gray-300">
            Choose a category to explore
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            Browse challenges by topic and test your preferences
          </Text>
        </View>
      )}

      {selectedCategory && loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      )}

      {selectedCategory && !loading && challenges.length === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="search-outline" size={64} color="#4b5563" />
          <Text className="mt-4 text-center text-lg font-semibold text-gray-300">
            No challenges in this category yet
          </Text>
        </View>
      )}

      {selectedCategory && !loading && challenges.length > 0 && (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.challenge.id}
          renderItem={renderChallenge}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

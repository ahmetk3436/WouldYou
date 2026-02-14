import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import type { ChallengeResult } from '../../types/challenge';

const categories = [
  { id: 'life', label: 'Life', icon: 'heart-outline' as const },
  { id: 'deep', label: 'Deep', icon: 'moon-outline' as const },
  { id: 'superpower', label: 'Superpowers', icon: 'flash-outline' as const },
  { id: 'funny', label: 'Funny', icon: 'happy-outline' as const },
  { id: 'love', label: 'Love', icon: 'heart-half-outline' as const },
  { id: 'tech', label: 'Tech', icon: 'laptop-outline' as const },
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
      <View className="mx-4 mb-4 rounded-2xl p-5" style={{ backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2a2a3e' }}>
        {/* Category badge */}
        {item.challenge.category && (
          <View className="mb-4 self-start rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(255, 107, 157, 0.15)' }}>
            <Text className="text-xs font-semibold uppercase" style={{ color: '#FF6B9D' }}>{item.challenge.category}</Text>
          </View>
        )}

        {hasVoted ? (
          // Results view
          <View>
            <View className="mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-gray-200">{item.challenge.option_a}</Text>
                <Text className="ml-2 font-bold" style={{ color: '#FF6B9D' }}>{item.percent_a}%</Text>
              </View>
              <View className="mt-1 h-2 overflow-hidden rounded-full bg-gray-800">
                <View className="h-full rounded-full" style={{ backgroundColor: '#FF6B9D', width: `${item.percent_a}%` }} />
              </View>
            </View>
            <View>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-gray-200">{item.challenge.option_b}</Text>
                <Text className="ml-2 font-bold" style={{ color: '#00D4AA' }}>{item.percent_b}%</Text>
              </View>
              <View className="mt-1 h-2 overflow-hidden rounded-full bg-gray-800">
                <View className="h-full rounded-full" style={{ backgroundColor: '#00D4AA', width: `${item.percent_b}%` }} />
              </View>
            </View>
            <Text className="mt-3 text-center text-xs text-gray-500">{item.total_votes} votes</Text>
          </View>
        ) : (
          // Voting view
          <View>
            <Pressable
              className="mb-3 w-full rounded-xl py-3"
              style={{ backgroundColor: '#FF6B9D' }}
              onPress={() => handleVote(item.challenge.id, 'A')}
              disabled={isVoting}
            >
              <Text className="text-center text-sm font-bold text-white">{item.challenge.option_a}</Text>
            </Pressable>
            <View className="my-1 items-center">
              <Text className="text-xs font-bold text-gray-600">OR</Text>
            </View>
            <Pressable
              className="mt-2 w-full rounded-xl py-3"
              style={{ backgroundColor: '#00D4AA' }}
              onPress={() => handleVote(item.challenge.id, 'B')}
              disabled={isVoting}
            >
              <Text className="text-center text-sm font-bold text-white">{item.challenge.option_b}</Text>
            </Pressable>
            {isVoting && (
              <View className="mt-3 items-center">
                <ActivityIndicator size="small" color="#FF6B9D" />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0A0A12' }} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#FF6B9D', '#C44DFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl px-6 py-4"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-white">Explore</Text>
            <Text className="mt-1 text-sm text-white/80">Discover trending questions</Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Ionicons name="compass" size={24} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

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
              className="mr-2 flex-row items-center gap-1.5 rounded-full px-4 py-2"
              style={isSelected ? { backgroundColor: '#FF6B9D' } : { backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2a2a3e' }}
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
          <Ionicons name="compass-outline" size={64} color="#FF6B9D" />
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
          <ActivityIndicator size="large" color="#FF6B9D" />
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
    </SafeAreaView>
  );
}

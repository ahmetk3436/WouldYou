import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  locked?: boolean;
  badge?: string;
  colors?: readonly [string, string, ...string[]];
}

/**
 * FeatureCard - Modular Bento Box Component (2025-2026 Trend)
 * Bento Box Grids: modular layouts for feature displays
 * Use for paywall features, onboarding, and feature highlights
 */
export default function FeatureCard({
  icon,
  title,
  description,
  locked = false,
  badge,
  colors = ['#6366F1', '#8B5CF6'],
}: FeatureCardProps) {
  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <LinearGradient
        colors={locked ? ['#374151', '#1F2937'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 20,
          borderRadius: 16,
        }}
      >
        {/* Badge */}
        {badge && (
          <View className="mb-2 self-start rounded-full bg-orange-500 px-3 py-1">
            <Text className="text-xs font-bold text-white uppercase tracking-wider">{badge}</Text>
          </View>
        )}

        {/* Icon */}
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-xl bg-white/20">
          <Ionicons
            name={icon}
            size={24}
            color={locked ? '#9CA3AF' : 'white'}
          />
        </View>

        {/* Content */}
        <Text className="mb-1 text-lg font-bold text-white">{title}</Text>
        <Text className="text-sm text-white/80">{description}</Text>

        {/* Lock indicator */}
        {locked && (
          <View className="absolute right-4 top-4">
            <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

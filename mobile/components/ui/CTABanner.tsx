import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CTABannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  colors?: readonly [string, string, ...string[]];
}

/**
 * CTABanner - Call-to-Action Banner (2025-2026 Trend)
 * High-conversion banners with gradient backgrounds
 * Used for contextual paywalls, upgrade prompts, and feature announcements
 */
export default function CTABanner({
  title,
  subtitle,
  buttonText = 'Upgrade',
  onPress,
  icon = 'diamond',
  colors = ['#6366F1', '#EC4899'],
}: CTABannerProps) {
  return (
    <View className="mx-4 overflow-hidden rounded-2xl">
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 20,
          borderRadius: 16,
        }}
      >
        {/* Decorative element */}
        <View
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        />

        <View className="flex-row items-center">
          {/* Icon */}
          <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <Ionicons name={icon} size={28} color="white" />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">{title}</Text>
            {subtitle && (
              <Text className="mt-1 text-sm text-white/80">{subtitle}</Text>
            )}
          </View>

          {/* CTA Button */}
          <Pressable
            onPress={onPress}
            className="rounded-xl bg-white px-4 py-2.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Text className="text-sm font-semibold text-indigo-600">{buttonText}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

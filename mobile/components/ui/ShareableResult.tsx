import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ShareableResultProps {
  title: string;
  subtitle?: string;
  resultText: string;
  appName?: string;
  colors?: readonly [string, string, ...string[]];
  username?: string;
}

/**
 * ShareableResult - Viral Card Component (2025-2026 Trend)
 * Instagram Stories format (9:16 aspect ratio compatible)
 * Features: bold gradients, large typography, holographic effects
 * Use ViewShot to capture and share results
 */
export default function ShareableResult({
  title,
  subtitle,
  resultText,
  appName = 'WouldYou',
  colors = ['#6366F1', '#EC4899', '#A855F7'],
  username,
}: ShareableResultProps) {
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 9 / 16,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 32,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Decorative holographic circles */}
        <View
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: 'rgba(255,255,255,0.05)',
            transform: [{ translateX: -75 }, { translateY: -75 }],
          }}
        />

        {/* App Logo Watermark */}
        <View style={{ position: 'absolute', top: 24, left: 24 }}>
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={{ marginLeft: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
              {appName}
            </Text>
          </View>
        </View>

        {/* Result Icon */}
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-white/20">
          <Ionicons name="help-circle" size={40} color="#ffffff" />
        </View>

        {/* Title */}
        <Text className="mb-2 text-center text-xl font-semibold text-white/80 uppercase tracking-wider">
          {title}
        </Text>

        {subtitle ? (
          <Text className="mb-8 text-center text-sm text-white/60">
            {subtitle}
          </Text>
        ) : null}

        {/* Result Text */}
        <View className="w-full rounded-2xl bg-white/15 px-6 py-6">
          <Text className="text-center text-2xl font-bold leading-8 text-white">
            {resultText}
          </Text>
        </View>

        {/* User Info */}
        {username && (
          <View className="mt-8 flex-row items-center">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Text className="text-sm font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="ml-2 text-sm text-white/70">@{username}</Text>
          </View>
        )}

        {/* Date Stamp */}
        <Text style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          {dateStr}
        </Text>

        {/* CTA Footer */}
        <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
          <Text className="text-center text-sm text-white/60">
            Download {appName} - Play Now
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

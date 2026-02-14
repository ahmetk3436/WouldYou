import React from 'react';
import { View, Text, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/cn';

interface UsageBadgeProps {
  used: number;
  total: number;
  isPremium?: boolean;
  className?: string;
  style?: ViewStyle;
}

export default function UsageBadge({
  used,
  total,
  isPremium = false,
  className = '',
  style,
}: UsageBadgeProps) {
  const remaining = total - used;
  const progress = used / total;
  const isExhausted = remaining <= 0;

  if (isPremium) {
    return (
      <View
        style={[styles.container, style]}
        className={cn('flex-row items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-white/20', className)}
      >
        <Ionicons name="infinite" size={16} color="#00D4AA" />
        <Text className="text-sm font-semibold text-white">
          Unlimited
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      className={cn('flex-row items-center gap-3', className)}
    >
      <LinearGradient
        colors={['#FF6B9D', '#C44DFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-full px-4 py-2 flex-row items-center gap-2"
      >
        <Ionicons
          name={isExhausted ? 'warning' : 'flash'}
          size={14}
          color="#FFFFFF"
        />
        <Text className="text-sm font-semibold text-white">
          {isExhausted ? 'Limit reached' : `${remaining} free uses left`}
        </Text>
      </LinearGradient>

      {/* Progress bar */}
      <View className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <View
          style={[
            styles.progressBar,
            { width: `${progress * 100}%`, backgroundColor: '#FF6B9D' }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
});

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UsageBadgeProps {
  used: number;
  total: number;
  type?: 'daily' | 'weekly' | 'monthly';
}

/**
 * UsageBadge - Gamified Usage Indicator (2025-2026 Trend)
 * Shows remaining uses with visual progress
 * Creates scarcity/urgency for free tier users
 */
export default function UsageBadge({ used, total, type = 'daily' }: UsageBadgeProps) {
  const remaining = total - used;
  const percentage = (remaining / total) * 100;

  const getColor = () => {
    if (percentage > 50) return '#10B981'; // Green
    if (percentage > 25) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const icon = {
    daily: 'today',
    weekly: 'calendar',
    monthly: 'calendar-clear',
  }[type];

  return (
    <View className="flex-row items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5">
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={getColor()} />
      <Text className="text-sm font-semibold" style={{ color: getColor() }}>
        {remaining} left
      </Text>
      <View className="ml-1 h-2 w-12 overflow-hidden rounded-full bg-gray-700">
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </View>
    </View>
  );
}

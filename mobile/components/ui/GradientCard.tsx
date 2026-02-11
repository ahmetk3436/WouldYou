import React from 'react';
import { View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientCardProps extends ViewProps {
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children: React.ReactNode;
}

/**
 * GradientCard - 2025-2026 Trend Component
 * Rich gradients are dominant in modern mobile UI (purple-to-pink, blue-to-teal, orange-to-red)
 * Use for elevated surfaces, CTAs, and highlight cards
 */
export default function GradientCard({
  colors = ['#6366F1', '#EC4899'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  children,
  style,
  ...props
}: GradientCardProps) {
  return (
    <View
      style={[
        {
          borderRadius: 20,
          shadowColor: colors[0],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={{
          borderRadius: 20,
          padding: 24,
          overflow: 'hidden',
        }}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

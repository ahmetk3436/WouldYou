import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { cn } from '../../lib/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  noPadding?: boolean;
  intensity?: number;
}

export default function GlassCard({
  children,
  className = '',
  style,
  noPadding = false,
  intensity = 20,
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.glassContainer,
        noPadding ? styles.noPadding : styles.withPadding,
        style,
      ]}
      className={cn('rounded-3xl overflow-hidden', className)}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={styles.blurView}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
  },
  withPadding: {
    padding: 24,
  },
  noPadding: {
    padding: 0,
  },
});

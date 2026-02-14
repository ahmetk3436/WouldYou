import React from 'react';
import { View, Text, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/cn';

interface GradientCardProps {
  children: React.ReactNode;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function GradientCard({
  children,
  colors = ['#FF6B9D', '#C44DFF', '#00D4AA'],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  className = '',
  style,
  noPadding = false,
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[
        styles.baseCard,
        noPadding ? styles.noPadding : styles.withPadding,
        style,
      ]}
      className={cn('rounded-3xl shadow-xl', className)}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  baseCard: {
    overflow: 'hidden',
  },
  withPadding: {
    padding: 24,
  },
  noPadding: {
    padding: 0,
  },
});

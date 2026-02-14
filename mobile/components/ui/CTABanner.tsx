import React from 'react';
import { View, Text, Pressable, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/cn';
import { hapticSelection } from '../../lib/haptics';

interface CTABannerProps {
  title: string;
  subtitle?: string;
  buttonText: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  colors?: string[];
  className?: string;
  style?: ViewStyle;
}

export default function CTABanner({
  title,
  subtitle,
  buttonText,
  onPress,
  icon = 'arrow-forward',
  colors = ['#FF6B9D', '#C44DFF'],
  className = '',
  style,
}: CTABannerProps) {
  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
      className={cn('rounded-3xl p-6 shadow-xl', className)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xl font-bold text-white mb-1">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm text-white/80">
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          onPress={handlePress}
          className="bg-white/20 rounded-full px-5 py-3 flex-row items-center gap-2 active:opacity-80"
        >
          <Text className="text-white font-semibold text-sm">
            {buttonText}
          </Text>
          <Ionicons name={icon} size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

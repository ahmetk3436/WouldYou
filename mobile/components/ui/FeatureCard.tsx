import React from 'react';
import { View, Text, Pressable, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/cn';
import { hapticSelection } from '../../lib/haptics';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLocked?: boolean;
  isNew?: boolean;
  onPress: () => void;
  className?: string;
  style?: ViewStyle;
}

export default function FeatureCard({
  title,
  description,
  icon,
  isLocked = false,
  isNew = false,
  onPress,
  className = '',
  style,
}: FeatureCardProps) {
  const handlePress = () => {
    hapticSelection();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[style]}
      className={cn(
        'bg-white/8 border border-white/12 rounded-3xl p-5 mb-4 active:opacity-80',
        isLocked && 'opacity-70',
        className
      )}
    >
      <View className="flex-row items-start gap-4">
        {/* Icon container */}
        <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B9D] to-[#C44DFF] items-center justify-center">
          <Ionicons name={icon} size={24} color="#FFFFFF" />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-lg font-semibold text-white">
              {title}
            </Text>
            {isNew && (
              <LinearGradient
                colors={['#FFE66D', '#FF9F43']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-full px-2 py-0.5"
              >
                <Text className="text-xs font-bold text-[#0A0A12]">
                  NEW
                </Text>
              </LinearGradient>
            )}
          </View>
          <Text className="text-sm text-white/60">
            {description}
          </Text>
        </View>

        {/* Arrow or Lock */}
        <View className="items-center justify-center">
          {isLocked ? (
            <Ionicons name="lock-closed" size={20} color="#6B6B8A" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          )}
        </View>
      </View>

      {/* Locked overlay */}
      {isLocked && (
        <View
          style={styles.lockedOverlay}
          pointerEvents="none"
        >
          <View className="items-center justify-center">
            <Ionicons name="lock-closed" size={32} color="#6B6B8A" />
            <Text className="text-sm text-[#6B6B8A] mt-2 font-medium">
              Premium Feature
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 18, 0.8)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

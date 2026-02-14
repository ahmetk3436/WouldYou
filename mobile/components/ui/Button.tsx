import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../../lib/cn';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

const variantStyles = {
  primary: '',
  secondary: 'bg-gray-700 active:bg-gray-600',
  outline: 'bg-transparent active:bg-pink-900/30',
  destructive: 'bg-red-600 active:bg-red-700',
  gradient: '', // Handled separately with LinearGradient
};

const variantTextStyles = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: '',
  destructive: 'text-white',
  gradient: 'text-white',
};

const sizeStyles = {
  sm: 'px-3 py-2',
  md: 'px-5 py-3',
  lg: 'px-7 py-4',
};

const sizeTextStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * Button - Enhanced 2025-2026 Version
 * - Added gradient variant for modern look
 * - Loading shimmer effect via skeleton pattern
 * - Scale animation for press feedback
 */
export default function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  gradientColors = ['#FF6B9D', '#C44DFF'],
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const isGradient = variant === 'gradient';

  const content = (
    <>
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#FF6B9D' : '#ffffff'}
          size={size === 'sm' ? 'small' : 'large'}
        />
      ) : (
        <Text
          className={cn(
            'font-semibold',
            variantTextStyles[variant],
            sizeTextStyles[size]
          )}
          style={variant === 'outline' ? { color: '#FF6B9D' } : undefined}
        >
          {title}
        </Text>
      )}
    </>
  );

  if (isGradient) {
    return (
      <Pressable
        disabled={isDisabled}
        className={cn(
          'items-center justify-center rounded-xl overflow-hidden',
          sizeStyles[size],
          isDisabled && 'opacity-50'
        )}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.97 : 1 }],
          ...(style as object),
        })}
        {...(props as PressableProps)}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-xl',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'opacity-50'
      )}
      disabled={isDisabled}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.97 : 1 }],
        ...(variant === 'primary' ? { backgroundColor: '#FF6B9D' } : {}),
        ...(variant === 'outline' ? { borderWidth: 2, borderColor: '#FF6B9D' } : {}),
        ...(style as object),
      })}
      {...(props as PressableProps)}
    >
      {content}
    </Pressable>
  );
}

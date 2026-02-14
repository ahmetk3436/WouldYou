import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

/**
 * Input - Enhanced 2025-2026 Version
 * - Error states with visual feedback
 * - Password toggle visibility
 * - Character count indicator
 * - Focus animation with colored border
 */
export default function Input({
  label,
  error,
  showCharCount = false,
  maxLength,
  className,
  value,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const actualSecureEntry = secureTextEntry && !showPassword;

  const charCount = value ? value.toString().length : 0;

  return (
    <View className="w-full">
      {label && (
        <View className="mb-1.5 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-400">{label}</Text>
          {error && (
            <Text className="text-sm font-medium text-red-500">{error}</Text>
          )}
        </View>
      )}

      <View className="relative">
        <TextInput
          className={cn(
            'w-full rounded-xl border bg-gray-900 px-4 py-3 text-base text-white pr-12',
            isFocused
              ? 'border-pink-500'
              : 'border-gray-700',
            error && 'border-red-500',
            className
          )}
          placeholderTextColor="#6b7280"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          value={value}
          secureTextEntry={actualSecureEntry}
          maxLength={maxLength}
          {...props}
        />

        {/* Password toggle or character count */}
        <View className="absolute right-3 top-1/2 -translate-y-1/2 flex-row items-center">
          {secureTextEntry && (
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          )}

          {showCharCount && maxLength && !secureTextEntry && (
            <Text className="text-xs text-gray-500">
              {charCount}/{maxLength}
            </Text>
          )}

          {/* Focus indicator dot */}
          {isFocused && !error && (
            <View className="ml-2 h-2 w-2 rounded-full" style={{ backgroundColor: '#FF6B9D' }} />
          )}
        </View>
      </View>

      {/* Helper text */}
      {props.placeholder && !error && (
        <Text className="mt-1 text-xs text-gray-600">{props.placeholder}</Text>
      )}
    </View>
  );
}

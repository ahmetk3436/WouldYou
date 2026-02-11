import React, { useState } from 'react';
import { Platform, View, Text, Pressable, ActivityIndicator } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { hapticError, hapticSuccess } from '../../lib/haptics';

interface AppleSignInButtonProps {
  onError?: (error: string) => void;
  isLoading?: boolean;
}

/**
 * AppleSignInButton - Enhanced 2025-2026 Version
 * - Android fallback (Google Sign In placeholder)
 * - Loading state support
 * - Platform-specific styling
 * - Required for App Store compliance (Guideline 4.8)
 */
export default function AppleSignInButton({ onError, isLoading = false }: AppleSignInButtonProps) {
  const { loginWithApple } = useAuth();

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const fullName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : undefined;

      await loginWithApple(
        credential.identityToken,
        credential.authorizationCode || '',
        fullName,
        credential.email || undefined
      );
      hapticSuccess();
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return; // User cancelled
      }
      hapticError();
      onError?.(err.message || 'Apple Sign In failed');
    }
  };

  // iOS: Apple Sign In
  if (Platform.OS === 'ios') {
    return (
      <View className="mt-4">
        <View className="mb-4 flex-row items-center">
          <View className="h-px flex-1 bg-gray-700" />
          <Text className="mx-4 text-sm text-gray-500">or continue with</Text>
          <View className="h-px flex-1 bg-gray-700" />
        </View>

        <Pressable
          className="flex-row items-center justify-center rounded-xl bg-black py-3.5"
          onPress={handleAppleSignIn}
          disabled={isLoading}
          style={({ pressed }) => ({ opacity: pressed || isLoading ? 0.6 : 1 })}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <View className="mr-2 h-5 w-5 items-center justify-center rounded bg-white">
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}></Text>
              </View>
              <Text className="text-base font-semibold text-white">
                Sign in with Apple
              </Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  // Android: Show Google Sign In placeholder or other OAuth
  return (
    <View className="mt-4">
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-gray-700" />
        <Text className="mx-4 text-sm text-gray-500">or continue with</Text>
        <View className="h-px flex-1 bg-gray-700" />
      </View>

      <Pressable
        className="flex-row items-center justify-center rounded-xl border border-gray-700 bg-gray-900 py-3.5"
        onPress={() => {/* TODO: Add Google Sign In */}}
        disabled={isLoading}
        style={({ pressed }) => ({ opacity: pressed || isLoading ? 0.6 : 1 })}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="white" />
            <Text className="ml-2 text-base font-semibold text-white">
              Sign in with Google
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

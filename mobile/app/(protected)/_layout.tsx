import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Slot, usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { hapticSelection } from '../../lib/haptics';

const tabs = [
  { name: 'home', title: 'Play', iconDefault: 'help-circle-outline' as const, iconActive: 'help-circle' as const, href: '/(protected)/home' },
  { name: 'history', title: 'History', iconDefault: 'time-outline' as const, iconActive: 'time' as const, href: '/(protected)/history' },
  { name: 'settings', title: 'Settings', iconDefault: 'settings-outline' as const, iconActive: 'settings' as const, href: '/(protected)/settings' },
];

export default function ProtectedLayout() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-600">
          <Ionicons name="help-circle" size={24} color="white" />
        </View>
      </View>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return null;
  }

  // Check if we're on a screen that shouldn't show tabs (explore, paywall)
  const isSubScreen = pathname.includes('explore') || pathname.includes('paywall');

  return (
    <View className="flex-1 bg-gray-950">
      <View className="flex-1">
        <Slot />
      </View>

      {/* Custom Tab Bar - hidden on sub-screens */}
      {!isSubScreen && (
        <View
          className="flex-row border-t border-gray-800 bg-gray-950"
          style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }}
        >
          {tabs.map((tab) => {
            const isActive = pathname.includes(tab.name);
            return (
              <Pressable
                key={tab.name}
                className="flex-1 items-center pt-3"
                onPress={() => {
                  hapticSelection();
                  router.push(tab.href as any);
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <View className="absolute -top-0.5 h-1 w-12 rounded-full bg-orange-600" />
                )}
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconDefault}
                  size={24}
                  color={isActive ? '#ea580c' : '#6b7280'}
                />
                <Text
                  className={`mt-1 text-xs font-medium ${
                    isActive ? 'text-orange-500' : 'text-gray-500'
                  }`}
                >
                  {tab.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

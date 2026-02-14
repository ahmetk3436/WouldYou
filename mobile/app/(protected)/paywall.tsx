import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { PurchasesPackage } from '../../lib/purchases';
import { hapticSuccess, hapticMedium } from '../../lib/haptics';

export default function PaywallScreen() {
  const { offerings, isLoading, handlePurchase, handleRestore } =
    useSubscription();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const handlePackagePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(pkg.identifier);
    try {
      const success = await handlePurchase(pkg);
      if (success) {
        hapticSuccess();
        Alert.alert('Success', 'Subscription activated!');
        router.back();
      } else {
        Alert.alert('Error', 'Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestorePurchases = async () => {
    hapticMedium();
    const success = await handleRestore();
    if (success) {
      hapticSuccess();
      Alert.alert('Success', 'Purchases restored!');
      router.back();
    } else {
      Alert.alert('Not Found', 'No previous purchases found.');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0A0A12' }}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#0A0A12' }}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="items-center px-6 pb-6 pt-16">
          <Pressable
            className="absolute left-6 top-16"
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="close" size={28} color="#9ca3af" />
          </Pressable>
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255, 107, 157, 0.15)' }}>
            <Ionicons name="diamond-outline" size={32} color="#FF6B9D" />
          </View>
          <Text className="mb-2 text-3xl font-bold text-white">
            Upgrade to Premium
          </Text>
          <Text className="text-center text-base text-gray-400">
            Unlock all premium features
          </Text>
        </View>

        {/* Features */}
        <View className="px-6 py-4">
          <Feature icon="infinite" text="Unlimited daily votes" />
          <Feature icon="compass" text="Browse all categories" />
          <Feature icon="time" text="Full voting history" />
          <Feature icon="sparkles" text="Exclusive challenges" />
          <Feature icon="ban" text="No advertisements" />
        </View>

        {/* Packages */}
        {offerings?.availablePackages.map((pkg: PurchasesPackage) => (
          <Pressable
            key={pkg.identifier}
            className="mx-6 mb-4 flex-row items-center rounded-2xl p-5"
            style={{ backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2a2a3e' }}
            onPress={() => handlePackagePurchase(pkg)}
            disabled={purchasing === pkg.identifier}
          >
            <View className="flex-1">
              <Text className="mb-1 text-lg font-semibold text-white">
                {pkg.product.title}
              </Text>
              <Text className="mb-2 text-sm text-gray-400">
                {pkg.product.description}
              </Text>
              <Text className="text-2xl font-bold" style={{ color: '#FF6B9D' }}>
                {pkg.product.priceString}
              </Text>
            </View>
            {purchasing === pkg.identifier && (
              <ActivityIndicator color="#FF6B9D" style={{ marginLeft: 16 }} />
            )}
          </Pressable>
        ))}

        {/* Restore */}
        <Pressable
          className="mx-6 mt-2 items-center rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: 'rgba(255, 107, 157, 0.4)' }}
          onPress={handleRestorePurchases}
        >
          <Text className="text-base font-semibold" style={{ color: '#FF6B9D' }}>
            Restore Purchases
          </Text>
        </Pressable>

        {/* Footer */}
        <Text className="mx-6 mb-8 mt-4 text-center text-xs text-gray-500">
          Subscription automatically renews unless canceled 24 hours before the
          end of the current period.
        </Text>
      </ScrollView>
    </View>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="mb-4 flex-row items-center">
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={22}
        color="#FF6B9D"
      />
      <Text className="ml-3 text-base text-gray-200">{text}</Text>
    </View>
  );
}

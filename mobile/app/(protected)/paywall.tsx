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
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-950">
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
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-orange-900/40">
            <Ionicons name="diamond-outline" size={32} color="#ea580c" />
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
            className="mx-6 mb-4 flex-row items-center rounded-2xl border border-gray-700 bg-gray-900 p-5"
            onPress={() => handlePackagePurchase(pkg)}
            disabled={purchasing === pkg.identifier}
            style={({ pressed }) => ({ opacity: pressed || purchasing === pkg.identifier ? 0.7 : 1 })}
          >
            <View className="flex-1">
              <Text className="mb-1 text-lg font-semibold text-white">
                {pkg.product.title}
              </Text>
              <Text className="mb-2 text-sm text-gray-400">
                {pkg.product.description}
              </Text>
              <Text className="text-2xl font-bold text-orange-500">
                {pkg.product.priceString}
              </Text>
            </View>
            {purchasing === pkg.identifier && (
              <ActivityIndicator color="#ea580c" style={{ marginLeft: 16 }} />
            )}
          </Pressable>
        ))}

        {/* Restore */}
        <Pressable
          className="mx-6 mt-2 items-center rounded-2xl border border-orange-700 p-4"
          onPress={handleRestorePurchases}
        >
          <Text className="text-base font-semibold text-orange-500">
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
        color="#22c55e"
      />
      <Text className="ml-3 text-base text-gray-200">{text}</Text>
    </View>
  );
}

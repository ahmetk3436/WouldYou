import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { hapticSelection, hapticSuccess, hapticError } from '../../lib/haptics';
import { useSubscription } from '../../contexts/SubscriptionContext';

const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth * 0.7;
const cardSpacing = 16;

const pricingPlans = [
  {
    id: 'weekly',
    period: 'Weekly',
    price: '$2.99',
    perPeriod: 'per week',
    badge: null,
    badgeColors: null,
    savings: null,
  },
  {
    id: 'monthly',
    period: 'Monthly',
    price: '$7.99',
    perPeriod: 'per month',
    badge: 'POPULAR',
    badgeColors: ['#FF9F43', '#FFE66D'] as const,
    savings: null,
  },
  {
    id: 'annual',
    period: 'Annual',
    price: '$39.99',
    perPeriod: 'per year',
    badge: 'BEST VALUE',
    badgeColors: ['#00D4AA', '#00B894'] as const,
    savings: '$0.77/week',
  },
];

const features = [
  'Unlimited plays — no daily limits',
  'Exclusive question categories',
  'Ad-free experience',
  'Custom share card themes',
  'Priority access to new packs',
  'Profile badge & frame',
];

export default function PaywallScreen() {
  const { offerings, isLoading, handlePurchase, handleRestore } =
    useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleClose = (): void => {
    hapticSelection();
    router.back();
  };

  const handlePlanSelect = (planId: string): void => {
    hapticSelection();
    setSelectedPlan(planId);
  };

  const handleContinue = async (): Promise<void> => {
    hapticSelection();

    // Find the matching package from RevenueCat offerings
    const pkg = offerings?.availablePackages.find(
      (p) =>
        p.identifier.toLowerCase().includes(selectedPlan) ||
        p.product.identifier.toLowerCase().includes(selectedPlan),
    );

    if (!pkg) {
      hapticError();
      Alert.alert('Error', 'Selected plan is not available. Please try again.');
      return;
    }

    setPurchasing(true);
    try {
      const success = await handlePurchase(pkg);
      if (success) {
        hapticSuccess();
        router.back();
      } else {
        hapticError();
        Alert.alert('Error', 'Purchase failed. Please try again.');
      }
    } catch {
      hapticError();
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async (): Promise<void> => {
    hapticSelection();
    setPurchasing(true);

    try {
      const success = await handleRestore();
      if (success) {
        hapticSuccess();
        Alert.alert('Success', 'Purchases restored!');
        router.back();
      } else {
        Alert.alert('Not Found', 'No previous purchases found.');
      }
    } catch {
      hapticError();
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const selectedPlanData = pricingPlans.find((p) => p.id === selectedPlan);

  return (
    <View className="flex-1">
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0A0A12', '#1A1A2E']}
        style={{ flex: 1 }}
      >
        {/* Atmospheric Glow */}
        <LinearGradient
          colors={['#FF6B9D', '#C44DFF']}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: 300,
            width: 300,
            opacity: 0.1,
            borderBottomLeftRadius: 999,
          }}
        />

        {/* Close Button */}
        <Pressable
          onPress={handleClose}
          className="absolute top-[60px] right-5 z-50 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#6B6B8A" />
        </Pressable>

        {/* Main Content */}
        <View className="flex-1 pt-24 px-6">
          {/* Header Section */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-white">
              👑 WouldYou Pro
            </Text>
            <Text className="text-base text-gray-400 mt-2">
              Unlock the full experience
            </Text>
          </View>

          {/* Feature Checklist */}
          <View className="mb-8">
            {features.map((feature, index) => (
              <View
                key={index}
                className="flex-row items-center gap-3 py-2"
              >
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#FF6B9D"
                />
                <Text className="text-base text-white">
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Pricing Cards Horizontal Scroll */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + cardSpacing}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (screenWidth - cardWidth) / 2,
              gap: cardSpacing,
            }}
            className="mb-8"
          >
            {pricingPlans.map((plan) => {
              const isSelected = selectedPlan === plan.id;

              return (
                <Pressable
                  key={plan.id}
                  onPress={() => handlePlanSelect(plan.id)}
                  style={[
                    styles.pricingCard,
                    {
                      width: cardWidth,
                      backgroundColor: '#1A1A2E',
                      borderColor: isSelected
                        ? '#FF6B9D'
                        : 'rgba(255,255,255,0.1)',
                      borderWidth: isSelected ? 2 : 1,
                      ...(isSelected && {
                        shadowColor: '#FF6B9D',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 8,
                      }),
                    },
                  ]}
                >
                  {/* Badge */}
                  {plan.badge && plan.badgeColors && (
                    <View className="absolute -top-2 -right-2">
                      <LinearGradient
                        colors={[plan.badgeColors[0], plan.badgeColors[1]]}
                        className="rounded-full px-3 py-1"
                      >
                        <Text className="text-xs font-bold text-white">
                          {plan.badge}
                        </Text>
                      </LinearGradient>
                    </View>
                  )}

                  {/* Period */}
                  <Text className="text-lg font-bold text-white">
                    {plan.period}
                  </Text>

                  {/* Price */}
                  <Text className="text-3xl font-bold text-white mt-2">
                    {plan.price}
                  </Text>

                  {/* Per Period */}
                  <Text className="text-sm text-gray-400 mt-1">
                    {plan.perPeriod}
                  </Text>

                  {/* Savings (for annual) */}
                  {plan.savings && (
                    <Text className="text-sm text-[#00D4AA] mt-2 font-medium">
                      {plan.savings}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Continue Button */}
          <Pressable
            onPress={handleContinue}
            disabled={purchasing}
            className="mb-4 overflow-hidden rounded-2xl"
          >
            <LinearGradient
              colors={['#FF6B9D', '#C44DFF']}
              className="py-5 items-center justify-center"
            >
              {purchasing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-lg font-bold text-white">
                  Continue with {selectedPlanData?.period}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Fine Print */}
          <View className="items-center">
            <Text className="text-xs text-gray-500 mb-2">
              Cancel anytime
            </Text>
            <Pressable onPress={handleRestorePurchases}>
              <Text className="text-xs text-[#FF6B9D] underline">
                Restore Purchases
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Loading Overlay */}
        {purchasing && (
          <View
            className="absolute inset-0 bg-black/50 items-center justify-center"
            style={{ flex: 1 }}
          >
            <ActivityIndicator color="#FF6B9D" size="large" />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  pricingCard: {
    borderRadius: 24,
    padding: 24,
  },
});

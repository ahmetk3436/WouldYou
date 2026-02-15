import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Share,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Linking,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isBiometricAvailable, getBiometricType } from '../../lib/biometrics';
import {
  hapticSuccess,
  hapticError,
  hapticSelection,
  hapticWarning
} from '../../lib/haptics';

export default function SettingsScreen() {
  const { user, isGuest, logout, deleteAccount } = useAuth();
  const { isSubscribed, handleRestore } = useSubscription();

  const isAuthenticated = user !== null;

  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async (): Promise<void> => {
    try {
      const available = await isBiometricAvailable();
      if (available) {
        setBiometricAvailable(true);
        const type = await getBiometricType();
        setBiometricType(type);

        const stored = await AsyncStorage.getItem('biometricEnabled');
        setBiometricEnabled(stored === 'true');
      }
    } catch (error) {
      console.log('Biometric check error:', error);
    }
  };

  const toggleBiometric = async (): Promise<void> => {
    hapticSelection();

    if (!biometricEnabled) {
      try {
        const LocalAuthentication = require('expo-local-authentication');
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric login',
          fallbackLabel: 'Use password',
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          await AsyncStorage.setItem('biometricEnabled', 'true');
          setBiometricEnabled(true);
          hapticSuccess();
        } else {
          hapticError();
        }
      } catch (error) {
        hapticError();
      }
    } else {
      await AsyncStorage.setItem('biometricEnabled', 'false');
      setBiometricEnabled(false);
      hapticSuccess();
    }
  };

  const handleRestorePurchases = async (): Promise<void> => {
    hapticSelection();
    setIsRestoring(true);

    try {
      const success = await handleRestore();

      if (success) {
        hapticSuccess();
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (error) {
      hapticError();
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRateApp = (): void => {
    hapticSelection();

    const appId = Constants.expoConfig?.extra?.appStoreId || '6741234567';

    if (Platform.OS === 'ios') {
      const url = `itms-apps://itunes.apple.com/app/id${appId}?action=write-review`;
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://apps.apple.com/app/id${appId}`);
      });
    } else {
      const packageName = Constants.expoConfig?.extra?.androidPackage || 'com.wouldyourather.app';
      Linking.openURL(`market://details?id=${packageName}`).catch(() => {
        Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
      });
    }
  };

  const handleShare = async (): Promise<void> => {
    hapticSelection();

    try {
      await Share.share({
        message: 'Check out WouldYou - the ultimate "Would You Rather" game with AI-generated questions! Download now: https://apps.apple.com/app/wouldyou',
        title: 'WouldYou - AI Would You Rather Game',
      });
      hapticSuccess();
    } catch (error) {
      hapticError();
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    if (isGuest) {
      await logout();
      setDeleteModalVisible(false);
      router.replace('/(auth)/login' as any);
      return;
    }

    if (!deletePassword.trim()) {
      hapticWarning();
      Alert.alert('Password Required', 'Please enter your password to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    hapticWarning();

    try {
      await deleteAccount(deletePassword);
      hapticSuccess();
      setDeleteModalVisible(false);
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } catch (error: any) {
      hapticError();
      const message = error.response?.data?.message || 'Failed to delete account. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
    }
  };

  const handleSignOut = async (): Promise<void> => {
    hapticSelection();

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            hapticSuccess();
          }
        }
      ]
    );
  };

  const navigateToPaywall = (): void => {
    hapticSelection();
    router.push('/(protected)/paywall' as any);
  };

  const navigateToAuth = (): void => {
    hapticSelection();
    router.push('/(auth)/register' as any);
  };

  const navigateToPrivacyPolicy = (): void => {
    hapticSelection();
    Linking.openURL('https://wouldyou.app/privacy');
  };

  const navigateToTerms = (): void => {
    hapticSelection();
    Linking.openURL('https://wouldyou.app/terms');
  };

  const renderSectionHeader = (title: string) => (
    <Text className="text-xs font-bold uppercase tracking-wider text-gray-500 px-2 mb-2">
      {title}
    </Text>
  );

  const renderDivider = () => (
    <View className="h-px bg-white/10 mx-4" />
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0A0A12' }}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B9D', '#C44DFF']}
        style={{ height: 160, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <View className="flex-1 justify-end px-6 pb-6">
          <Text className="text-3xl font-bold text-white">Settings</Text>
          <Text className="text-sm text-white/70 mt-1">Manage your account & preferences</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ACCOUNT SECTION */}
        {renderSectionHeader('ACCOUNT')}
        <View className="bg-[#1A1A2E] rounded-2xl overflow-hidden mb-6" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={!isAuthenticated ? navigateToAuth : undefined}
          >
            <Ionicons name="person-circle-outline" size={24} color="#FF6B9D" />
            <View className="flex-1 ml-3">
              <Text className="text-base text-white">
                {isAuthenticated ? user?.email : 'Guest User'}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {isAuthenticated ? 'Signed in' : 'Tap to create account'}
              </Text>
            </View>
            {!isAuthenticated && (
              <Ionicons name="chevron-forward" size={20} color="#6B6B8A" />
            )}
          </Pressable>
        </View>

        {/* SUBSCRIPTION SECTION */}
        {renderSectionHeader('SUBSCRIPTION')}
        <View className="bg-[#1A1A2E] rounded-2xl overflow-hidden mb-6" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={!isSubscribed ? navigateToPaywall : undefined}
          >
            <Ionicons
              name={isSubscribed ? "diamond" : "diamond-outline"}
              size={24}
              color={isSubscribed ? "#FF6B9D" : "#B8B8D0"}
            />
            <View className="flex-1 ml-3">
              <Text className="text-base text-white">
                {isSubscribed ? 'Premium Active' : 'Free Plan'}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {isSubscribed ? 'All features unlocked' : 'Upgrade for unlimited access'}
              </Text>
            </View>
            <View
              className="px-3 rounded-full"
              style={{
                backgroundColor: isSubscribed ? 'rgba(16,185,129,0.2)' : 'rgba(255,107,157,0.2)',
                paddingVertical: 6,
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: isSubscribed ? '#34D399' : '#FF6B9D' }}
              >
                {isSubscribed ? 'PRO' : 'UPGRADE'}
              </Text>
            </View>
          </Pressable>

          {renderDivider()}

          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#B8B8D0" />
            ) : (
              <Ionicons name="refresh-outline" size={22} color="#B8B8D0" />
            )}
            <Text className="flex-1 ml-3 text-base text-white">Restore Purchases</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B6B8A" />
          </Pressable>
        </View>

        {/* SECURITY SECTION */}
        {biometricAvailable && (
          <>
            {renderSectionHeader('SECURITY')}
            <View className="bg-[#1A1A2E] rounded-2xl overflow-hidden mb-6" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Pressable
                className="flex-row items-center px-4 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                onPress={toggleBiometric}
              >
                <Ionicons name="finger-print" size={24} color="#C44DFF" />
                <View className="flex-1 ml-3">
                  <Text className="text-base text-white">Biometric Login</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{biometricType}</Text>
                </View>
                <View
                  className="w-12 h-7 rounded-full justify-center"
                  style={{ backgroundColor: biometricEnabled ? '#FF6B9D' : '#2A2A4A' }}
                >
                  <View
                    className="w-5 h-5 rounded-full bg-white absolute"
                    style={{ [biometricEnabled ? 'right' : 'left']: 4 }}
                  />
                </View>
              </Pressable>
            </View>
          </>
        )}

        {/* ABOUT SECTION */}
        {renderSectionHeader('ABOUT')}
        <View className="bg-[#1A1A2E] rounded-2xl overflow-hidden mb-6" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={navigateToPrivacyPolicy}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#B8B8D0" />
            <Text className="flex-1 ml-3 text-base text-white">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B6B8A" />
          </Pressable>

          {renderDivider()}

          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={navigateToTerms}
          >
            <Ionicons name="document-text-outline" size={22} color="#B8B8D0" />
            <Text className="flex-1 ml-3 text-base text-white">Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B6B8A" />
          </Pressable>

          {renderDivider()}

          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={handleRateApp}
          >
            <Ionicons name="star-outline" size={22} color="#FBBF24" />
            <Text className="flex-1 ml-3 text-base text-white">Rate WouldYou</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B6B8A" />
          </Pressable>

          {renderDivider()}

          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="#FF6B9D" />
            <Text className="flex-1 ml-3 text-base text-white">Share with Friends</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B6B8A" />
          </Pressable>
        </View>

        {/* DANGER ZONE SECTION */}
        {renderSectionHeader('DANGER ZONE')}
        <View className="bg-[#1A1A2E] rounded-2xl overflow-hidden mb-6" style={{ borderWidth: 1, borderColor: 'rgba(255,87,87,0.2)' }}>
          <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            onPress={() => {
              hapticWarning();
              setDeleteModalVisible(true);
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#FF5757" />
            <Text className="flex-1 ml-3 text-base" style={{ color: '#FF5757' }}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color="rgba(255, 87, 87, 0.5)" />
          </Pressable>
        </View>

        {/* Version */}
        <Text className="text-xs text-gray-600 text-center mt-2 mb-4">
          Version {appVersion}
        </Text>

        {/* Sign Out Button */}
        <Pressable
          className="w-full rounded-2xl py-4 mb-8"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            borderWidth: 2,
            borderColor: '#FF5757',
          })}
          onPress={handleSignOut}
        >
          <Text className="text-center text-base font-semibold" style={{ color: '#FF5757' }}>
            {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="w-full bg-[#1A1A2E] rounded-3xl p-6" style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <View className="items-center mb-4">
              <Ionicons name="warning" size={48} color="#FF5757" />
            </View>

            <Text className="text-2xl font-bold text-white text-center mb-2">
              Are you sure?
            </Text>

            <Text className="text-sm text-gray-400 text-center mb-6">
              This action cannot be undone. Your account and all data will be permanently deleted.
            </Text>

            {!isGuest && (
              <TextInput
                className="w-full rounded-xl px-4 py-3 text-white mb-4"
                style={{
                  backgroundColor: '#0A0A12',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}
                placeholder="Enter password to confirm"
                placeholderTextColor="#6B6B8A"
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
            )}

            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 rounded-xl py-3"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  borderWidth: 1,
                  borderColor: '#2A2A4A',
                })}
                onPress={() => {
                  hapticSelection();
                  setDeleteModalVisible(false);
                  setDeletePassword('');
                }}
              >
                <Text className="text-center text-base text-gray-400">Cancel</Text>
              </Pressable>

              <Pressable
                className="flex-1 rounded-xl py-3 flex-row justify-center items-center"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: '#FF5757',
                })}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-center text-base font-semibold text-white">Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

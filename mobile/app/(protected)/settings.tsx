import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Switch, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isBiometricAvailable, getBiometricType } from '../../lib/biometrics';
import { hapticWarning, hapticMedium, hapticSelection, hapticSuccess } from '../../lib/haptics';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SettingsScreen() {
  const { user, isGuest, logout, deleteAccount } = useAuth();
  const { isSubscribed, handleRestore } = useSubscription();
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await isBiometricAvailable();
      if (available) {
        const type = await getBiometricType();
        setBiometricType(type);
      }
    };
    checkBiometrics();
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      setShowDeleteModal(false);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to delete account'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    hapticWarning();
    Alert.alert(
      'Delete Account',
      'This action is permanent. All your data will be erased and cannot be recovered. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setShowDeleteModal(true),
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    hapticMedium();
    const success = await handleRestore();
    if (success) {
      hapticSuccess();
      Alert.alert('Success', 'Purchases restored successfully!');
    } else {
      Alert.alert('Not Found', 'No previous purchases found.');
    }
  };

  const handleLogout = () => {
    hapticSelection();
    logout();
  };

  return (
    <View className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="bg-orange-600 px-6 pb-6 pt-16">
        <Text className="text-3xl font-bold text-white">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Guest CTA */}
        {isGuest && (
          <Pressable
            className="mx-4 mt-6 rounded-2xl bg-orange-600 p-4"
            onPress={() => router.push('/(auth)/register')}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-white">Create an Account</Text>
                <Text className="mt-1 text-sm text-orange-200">
                  Save your history and unlock unlimited plays
                </Text>
              </View>
              <View className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
            </View>
          </Pressable>
        )}

        {/* Account Section */}
        <View className="mx-4 mt-6 overflow-hidden rounded-2xl bg-gray-900">
          <View className="border-b border-gray-800 px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account</Text>
          </View>
          <View className="flex-row items-center px-4 py-4">
            <Ionicons name="mail-outline" size={22} color="#6b7280" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500">{isGuest ? 'Status' : 'Email'}</Text>
              <Text className="text-base font-medium text-white">
                {isGuest ? 'Guest Mode' : user?.email}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center border-t border-gray-800 px-4 py-4">
            <Ionicons name="diamond-outline" size={22} color="#6b7280" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500">Subscription</Text>
              {isSubscribed ? (
                <Text className="text-base font-bold text-orange-500">Premium</Text>
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-base font-medium text-white">Free Plan</Text>
                  <Pressable
                    className="ml-3 rounded-full bg-orange-600 px-3 py-1"
                    onPress={() => router.push('/(protected)/paywall' as any)}
                  >
                    <Text className="text-xs font-semibold text-white">Upgrade</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Security Section */}
        {!isGuest && biometricType && (
          <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-gray-900">
            <View className="border-b border-gray-800 px-4 py-3">
              <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">Security</Text>
            </View>
            <View className="flex-row items-center justify-between px-4 py-4">
              <View className="flex-row items-center">
                <Ionicons name="finger-print" size={22} color="#6b7280" />
                <View className="ml-3">
                  <Text className="text-base font-medium text-white">{biometricType}</Text>
                  <Text className="text-sm text-gray-500">Use {biometricType} to unlock</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ true: '#ea580c', false: '#374151' }}
              />
            </View>
          </View>
        )}

        {/* Purchases Section */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-gray-900">
          <View className="border-b border-gray-800 px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">Purchases</Text>
          </View>
          <Pressable className="flex-row items-center px-4 py-4" onPress={handleRestorePurchases}>
            <Ionicons name="refresh-outline" size={22} color="#6b7280" />
            <Text className="ml-3 text-base font-medium text-orange-500">Restore Purchases</Text>
          </Pressable>
        </View>

        {/* About Section */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-gray-900">
          <View className="border-b border-gray-800 px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500">About</Text>
          </View>
          <Pressable
            className="flex-row items-center border-b border-gray-800 px-4 py-4"
            onPress={() => Linking.openURL('https://wouldyou.app/privacy')}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#6b7280" />
            <Text className="ml-3 flex-1 text-base font-medium text-white">Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </Pressable>
          <Pressable
            className="flex-row items-center border-b border-gray-800 px-4 py-4"
            onPress={() => Linking.openURL('https://wouldyou.app/terms')}
          >
            <Ionicons name="document-text-outline" size={22} color="#6b7280" />
            <Text className="ml-3 flex-1 text-base font-medium text-white">Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </Pressable>
          <View className="flex-row items-center px-4 py-4">
            <Ionicons name="information-circle-outline" size={22} color="#6b7280" />
            <Text className="ml-3 text-base font-medium text-white">Version</Text>
            <Text className="ml-auto text-sm text-gray-500">
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <Pressable
          className="mx-4 mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#ea580c" />
          <Text className="text-base font-semibold text-orange-500">
            {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
          </Text>
        </Pressable>

        {/* Danger Zone */}
        {!isGuest && (
          <Pressable
            className="mx-4 mt-4 flex-row items-center justify-center gap-2 py-4"
            onPress={confirmDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text className="text-sm font-medium text-red-500">Delete Account</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <Text className="mb-4 text-sm text-gray-400">
          Enter your password to confirm account deletion. This cannot be undone.
        </Text>
        <View className="mb-4">
          <Input
            placeholder="Your password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
          />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowDeleteModal(false)}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Delete"
              variant="destructive"
              onPress={handleDeleteAccount}
              isLoading={isDeleting}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

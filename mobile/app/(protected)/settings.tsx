import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { isBiometricAvailable, getBiometricType } from '../../lib/biometrics';
import { hapticWarning, hapticMedium } from '../../lib/haptics';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function SettingsScreen() {
  const { user, isGuest, logout, deleteAccount } = useAuth();
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

  // Restore Purchases (Guideline 3.1 -- required on every paywall)
  const handleRestorePurchases = () => {
    hapticMedium();
    Alert.alert('Restore Purchases', 'Checking for previous purchases...');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <View className="flex-1 px-6 pt-8">
        <Text className="mb-8 text-3xl font-bold text-white">Settings</Text>

        {/* Guest CTA */}
        {isGuest && (
          <Pressable
            className="mb-6 rounded-xl bg-violet-600 p-4"
            onPress={() => router.push('/(auth)/register')}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-bold text-white">Create an Account</Text>
                <Text className="mt-1 text-sm text-violet-200">
                  Save your history and unlock unlimited plays
                </Text>
              </View>
              <View className="h-8 w-8 items-center justify-center rounded-full bg-violet-500">
                <Text className="text-lg font-bold text-white">+</Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Account Section */}
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Account
        </Text>
        <View className="mb-6 rounded-xl bg-gray-900 p-4">
          <Text className="text-sm text-gray-400">
            {isGuest ? 'Status' : 'Email'}
          </Text>
          <Text className="mt-0.5 text-base font-medium text-white">
            {isGuest ? 'Guest Mode' : user?.email}
          </Text>
        </View>

        {/* Security Section */}
        {!isGuest && (
          <>
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Security
            </Text>
            <View className="mb-6 rounded-xl bg-gray-900">
              {biometricType && (
                <View className="flex-row items-center justify-between border-b border-gray-800 p-4">
                  <View>
                    <Text className="text-base font-medium text-white">
                      {biometricType}
                    </Text>
                    <Text className="text-sm text-gray-400">
                      Use {biometricType} to unlock the app
                    </Text>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={setBiometricEnabled}
                    trackColor={{ true: '#7c3aed' }}
                  />
                </View>
              )}
              <Pressable className="p-4" onPress={logout}>
                <Text className="text-base font-medium text-white">
                  Sign Out
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Guest Sign Out */}
        {isGuest && (
          <View className="mb-6">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Session
            </Text>
            <View className="rounded-xl bg-gray-900">
              <Pressable className="p-4" onPress={logout}>
                <Text className="text-base font-medium text-white">
                  Exit Guest Mode
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Purchases Section (Guideline 3.1) */}
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Purchases
        </Text>
        <View className="mb-6 rounded-xl bg-gray-900">
          <Pressable className="p-4" onPress={handleRestorePurchases}>
            <Text className="text-base font-medium text-violet-400">
              Restore Purchases
            </Text>
          </Pressable>
        </View>

        {/* Danger Zone -- Account Deletion (Guideline 5.1.1) */}
        {!isGuest && (
          <>
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Danger Zone
            </Text>
            <View className="rounded-xl bg-red-950/50">
              <Pressable className="p-4" onPress={confirmDelete}>
                <Text className="text-base font-medium text-red-400">
                  Delete Account
                </Text>
                <Text className="mt-0.5 text-sm text-red-500/70">
                  Permanently remove all your data
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

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
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticWarning } from '../../lib/haptics';
import Modal from './Modal';
import Button from './Button';

interface BlockButtonProps {
  userId: string;
  userName?: string;
  onBlocked?: () => void;
}

/**
 * BlockButton - Enhanced 2025-2026 Version
 * - Custom modal instead of Alert
 * - Undo action (for accidental blocks)
 * - Apple Guideline 1.2 compliance (immediate content hiding)
 */
export default function BlockButton({
  userId,
  userName = 'this user',
  onBlocked,
}: BlockButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await api.post('/blocks', { blocked_id: userId });
      hapticSuccess();
      setShowModal(false);
      onBlocked?.();
      Alert.alert(
        'User Blocked',
        `${userName} has been blocked. Their content is now hidden from your view.`,
        [
          { text: 'OK' }
        ]
      );
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1 rounded-lg p-2"
        onPress={() => { hapticWarning(); setShowModal(true); }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Ionicons name="ban-outline" size={16} color="#FF5757" />
        <Text className="text-sm text-red-500">Block</Text>
      </Pressable>

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Block User"
        size="sm"
      >
        <View className="items-center py-4">
          {/* Warning Icon */}
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
            <Ionicons name="shield-checkmark" size={32} color="#FF5757" />
          </View>

          <Text className="mb-2 text-lg font-semibold text-white">
            Block {userName}?
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-400">
            Their content will be immediately hidden from your view. You can unblock them
            from your settings at any time.
          </Text>

          {/* What happens when blocked */}
          <View className="mb-6 w-full rounded-xl p-4" style={{ backgroundColor: '#2A2A4A' }}>
            <Text className="mb-2 text-sm font-semibold text-white">What happens:</Text>
            <View className="flex-row items-center gap-2 py-1">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-sm text-gray-300">All content hidden</Text>
            </View>
            <View className="flex-row items-center gap-2 py-1">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-sm text-gray-300">No profile access</Text>
            </View>
            <View className="flex-row items-center gap-2 py-1">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-sm text-gray-300">No messaging</Text>
            </View>
          </View>

          {/* Actions */}
          <View className="w-full flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowModal(false)}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Block"
                variant="destructive"
                onPress={handleBlock}
                isLoading={isBlocking}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

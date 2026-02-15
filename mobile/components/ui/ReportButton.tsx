import React, { useState } from 'react';
import { Alert, Pressable, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { hapticSuccess, hapticError, hapticSelection } from '../../lib/haptics';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

interface ReportButtonProps {
  contentType: 'user' | 'post' | 'comment';
  contentId: string;
}

// Quick report categories (2025-2026 trend: chip selection)
const REPORT_CATEGORIES = [
  { id: 'harassment', label: 'Harassment', icon: 'person-outline' },
  { id: 'spam', label: 'Spam', icon: 'megaphone-outline' },
  { id: 'inappropriate', label: 'Inappropriate Content', icon: 'eye-off-outline' },
  { id: 'misinformation', label: 'Misinformation', icon: 'warning-outline' },
  { id: 'hate_speech', label: 'Hate Speech', icon: 'warning' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
] as const;

/**
 * ReportButton - Enhanced 2025-2026 Version
 * - Quick category chips for faster reporting
 * - Clean modal interface
 * - Apple Guideline 1.2 compliance (UGC safety)
 */
export default function ReportButton({
  contentType,
  contentId,
}: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async () => {
    if (!category.trim()) {
      Alert.alert('Select a Category', 'Please select a category for your report.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reports', {
        content_type: contentType,
        content_id: contentId,
        category,
        details,
      });
      hapticSuccess();
      setShowModal(false);
      setCategory('');
      setDetails('');
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We will review this within 24 hours.',
        [{ text: 'OK' }]
      );
    } catch {
      hapticError();
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1 rounded-lg p-2"
        onPress={() => { hapticSelection(); setShowModal(true); }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <Ionicons name="flag-outline" size={16} color="#FF5757" />
        <Text className="text-sm text-red-500">Report</Text>
      </Pressable>

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title="Report Content"
        size="lg"
      >
        <Text className="mb-4 text-sm text-gray-400">
          Tell us why you are reporting this {contentType}. Our team reviews all
          reports within 24 hours.
        </Text>

        {/* Quick Category Selection */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-gray-400">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {REPORT_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
                  style={isSelected ? { backgroundColor: '#FF6B9D' } : { borderWidth: 1, borderColor: '#2A2A4A', backgroundColor: '#1A1A2E' }}
                  onPress={() => { hapticSelection(); setCategory(cat.id); }}
                >
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={isSelected ? 'white' : '#B8B8D0'}
                  />
                  <Text
                    className={`text-xs font-medium ${
                      isSelected ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Additional Details */}
        <View className="mb-4">
          <Input
            label="Additional Details (Optional)"
            placeholder="Provide more context..."
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={3}
            showCharCount
            maxLength={500}
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowModal(false)}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Submit Report"
              variant="destructive"
              onPress={handleReport}
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

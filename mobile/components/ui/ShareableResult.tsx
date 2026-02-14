import React, { useState } from 'react';
import { View, Text, Modal, Pressable, Share, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ShareableResultProps {
  visible: boolean;
  onClose: () => void;
  question: string;
  optionA: string;
  optionB: string;
  percentA: number;
  percentB: number;
  userChoice: 'A' | 'B' | null;
  streak: number;
  gradientColors?: string[];
}

export default function ShareableResult({
  visible,
  onClose,
  question,
  optionA,
  optionB,
  percentA,
  percentB,
  userChoice,
  streak,
  gradientColors = ['#FF6B9D', '#C44DFF', '#00D4AA'],
}: ShareableResultProps) {
  const [copied, setCopied] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 48;
  const cardHeight = Math.min(cardWidth * (16 / 9), 500);

  const constructShareMessage = (): string => {
    const choiceText = userChoice === 'A' ? optionA : optionB;
    const majorityPercent = userChoice === 'A' ? percentA : percentB;
    const majorityText = majorityPercent > 50 ? "I'm with the majority!" : "I'm in the minority!";
    const checkA = userChoice === 'A' ? '✓' : ' ';
    const checkB = userChoice === 'B' ? '✓' : ' ';

    return `Would You Rather...

${checkA} A: ${optionA} (${percentA}%)
${checkB} B: ${optionB} (${percentB}%)

I picked "${choiceText}"! ${majorityText}

🔥 ${streak}-day streak

Play: https://wouldyou.app`;
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = constructShareMessage();
    try {
      await Share.share({
        message: message,
        title: 'Would You Rather',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyToClipboard = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const message = constructShareMessage();
    try {
      await Share.share({
        message: message,
        title: 'Would You Rather',
      });
    } catch (error) {
      console.error('Copy/share error:', error);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstagramShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleShare();
  };

  const handleTiktokShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleShare();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose}>
        <View className="flex-1 justify-center items-center p-6">
          <Pressable onPress={(e) => e.stopPropagation()} className="bg-gray-900 rounded-3xl p-4" style={{ width: cardWidth + 32 }}>

            {/* Header */}
            <Text className="text-white text-lg font-bold text-center mb-4">Share Your Choice</Text>

            {/* Preview Card */}
            <View className="rounded-3xl overflow-hidden" style={{ width: cardWidth, height: cardHeight }}>
              <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, padding: 16 }}
              >
                {/* Top Branding */}
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-white text-lg font-bold">WouldYou</Text>
                    <Text className="text-white/50 text-xs">wouldyou.app</Text>
                  </View>
                  <Ionicons name="help-circle" size={24} color="white" />
                </View>

                {/* Content */}
                <View className="flex-1 justify-center px-2">
                  <Text className="text-white/70 text-sm mb-4 text-center">Would You Rather...</Text>

                  {/* Option A */}
                  <View
                    className="rounded-xl p-3 mb-3"
                    style={userChoice === 'A'
                      ? { borderWidth: 2, borderColor: '#FF6B9D', backgroundColor: 'rgba(255,255,255,0.1)' }
                      : { backgroundColor: 'rgba(255,255,255,0.1)' }
                    }
                  >
                    <View className="flex-row items-center">
                      <Text className="text-white text-lg font-bold mr-2">A</Text>
                      <Text className="text-white text-base flex-1" numberOfLines={2}>{optionA}</Text>
                    </View>
                    <View className="bg-white/20 rounded-full h-2 mt-2 overflow-hidden">
                      <View className="rounded-full h-2" style={{ width: `${percentA}%`, backgroundColor: '#FF6B9D' }} />
                    </View>
                    <Text className="text-white/70 text-sm mt-1">{percentA}%</Text>
                    {userChoice === 'A' && (
                      <View className="mt-2">
                        <Text className="text-xs font-bold" style={{ color: '#FF6B9D' }}>MY PICK ▸</Text>
                      </View>
                    )}
                  </View>

                  {/* Option B */}
                  <View
                    className="rounded-xl p-3"
                    style={userChoice === 'B'
                      ? { borderWidth: 2, borderColor: '#00D4AA', backgroundColor: 'rgba(255,255,255,0.1)' }
                      : { backgroundColor: 'rgba(255,255,255,0.1)' }
                    }
                  >
                    <View className="flex-row items-center">
                      <Text className="text-white text-lg font-bold mr-2">B</Text>
                      <Text className="text-white text-base flex-1" numberOfLines={2}>{optionB}</Text>
                    </View>
                    <View className="bg-white/20 rounded-full h-2 mt-2 overflow-hidden">
                      <View className="rounded-full h-2" style={{ width: `${percentB}%`, backgroundColor: '#00D4AA' }} />
                    </View>
                    <Text className="text-white/70 text-sm mt-1">{percentB}%</Text>
                    {userChoice === 'B' && (
                      <View className="mt-2">
                        <Text className="text-xs font-bold" style={{ color: '#00D4AA' }}>MY PICK ▸</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Bottom CTA */}
                <View className="pt-4 border-t border-white/10">
                  <Text className="text-white/50 text-xs text-center">Play now — Download WouldYou</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Share Buttons */}
            <View className="flex-row justify-center gap-4 mt-4">
              <TouchableOpacity onPress={handleInstagramShare} className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: '#DD2A7B' }}>
                <Ionicons name="logo-instagram" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleTiktokShare} className="w-14 h-14 rounded-full items-center justify-center bg-black">
                <Ionicons name="logo-tiktok" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCopyToClipboard} className="w-14 h-14 rounded-full items-center justify-center bg-gray-700">
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShare} className="w-14 h-14 rounded-full items-center justify-center bg-gray-700">
                <Ionicons name="share-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity onPress={onClose} className="mt-4 py-3">
              <Text className="text-white/70 text-base text-center">Close</Text>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

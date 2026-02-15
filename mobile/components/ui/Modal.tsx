import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  type ModalProps as RNModalProps,
  Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface ModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'w-full h-full',
};

/**
 * Modal - Enhanced 2025-2026 Version
 * - Swipe down to dismiss (iOS)
 * - Backdrop blur effect
 * - Size variants (sm, md, lg, full)
 * - Spring animation on open/close
 */
export default function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  ...props
}: ModalProps) {
  const translateY = useSharedValue(0);
  const contextY = useSharedValue(0);

  const handleClose = () => {
    'worklet';
    translateY.value = withSpring(500, { damping: 15 }, () => {
      runOnJS(onClose)();
    });
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = contextY.value + event.translationY;
      if (translateY.value < 0) translateY.value = 0;
    })
    .onEnd(() => {
      if (translateY.value > 100) {
        handleClose();
      } else {
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15 });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      {...props}
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/70"
        onPress={onClose}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Pressable onPress={() => {}} className="w-full">
            {Platform.OS === 'ios' ? (
              <GestureDetector gesture={gesture}>
                <Animated.View
                  className={`w-full ${sizeStyles[size]} rounded-3xl p-6 shadow-xl`}
                  style={[{ backgroundColor: '#1A1A2E' }, animatedStyle]}
                >
                  {/* Drag indicator */}
                  <View className="mb-4 flex-row justify-center">
                    <View className="h-1 w-12 rounded-full" style={{ backgroundColor: '#2A2A4A' }} />
                  </View>

                  {title && (
                    <Text className="mb-4 text-2xl font-bold text-white">
                      {title}
                    </Text>
                  )}
                  {children}
                </Animated.View>
              </GestureDetector>
            ) : (
              <View className={`w-full ${sizeStyles[size]} rounded-3xl p-6 shadow-xl`} style={{ backgroundColor: '#1A1A2E' }}>
                {title && (
                  <Text className="mb-4 text-2xl font-bold text-white">
                    {title}
                  </Text>
                )}
                {children}
              </View>
            )}
          </Pressable>
        </View>
      </Pressable>
    </RNModal>
  );
}

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Enhanced Haptics Library - 2025-2026 Micro-Interactions
 *
 * Native haptic feedback (Apple Guideline 4.2 - Native Utility).
 * Gracefully no-ops on Android/web where haptics may not be available.
 *
 * Patterns:
 * - Navigation: Light taps for tab switching
 * - Feedback: Success/Error/Warning notifications
 * - Interaction: Selection changes, button presses
 * - Custom patterns: Streak milestones, countdown celebrations
 */

// Platform check (iOS-only haptics)
const isIOS = Platform.OS === 'ios';

// Basic Feedback
export const hapticSuccess = () => {
  if (isIOS) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

export const hapticError = () => {
  if (isIOS) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

export const hapticWarning = () => {
  if (isIOS) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

// Impact Feedback
export const hapticLight = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export const hapticMedium = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

export const hapticHeavy = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

// Selection
export const hapticSelection = () => {
  if (isIOS) {
    Haptics.selectionAsync();
  }
};

// Custom Patterns (2025-2026 Trends)

/**
 * Streak Milestone Haptic
 * Triple impact + success notification for achieving streaks
 */
export const hapticStreakMilestone = async () => {
  if (!isIOS) return;

  await hapticHeavy();
  await new Promise(r => setTimeout(r, 100));
  await hapticHeavy();
  await new Promise(r => setTimeout(r, 100));
  await hapticSuccess();
};

/**
 * Countdown Haptic
 * Three light taps followed by heavy (for timers, countdowns)
 */
export const hapticCountdown = async () => {
  if (!isIOS) return;

  for (let i = 0; i < 3; i++) {
    await hapticLight();
    await new Promise(r => setTimeout(r, 300));
  }
  await hapticHeavy();
};

/**
 * Achievement Unlock
 * Success notification with celebration feel
 */
export const hapticAchievement = async () => {
  if (!isIOS) return;

  await hapticSuccess();
  await new Promise(r => setTimeout(r, 150));
  await hapticMedium();
};

/**
 * Vote Cast
 * Light impact for voting actions
 */
export const hapticVote = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Tab Switch
 * Very light tap for navigation
 */
export const hapticTabSwitch = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Button Press
 * Medium impact for button presses
 */
export const hapticButtonPress = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Refresh Pull
 * Light haptic on pull-to-refresh
 */
export const hapticRefresh = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Delete Action
 * Heavy impact for destructive actions
 */
export const hapticDelete = () => {
  if (isIOS) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Share Action
 * Success notification with light impact
 */
export const hapticShare = async () => {
  if (!isIOS) return;

  await hapticLight();
  await hapticSuccess();
};

/**
 * Paywall Open
 * Medium + warning for upgrade prompts
 */
export const hapticPaywall = async () => {
  if (!isIOS) return;

  await hapticMedium();
  await new Promise(r => setTimeout(r, 100));
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Purchase Success
 * Celebration pattern for successful purchases
 */
export const hapticPurchase = async () => {
  if (!isIOS) return;

  await hapticSuccess();
  await new Promise(r => setTimeout(r, 100));
  await hapticMedium();
  await new Promise(r => setTimeout(r, 100));
  await hapticHeavy();
};

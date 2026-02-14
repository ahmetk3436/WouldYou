import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'wouldyou_streak';
const LAST_PLAY_KEY = 'wouldyou_last_play';

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [lastPlayDate, setLastPlayDate] = useState<string | null>(null);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const storedStreak = await AsyncStorage.getItem(STREAK_KEY);
      const storedLastPlay = await AsyncStorage.getItem(LAST_PLAY_KEY);

      if (storedStreak) {
        const streakNum = parseInt(storedStreak, 10);
        const today = new Date().toDateString();

        if (storedLastPlay) {
          const lastPlay = new Date(storedLastPlay);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          if (lastPlay.toDateString() === today) {
            setStreak(streakNum);
          } else if (lastPlay.toDateString() === yesterday.toDateString()) {
            setStreak(streakNum);
          } else {
            setStreak(0);
            await AsyncStorage.setItem(STREAK_KEY, '0');
          }
        } else {
          setStreak(streakNum);
        }
      }

      if (storedLastPlay) {
        setLastPlayDate(storedLastPlay);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const incrementStreak = useCallback(async () => {
    try {
      const today = new Date().toDateString();

      if (lastPlayDate === today) {
        return streak;
      }

      const newStreak = streak + 1;
      await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
      await AsyncStorage.setItem(LAST_PLAY_KEY, new Date().toISOString());
      setStreak(newStreak);
      setLastPlayDate(today);

      return newStreak;
    } catch (error) {
      console.error('Error incrementing streak:', error);
      return streak;
    }
  }, [streak, lastPlayDate]);

  return { streak, incrementStreak, loadStreak };
}

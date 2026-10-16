import { Card, DifficultyLevel, UserProgress } from '../types';

/**
 * Calculates the next review date and updated repetition stats based on user rating.
 * Implements a modified Leitner / SM-2 spaced repetition algorithm.
 */
export function calculateNextReview(card: Card, rating: DifficultyLevel): {
  intervalDays: number;
  repetitionCount: number;
  nextReviewDate: number;
} {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  let nextInterval: number;
  let newRepetitionCount: number;

  switch (rating) {
    case 'hard':
      // Reset or lower interval for difficult cards so they reappear promptly
      nextInterval = 1;
      newRepetitionCount = 0;
      break;

    case 'medium':
      newRepetitionCount = (card.repetitionCount || 0) + 1;
      if (newRepetitionCount === 1) {
        nextInterval = 2;
      } else if (newRepetitionCount === 2) {
        nextInterval = 4;
      } else {
        nextInterval = Math.round((card.intervalDays || 1) * 1.8);
      }
      break;

    case 'easy':
      newRepetitionCount = (card.repetitionCount || 0) + 1;
      if (newRepetitionCount === 1) {
        nextInterval = 3;
      } else if (newRepetitionCount === 2) {
        nextInterval = 7;
      } else {
        nextInterval = Math.round((card.intervalDays || 1) * 2.5);
      }
      break;

    default:
      nextInterval = 1;
      newRepetitionCount = 0;
  }

  // Ensure minimum interval is 1 day and maximum is 90 days for mobile micro-learning
  nextInterval = Math.max(1, Math.min(nextInterval, 90));

  return {
    intervalDays: nextInterval,
    repetitionCount: newRepetitionCount,
    nextReviewDate: now + nextInterval * ONE_DAY_MS,
  };
}

/**
 * Computes updated user progress and streak according to calendar days.
 */
export function calculateProgressUpdate(
  currentProgress: UserProgress,
  xpEarned: number
): UserProgress {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastDate = currentProgress.lastStudiedDate;

  let newStreak = currentProgress.streak;
  let newTodayCount = currentProgress.todayCompletedCount;

  if (lastDate === todayStr) {
    // Already studied today, just increment counter
    newTodayCount += 1;
  } else {
    // Check if yesterday was studied
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      newStreak += 1;
    } else if (!lastDate) {
      newStreak = 1;
    } else {
      // Streak broken, restart from 1
      newStreak = 1;
    }
    newTodayCount = 1;
  }

  const newTotalReviewed = currentProgress.totalCardsReviewed + 1;
  const newXP = currentProgress.xp + xpEarned;
  // Level up every 100 XP
  const newLevel = Math.floor(newXP / 100) + 1;

  return {
    streak: newStreak,
    lastStudiedDate: todayStr,
    dailyGoal: currentProgress.dailyGoal || 20,
    todayCompletedCount: newTodayCount,
    totalCardsReviewed: newTotalReviewed,
    xp: newXP,
    level: newLevel,
  };
}

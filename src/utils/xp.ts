import type { Activity, AchievementProgress, JournalEntry } from '../types';

export const XP_PER_LEVEL = 100;

const XP_PER_ACTIVITY: Record<Activity['type'], number> = {
  walk: 15,
  park: 12,
  training: 20,
  play: 12,
  other: 8,
};

export const XP_PER_JOURNAL_ENTRY = 12;

export const getXpForActivity = (activityType: Activity['type']) =>
  XP_PER_ACTIVITY[activityType] ?? 10;

export const calculateLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const nextLevelProgress = (xp: number) => xp % XP_PER_LEVEL;

export const percentToNextLevel = (xp: number) =>
  (nextLevelProgress(xp) / XP_PER_LEVEL) * 100;

export const hasPhoto = (entry: Activity | JournalEntry) =>
  Boolean(entry.photoUrl && entry.photoUrl.trim().length > 0);

export const clampProgress = (
  achievement: AchievementProgress,
  progress: number,
): AchievementProgress => ({
  ...achievement,
  progress: Math.min(progress, achievement.threshold),
});

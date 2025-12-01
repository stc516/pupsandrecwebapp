export type PetId = string;

export interface HealthRecord {
  id: string;
  date: string; // ISO
  type: 'vet-visit' | 'vaccine' | 'medication' | 'injury' | 'weight' | 'other';
  description: string;
}

export interface Pet {
  id: PetId;
  name: string;
  breed: string;
  ageYears?: number;
  avatarUrl?: string;
  notes?: string;
  healthRecords: HealthRecord[];
}

export interface Activity {
  id: string;
  petId: PetId;
  type: 'walk' | 'park' | 'training' | 'play' | 'other';
  date: string; // ISO
  durationMinutes?: number;
  distanceKm?: number;
  notes?: string;
  photoUrl?: string;
}

export interface JournalEntry {
  id: string;
  petId: PetId;
  date: string;
  title: string;
  content: string;
  tags: string[];
  category: 'Walk' | 'Health' | 'Training' | 'Play' | 'Other';
  photoUrl?: string;
}

export interface Reminder {
  id: string;
  petId: PetId;
  type: 'walk' | 'vet-appointment' | 'medication' | 'grooming' | 'other';
  title: string;
  dateTime: string; // ISO
}

export type AchievementCondition =
  | 'first-walk'
  | 'journal-count'
  | 'consecutive-days'
  | 'activities-count'
  | 'photos-uploaded';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  xpReward: number;
  conditionType: AchievementCondition;
  threshold: number;
}

export interface AchievementProgress extends Achievement {
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PreferencesState {
  email: string;
  dailyReminders: boolean;
  activityNotifications: boolean;
  profileVisibility: boolean;
  shareDataWithFriends: boolean;
}

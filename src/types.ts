export type PetId = string;

export interface HealthRecord {
  id: string;
  date: string; // ISO
  type: 'vet-visit' | 'vaccine' | 'medication' | 'injury' | 'weight' | 'other';
  description: string;
}

export interface Pet {
  id: PetId;
  userId?: string;
  name: string;
  breed: string;
  ageYears?: number;
  avatarUrl?: string;
  notes?: string;
  healthRecords: HealthRecord[];
}

export interface Activity {
  id: string;
  userId?: string;
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
  userId?: string;
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
  userId?: string;
  petId: PetId;
  type: 'walk' | 'vet-appointment' | 'medication' | 'grooming' | 'other';
  title: string;
  dateTime: string; // ISO
  recurrence?: {
    frequency: 'none' | 'daily' | 'weekly' | 'monthly';
    interval?: number; // every N periods
    until?: string; // ISO end date
  };
}
export type LaunchTaskCategory =
  | 'Ship'
  | 'Analytics'
  | 'App Store/PWA'
  | 'Content'
  | 'Outbound'
  | 'Community'
  | 'Partnerships';

export type LaunchTaskPriority = 'Low' | 'Medium' | 'High';
export type LaunchTaskStatus = 'todo' | 'doing' | 'done' | 'archived';

export interface LaunchTask {
  id: string;
  title: string;
  category: LaunchTaskCategory;
  priority: LaunchTaskPriority;
  status: LaunchTaskStatus;
  notes?: string;
  dueDate?: string;
  createdAtISO: string;
}

export type GrowthExperimentStatus = 'idea' | 'running' | 'done' | 'archived';

export interface GrowthExperiment {
  id: string;
  title: string;
  hypothesis: string;
  channel: string;
  audience: string;
  message: string;
  kpi: string;
  status: GrowthExperimentStatus;
  startISO?: string;
  endISO?: string;
  results?: string;
  notes?: string;
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

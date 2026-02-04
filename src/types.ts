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
    interval?: number;
    until?: string;
  };
}

export interface TrainingSession {
  id: string;
  petId: PetId;
  title: string;
  dateTimeISO: string;
  durationMin?: number;
  distanceMi?: number;
  type: 'obedience' | 'offleash' | 'walk' | 'recall' | 'puppy' | 'custom';
  notes?: string;
  createdAt: string;
}

export interface TrainingPlan {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  milestones: {
    distance: string;
    duration: string;
    distraction: string;
  };
  days: PlanDay[];
}

export interface PlanDay {
  day: number;
  focus: string;
  tasks: PlanTask[];
}

export interface PlanTask {
  id: string;
  title: string;
  minutes: number;
  category: 'obedience' | 'leash' | 'socialization' | 'tricks' | 'focus';
  proofing?: string[];
  notes?: string;
}

export type ExploreCategory = 'dog_parks' | 'trails' | 'parks';

export interface ExplorePlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  googleMapsUrl: string;
  distanceMeters?: number;
  categories?: ExploreCategory[];
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

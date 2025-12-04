import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { nanoid } from 'nanoid';
import { addDays, parseISO, startOfDay } from 'date-fns';

import { activities as seedActivities } from '../data/activities';
import { achievements as achievementCatalog } from '../data/achievements';
import { journalEntries as seedJournal } from '../data/journal';
import { pets as seedPets } from '../data/pets';
import { reminders as seedReminders } from '../data/reminders';
import { useAuth } from '../hooks/useAuth';
import type {
  AchievementProgress,
  Activity,
  HealthRecord,
  JournalEntry,
  Pet,
  PetId,
  PreferencesState,
  Reminder,
} from '../types';
import { getXpForActivity, hasPhoto, XP_PER_JOURNAL_ENTRY } from '../utils/xp';

const STORAGE_KEY = 'pups-rec-state-v1';

interface AppState {
  pets: Pet[];
  selectedPetId: PetId;
  activities: Activity[];
  journalEntries: JournalEntry[];
  reminders: Reminder[];
  achievements: AchievementProgress[];
  xp: number;
  preferences: PreferencesState;
}

const defaultPreferences: PreferencesState = {
  email: 'maggie@pupsandrec.com',
  dailyReminders: true,
  activityNotifications: true,
  profileVisibility: true,
  shareDataWithFriends: false,
};

const buildAchievementState = (): AchievementProgress[] =>
  achievementCatalog.map((achievement) => ({
    ...achievement,
    unlocked: false,
    progress: 0,
  }));

type Action =
  | { type: 'set-selected-pet'; payload: PetId }
  | { type: 'hydrate'; payload: Partial<AppState> }
  | { type: 'add-activity'; payload: Activity }
  | { type: 'update-activity'; payload: { id: string; updates: Partial<Omit<Activity, 'id'>> } }
  | { type: 'delete-activity'; payload: { id: string } }
  | { type: 'add-journal-entry'; payload: JournalEntry }
  | { type: 'update-journal-entry'; payload: { id: string; updates: Partial<Omit<JournalEntry, 'id'>> } }
  | { type: 'delete-journal-entry'; payload: { id: string } }
  | { type: 'add-reminder'; payload: Reminder }
  | { type: 'update-reminder'; payload: { id: string; updates: Partial<Omit<Reminder, 'id'>> } }
  | { type: 'delete-reminder'; payload: { id: string } }
  | { type: 'add-pet'; payload: Pet }
  | { type: 'update-pet'; payload: Pet }
  | { type: 'delete-pet'; payload: PetId }
  | { type: 'add-health-record'; payload: { petId: PetId; record: HealthRecord } }
  | { type: 'update-health-record'; payload: { petId: PetId; recordId: string; updates: Partial<Omit<HealthRecord, 'id'>> } }
  | { type: 'delete-health-record'; payload: { petId: PetId; recordId: string } }
  | { type: 'grant-xp'; payload: number }
  | { type: 'update-preferences'; payload: Partial<PreferencesState> };

const sortActivities = (items: Activity[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const sortJournal = (items: JournalEntry[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const baseState: AppState = {
  pets: seedPets,
  selectedPetId: seedPets[0]?.id ?? 'bailey',
  activities: sortActivities(seedActivities),
  journalEntries: sortJournal(seedJournal),
  reminders: seedReminders,
  achievements: buildAchievementState(),
  xp: 120,
  preferences: defaultPreferences,
};

const addAchievementXp = (state: AppState) => {
  let xpBonus = 0;
  const updated = state.achievements.map((achievement) => {
    const progress = calculateProgress(achievement, state);
    const unlocked = progress >= achievement.threshold;
    const unlockedAt = unlocked
      ? achievement.unlockedAt ?? new Date().toISOString()
      : achievement.unlockedAt;
    if (unlocked && !achievement.unlocked) {
      xpBonus += achievement.xpReward;
    }
    return {
      ...achievement,
      progress: Math.min(progress, achievement.threshold),
      unlocked,
      unlockedAt,
    };
  });

  if (xpBonus > 0) {
    return { ...state, xp: state.xp + xpBonus, achievements: updated };
  }

  return { ...state, achievements: updated };
};

const calculateProgress = (achievement: AchievementProgress, state: AppState) => {
  switch (achievement.conditionType) {
    case 'first-walk':
      return state.activities.filter((activity) => activity.type === 'walk').length;
    case 'journal-count':
      return state.journalEntries.length;
    case 'activities-count': {
      const sevenDaysAgo = addDays(new Date(), -6);
      return state.activities.filter((activity) => new Date(activity.date) >= sevenDaysAgo).length;
    }
    case 'photos-uploaded': {
      const activityPhotos = state.activities.filter(hasPhoto).length;
      const journalPhotos = state.journalEntries.filter(hasPhoto).length;
      return activityPhotos + journalPhotos;
    }
    case 'consecutive-days': {
      const sorted = sortActivities(state.activities);
      let streak = 0;
      let longest = 0;
      let lastDate: Date | null = null;
      sorted.forEach((activity) => {
        const activityDate = startOfDay(parseISO(activity.date));
        if (!lastDate) {
          streak = 1;
        } else {
          const diff = lastDate.getTime() - activityDate.getTime();
          const dayDiff = diff / (1000 * 60 * 60 * 24);
          if (dayDiff === 0) {
            return; // multiple activities same day
          }
          if (dayDiff === 1) {
            streak += 1;
          } else {
            streak = 1;
          }
        }
        lastDate = activityDate;
        longest = Math.max(longest, streak);
      });
      return longest || streak;
    }
    default:
      return 0;
  }
};

const loadPersistedState = (): AppState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AppState;
    const merged = {
      ...baseState,
      ...parsed,
      achievements: parsed.achievements ?? baseState.achievements,
    };
    return merged;
  } catch (error) {
    console.warn('Failed to parse saved state', error);
    return null;
  }
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'set-selected-pet':
      return { ...state, selectedPetId: action.payload };
    case 'hydrate': {
      const merged: AppState = {
        ...state,
        ...(action.payload as AppState),
      };
      if (action.payload.activities) {
        merged.activities = sortActivities(action.payload.activities);
      }
      if (action.payload.journalEntries) {
        merged.journalEntries = sortJournal(action.payload.journalEntries);
      }
      if (action.payload.pets && !merged.pets.some((pet) => pet.id === merged.selectedPetId)) {
        merged.selectedPetId = merged.pets[0]?.id ?? merged.selectedPetId;
      }
      return addAchievementXp(merged);
    }
    case 'add-activity': {
      const updatedState = {
        ...state,
        activities: sortActivities([action.payload, ...state.activities]),
        xp: state.xp + getXpForActivity(action.payload.type),
      };
      return addAchievementXp(updatedState);
    }
    case 'add-journal-entry': {
      const updatedState = {
        ...state,
        journalEntries: sortJournal([action.payload, ...state.journalEntries]),
        xp: state.xp + XP_PER_JOURNAL_ENTRY,
      };
      return addAchievementXp(updatedState);
    }
    case 'update-activity': {
      const updatedActivities = sortActivities(
        state.activities.map((activity) =>
          activity.id === action.payload.id ? { ...activity, ...action.payload.updates } : activity,
        ),
      );
      return addAchievementXp({
        ...state,
        activities: updatedActivities,
      });
    }
    case 'delete-activity': {
      const updatedActivities = state.activities.filter((activity) => activity.id !== action.payload.id);
      return addAchievementXp({ ...state, activities: updatedActivities });
    }
    case 'update-journal-entry': {
      const updatedJournal = sortJournal(
        state.journalEntries.map((entry) =>
          entry.id === action.payload.id ? { ...entry, ...action.payload.updates } : entry,
        ),
      );
      return addAchievementXp({ ...state, journalEntries: updatedJournal });
    }
    case 'delete-journal-entry': {
      const updatedJournal = state.journalEntries.filter((entry) => entry.id !== action.payload.id);
      return addAchievementXp({ ...state, journalEntries: updatedJournal });
    }
    case 'add-reminder':
      return {
        ...state,
        reminders: [action.payload, ...state.reminders],
      };
    case 'update-reminder':
      return {
        ...state,
        reminders: state.reminders.map((reminder) =>
          reminder.id === action.payload.id ? { ...reminder, ...action.payload.updates } : reminder,
        ),
      };
    case 'delete-reminder':
      return {
        ...state,
        reminders: state.reminders.filter((reminder) => reminder.id !== action.payload.id),
      };
    case 'add-pet':
      return {
        ...state,
        pets: [...state.pets, action.payload],
        selectedPetId: action.payload.id,
      };
    case 'update-pet':
      return {
        ...state,
        pets: state.pets.map((pet) => (pet.id === action.payload.id ? action.payload : pet)),
      };
    case 'delete-pet': {
      const filteredPets = state.pets.filter((pet) => pet.id !== action.payload);
      const fallbackPetId =
        state.selectedPetId === action.payload ? filteredPets[0]?.id ?? '' : state.selectedPetId;
      const filteredActivities = state.activities.filter((activity) => activity.petId !== action.payload);
      const filteredJournal = state.journalEntries.filter((entry) => entry.petId !== action.payload);
      const filteredReminders = state.reminders.filter((reminder) => reminder.petId !== action.payload);
      return addAchievementXp({
        ...state,
        pets: filteredPets,
        selectedPetId: fallbackPetId,
        activities: filteredActivities,
        journalEntries: filteredJournal,
        reminders: filteredReminders,
      });
    }
    case 'add-health-record':
      return {
        ...state,
        pets: state.pets.map((pet) =>
          pet.id === action.payload.petId
            ? { ...pet, healthRecords: [action.payload.record, ...pet.healthRecords] }
            : pet,
        ),
      };
    case 'update-health-record':
      return {
        ...state,
        pets: state.pets.map((pet) =>
          pet.id === action.payload.petId
            ? {
                ...pet,
                healthRecords: pet.healthRecords.map((record) =>
                  record.id === action.payload.recordId ? { ...record, ...action.payload.updates } : record,
                ),
              }
            : pet,
        ),
      };
    case 'delete-health-record':
      return {
        ...state,
        pets: state.pets.map((pet) =>
          pet.id === action.payload.petId
            ? {
                ...pet,
                healthRecords: pet.healthRecords.filter((record) => record.id !== action.payload.recordId),
              }
            : pet,
        ),
      };
    case 'grant-xp': {
      const updatedState = { ...state, xp: state.xp + action.payload };
      return addAchievementXp(updatedState);
    }
    case 'update-preferences':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    default:
      return state;
  }
};

interface AppStateContextValue extends AppState {
  selectedPet?: Pet;
  setSelectedPet: (petId: PetId) => void;
  addActivity: (payload: Omit<Activity, 'id'>) => void;
  updateActivity: (payload: { id: string; updates: Partial<Omit<Activity, 'id'>> }) => void;
  deleteActivity: (id: string) => void;
  addJournalEntry: (payload: Omit<JournalEntry, 'id'>) => void;
  updateJournalEntry: (payload: { id: string; updates: Partial<Omit<JournalEntry, 'id'>> }) => void;
  deleteJournalEntry: (id: string) => void;
  addReminder: (payload: Omit<Reminder, 'id'>) => void;
  updateReminder: (payload: { id: string; updates: Partial<Omit<Reminder, 'id'>> }) => void;
  deleteReminder: (id: string) => void;
  addPet: (payload: Omit<Pet, 'id'>) => void;
  updatePet: (payload: Pet) => void;
  deletePet: (petId: PetId) => void;
  addHealthRecord: (payload: { petId: PetId; record: Omit<HealthRecord, 'id'> }) => void;
  updateHealthRecord: (payload: {
    petId: PetId;
    recordId: string;
    updates: Partial<Omit<HealthRecord, 'id'>>;
  }) => void;
  deleteHealthRecord: (payload: { petId: PetId; recordId: string }) => void;
  completeActionAndGrantXP: (xp: number) => void;
  updatePreferences: (prefs: Partial<PreferencesState>) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const persisted = loadPersistedState();
  const startingState = addAchievementXp(persisted ?? baseState);
  const [state, dispatch] = useReducer(reducer, startingState);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const wasLoggedIn = Boolean(previousUserIdRef.current);
    if (wasLoggedIn && !user) {
      const demoState = addAchievementXp(baseState);
      dispatch({ type: 'hydrate', payload: demoState });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState));
      }
    }
    previousUserIdRef.current = user?.id ?? null;
  }, [user]);

  const setSelectedPet = useCallback((petId: PetId) => {
    dispatch({ type: 'set-selected-pet', payload: petId });
  }, []);

  const addActivity = useCallback((payload: Omit<Activity, 'id'>) => {
    dispatch({ type: 'add-activity', payload: { ...payload, id: nanoid() } });
  }, []);

  const addJournalEntry = useCallback((payload: Omit<JournalEntry, 'id'>) => {
    dispatch({ type: 'add-journal-entry', payload: { ...payload, id: nanoid() } });
  }, []);

  const addReminder = useCallback((payload: Omit<Reminder, 'id'>) => {
    dispatch({ type: 'add-reminder', payload: { ...payload, id: nanoid() } });
  }, []);

  const updateActivity = useCallback((payload: { id: string; updates: Partial<Omit<Activity, 'id'>> }) => {
    dispatch({ type: 'update-activity', payload });
  }, []);

  const deleteActivity = useCallback((id: string) => {
    dispatch({ type: 'delete-activity', payload: { id } });
  }, []);

  const updateJournalEntry = useCallback(
    (payload: { id: string; updates: Partial<Omit<JournalEntry, 'id'>> }) => {
      dispatch({ type: 'update-journal-entry', payload });
    },
    [],
  );

  const deleteJournalEntry = useCallback((id: string) => {
    dispatch({ type: 'delete-journal-entry', payload: { id } });
  }, []);

  const updateReminder = useCallback((payload: { id: string; updates: Partial<Omit<Reminder, 'id'>> }) => {
    dispatch({ type: 'update-reminder', payload });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    dispatch({ type: 'delete-reminder', payload: { id } });
  }, []);

  const addPet = useCallback((payload: Omit<Pet, 'id'>) => {
    dispatch({ type: 'add-pet', payload: { ...payload, id: nanoid() } });
  }, []);

  const updatePet = useCallback((payload: Pet) => {
    dispatch({ type: 'update-pet', payload });
  }, []);

  const deletePet = useCallback((petId: PetId) => {
    dispatch({ type: 'delete-pet', payload: petId });
  }, []);

  const addHealthRecord = useCallback(
    (payload: { petId: PetId; record: Omit<HealthRecord, 'id'> }) => {
      dispatch({
        type: 'add-health-record',
        payload: {
          petId: payload.petId,
          record: { ...payload.record, id: nanoid() },
        },
      });
    },
    [],
  );

  const updateHealthRecord = useCallback(
    (payload: { petId: PetId; recordId: string; updates: Partial<Omit<HealthRecord, 'id'>> }) => {
      dispatch({ type: 'update-health-record', payload });
    },
    [],
  );

  const deleteHealthRecord = useCallback((payload: { petId: PetId; recordId: string }) => {
    dispatch({ type: 'delete-health-record', payload });
  }, []);

  const completeActionAndGrantXP = useCallback((xp: number) => {
    dispatch({ type: 'grant-xp', payload: xp });
  }, []);

  const updatePreferences = useCallback((prefs: Partial<PreferencesState>) => {
    dispatch({ type: 'update-preferences', payload: prefs });
  }, []);

  const value = useMemo<AppStateContextValue>(() => {
    const selectedPet = state.pets.find((pet) => pet.id === state.selectedPetId);
    return {
      ...state,
      selectedPet,
      setSelectedPet,
      addActivity,
      addJournalEntry,
      updateActivity,
      deleteActivity,
      updateJournalEntry,
      deleteJournalEntry,
      addReminder,
      updateReminder,
      deleteReminder,
      addPet,
      updatePet,
      deletePet,
      addHealthRecord,
      updateHealthRecord,
      deleteHealthRecord,
      completeActionAndGrantXP,
      updatePreferences,
    };
  }, [
    state,
    setSelectedPet,
    addActivity,
    addJournalEntry,
    addReminder,
    addPet,
    updateActivity,
    deleteActivity,
    updateJournalEntry,
    deleteJournalEntry,
    updateReminder,
    deleteReminder,
    updatePet,
    deletePet,
    addHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    completeActionAndGrantXP,
    updatePreferences,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppStateContext = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppStateContext must be used within AppStateProvider');
  }
  return context;
};

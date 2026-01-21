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
import { addDays, parseISO, startOfDay } from 'date-fns';
import { nanoid } from 'nanoid';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';

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
import { fetchPets, createPet, updatePetById, deletePetById } from '../lib/api/pets';
import {
  fetchReminders,
  createReminder,
  updateReminderById,
  deleteReminderById,
} from '../lib/api/reminders';
import { fetchActivities, createActivity, updateActivityById, deleteActivityById } from '../lib/api/activities';
import {
  fetchJournalEntries,
  createJournalEntry,
  updateJournalEntryById,
  deleteJournalEntryById,
} from '../lib/api/journal';

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
  email: '',
  dailyReminders: true,
  activityNotifications: true,
  profileVisibility: true,
  shareDataWithFriends: false,
};

const buildAchievementState = (): AchievementProgress[] => [];

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

const STORAGE_KEY = 'pups-rec-state-v2';

const loadPersistedState = (): AppState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AppState;
  } catch (error) {
    console.warn('Failed to parse saved state', error);
    return null;
  }
};

const baseState: AppState = {
  pets: [],
  selectedPetId: '',
  activities: [],
  journalEntries: [],
  reminders: [],
  achievements: buildAchievementState(),
  xp: 0,
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
  setSelectedPet: (petId: PetId) => Promise<void>;
  isOnboarded: boolean;
  requirePet: () => void;
  addActivity: (payload: Omit<Activity, 'id'>) => Promise<void>;
  updateActivity: (payload: { id: string; updates: Partial<Omit<Activity, 'id'>> }) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  addJournalEntry: (payload: Omit<JournalEntry, 'id'>) => Promise<void>;
  updateJournalEntry: (payload: { id: string; updates: Partial<Omit<JournalEntry, 'id'>> }) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  addReminder: (payload: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (payload: { id: string; updates: Partial<Omit<Reminder, 'id'>> }) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  addPet: (payload: Omit<Pet, 'id'>) => Promise<Pet>;
  updatePet: (payload: Pet) => Promise<void>;
  deletePet: (petId: PetId) => Promise<void>;
  addHealthRecord: (payload: { petId: PetId; record: Omit<HealthRecord, 'id'> }) => Promise<void>;
  updateHealthRecord: (payload: {
    petId: PetId;
    recordId: string;
    updates: Partial<Omit<HealthRecord, 'id'>>;
  }) => Promise<void>;
  deleteHealthRecord: (payload: { petId: PetId; recordId: string }) => Promise<void>;
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

  const isOnboarded = state.pets.length > 0;

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

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) return;
      try {
        const pets = await fetchPets(user.id);
        if (!active) return;
        const existingSelected = state.selectedPetId;
        const selectedPetId =
          (existingSelected && pets.some((pet) => pet.id === existingSelected) && existingSelected) ||
          (user?.selectedPetId && pets.some((pet) => pet.id === user.selectedPetId) && user.selectedPetId) ||
          pets[0]?.id ||
          '';

        if (!selectedPetId) {
          dispatch({
            type: 'hydrate',
            payload: {
              ...state,
              pets,
              selectedPetId: '',
              activities: [],
              journalEntries: [],
              reminders: [],
            },
          });
          return;
        }

        const [activities, journalEntries, reminders] = await Promise.all([
          fetchActivities(user.id, selectedPetId),
          fetchJournalEntries(user.id, selectedPetId),
          fetchReminders(user.id, selectedPetId),
        ]);
        if (!active) return;
        const nextState = addAchievementXp({
          pets,
          selectedPetId,
          activities: sortActivities(activities),
          journalEntries: sortJournal(journalEntries),
          reminders,
          achievements: buildAchievementState(),
          xp: state.xp,
          preferences: state.preferences,
        });
        dispatch({
          type: 'hydrate',
          payload: nextState,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load Supabase data', error);
      }
    };
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, state.selectedPetId]);

  const setSelectedPet = useCallback(
    async (petId: PetId) => {
    dispatch({ type: 'set-selected-pet', payload: petId });
      if (user?.id && supabaseConfigured && supabase) {
        try {
          await supabase.auth.updateUser({ data: { selectedPetId: petId } });
        } catch (error) {
          console.warn('Failed to persist selected pet', error);
        }
      }
    },
    [user?.id],
  );

  const requirePet = useCallback(() => {
    if (!state.selectedPetId) {
      throw new Error('Select a pet first.');
    }
  }, [state.selectedPetId]);

  const addActivity = useCallback(
    async (payload: Omit<Activity, 'id'>) => {
      const petId = payload.petId ?? state.selectedPetId;
      if (!petId) {
        throw new Error('Select a pet first.');
      }
      if (!user?.id) {
        dispatch({ type: 'add-activity', payload: { ...payload, petId, id: nanoid() } });
        return;
      }
      const created = await createActivity({ ...payload, petId, userId: user.id });
      dispatch({ type: 'add-activity', payload: created });
    },
    [state.selectedPetId, user?.id],
  );

  const addJournalEntry = useCallback(
    async (payload: Omit<JournalEntry, 'id'>) => {
      const petId = payload.petId ?? state.selectedPetId;
      if (!petId) {
        throw new Error('Select a pet first.');
      }
      if (!user?.id) {
        dispatch({ type: 'add-journal-entry', payload: { ...payload, petId, id: nanoid() } });
        return;
      }
      const created = await createJournalEntry({ ...payload, petId, userId: user.id });
      dispatch({ type: 'add-journal-entry', payload: created });
    },
    [state.selectedPetId, user?.id],
  );

  const addReminder = useCallback(
    async (payload: Omit<Reminder, 'id'>) => {
      const petId = payload.petId ?? state.selectedPetId;
      if (!petId) {
        throw new Error('Select a pet first.');
      }
      if (!user?.id) {
        dispatch({ type: 'add-reminder', payload: { ...payload, petId, id: nanoid() } });
        return;
      }
      const created = await createReminder(user.id, { ...payload, petId });
      dispatch({ type: 'add-reminder', payload: created });
    },
    [state.selectedPetId, user?.id],
  );

  const updateActivity = useCallback(
    async (payload: { id: string; updates: Partial<Omit<Activity, 'id'>> }) => {
      if (!user?.id) {
    dispatch({ type: 'update-activity', payload });
        return;
      }
      const updated = await updateActivityById(payload.id, payload.updates);
      dispatch({ type: 'update-activity', payload: { id: payload.id, updates: updated } });
    },
    [user?.id],
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      if (user?.id) {
        await deleteActivityById(id);
      }
    dispatch({ type: 'delete-activity', payload: { id } });
    },
    [user?.id],
  );

  const updateJournalEntry = useCallback(
    async (payload: { id: string; updates: Partial<Omit<JournalEntry, 'id'>> }) => {
      if (!user?.id) {
      dispatch({ type: 'update-journal-entry', payload });
        return;
      }
      const updated = await updateJournalEntryById(payload.id, payload.updates);
      dispatch({ type: 'update-journal-entry', payload: { id: payload.id, updates: updated } });
    },
    [user?.id],
  );

  const deleteJournalEntry = useCallback(
    async (id: string) => {
      if (user?.id) {
        await deleteJournalEntryById(id);
      }
    dispatch({ type: 'delete-journal-entry', payload: { id } });
    },
    [user?.id],
  );

  const updateReminder = useCallback(
    async (payload: { id: string; updates: Partial<Omit<Reminder, 'id'>> }) => {
      if (!user?.id) {
    dispatch({ type: 'update-reminder', payload });
        return;
      }
      const updated = await updateReminderById(payload.id, payload.updates);
      dispatch({ type: 'update-reminder', payload: { id: payload.id, updates: updated } });
    },
    [user?.id],
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      if (user?.id) {
        await deleteReminderById(id);
      }
    dispatch({ type: 'delete-reminder', payload: { id } });
    },
    [user?.id],
  );

  const addPet = useCallback(
    async (payload: Omit<Pet, 'id'>) => {
      if (!user?.id) {
        const id = nanoid();
        const added = { ...payload, id };
        dispatch({ type: 'add-pet', payload: added });
        return added as Pet;
      }
      const created = await createPet(user.id, payload);
      dispatch({ type: 'add-pet', payload: created });
      return created;
    },
    [user?.id],
  );

  const updatePet = useCallback(
    async (payload: Pet) => {
      if (!user?.id) {
    dispatch({ type: 'update-pet', payload });
        return;
      }
      const updated = await updatePetById(payload.id, payload);
      dispatch({ type: 'update-pet', payload: updated });
    },
    [user?.id],
  );

  const deletePet = useCallback(
    async (petId: PetId) => {
      if (user?.id) {
        await deletePetById(petId);
      }
    dispatch({ type: 'delete-pet', payload: petId });
    },
    [user?.id],
  );

  const addHealthRecord = useCallback(
    async (payload: { petId: PetId; record: Omit<HealthRecord, 'id'> }) => {
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
    async (payload: { petId: PetId; recordId: string; updates: Partial<Omit<HealthRecord, 'id'>> }) => {
      dispatch({ type: 'update-health-record', payload });
    },
    [],
  );

  const deleteHealthRecord = useCallback(async (payload: { petId: PetId; recordId: string }) => {
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
      isOnboarded,
      requirePet,
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
    isOnboarded,
    requirePet,
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

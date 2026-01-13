import type { Activity } from '../../types';
import { supabase } from '../supabaseClient';

const mapActivity = (row: any): Activity => ({
  id: row.id,
  petId: row.pet_id,
  type: row.type,
  date: row.date,
  durationMinutes: row.duration_minutes ?? undefined,
  distanceKm: row.distance_km ?? undefined,
  notes: row.notes ?? '',
  photoUrl: row.photo_url ?? '',
});

export const fetchActivities = async (userId: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapActivity);
};

export const createActivity = async (payload: Omit<Activity, 'id'> & { userId: string }) => {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: payload.userId,
      pet_id: payload.petId,
      type: payload.type,
      date: payload.date,
      duration_minutes: payload.durationMinutes ?? null,
      distance_km: payload.distanceKm ?? null,
      notes: payload.notes,
      photo_url: payload.photoUrl,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapActivity(data);
};

export const updateActivityById = async (id: string, updates: Partial<Omit<Activity, 'id' | 'petId'>>) => {
  const { data, error } = await supabase
    .from('activities')
    .update({
      type: updates.type,
      date: updates.date,
      duration_minutes: updates.durationMinutes ?? null,
      distance_km: updates.distanceKm ?? null,
      notes: updates.notes,
      photo_url: updates.photoUrl,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapActivity(data);
};

export const deleteActivityById = async (id: string) => {
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
};

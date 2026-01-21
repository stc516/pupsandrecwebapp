import type { Activity } from '../../types';
import { getSupabaseClient } from '../supabaseClient';

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

export const fetchActivities = async (userId: string, petId?: string): Promise<Activity[]> => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId);
  if (petId) {
    query = query.eq('pet_id', petId);
  }
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapActivity);
};

export const createActivity = async (payload: Omit<Activity, 'id'> & { userId: string }) => {
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
};

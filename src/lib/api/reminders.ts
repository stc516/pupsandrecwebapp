import { getSupabaseClient } from '../supabaseClient';
import type { Reminder } from '../../types';

const mapReminder = (row: any): Reminder => ({
  id: row.id,
  petId: row.pet_id,
  type: row.type,
  title: row.title,
  dateTime: row.dateTime ?? row.date_time ?? row.date ?? '',
  recurrence: row.recurrence ?? undefined,
});

export const fetchReminders = async (userId: string, petId?: string) => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId);
  if (petId) {
    query = query.eq('pet_id', petId);
  }
  const { data, error } = await query.order('date_time', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapReminder);
};

export const createReminder = async (userId: string, payload: Omit<Reminder, 'id'>) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reminders')
    .insert([
      {
        user_id: userId,
        pet_id: payload.petId,
        type: payload.type,
        title: payload.title,
        date_time: payload.dateTime,
        recurrence: payload.recurrence ?? null,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return mapReminder(data);
};

export const updateReminderById = async (id: string, updates: Partial<Omit<Reminder, 'id'>>) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reminders')
    .update({
      pet_id: updates.petId,
      type: updates.type,
      title: updates.title,
      date_time: updates.dateTime,
      recurrence: updates.recurrence ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapReminder(data);
};

export const deleteReminderById = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) throw error;
};

import type { JournalEntry } from '../../types';
import { getSupabaseClient } from '../supabaseClient';

const mapEntry = (row: any): JournalEntry => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  title: row.title,
  content: row.content,
  tags: row.tags ?? [],
  category: row.category,
  photoUrl: row.photo_url ?? '',
});

export const fetchJournalEntries = async (userId: string, petId?: string): Promise<JournalEntry[]> => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId);
  if (petId) {
    query = query.eq('pet_id', petId);
  }
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapEntry);
};

export const createJournalEntry = async (payload: Omit<JournalEntry, 'id'> & { userId: string }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: payload.userId,
      pet_id: payload.petId,
      date: payload.date,
      title: payload.title,
      content: payload.content,
      tags: payload.tags,
      category: payload.category,
      photo_url: payload.photoUrl,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapEntry(data);
};

export const updateJournalEntryById = async (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'petId'>>) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('journal_entries')
    .update({
      date: updates.date,
      title: updates.title,
      content: updates.content,
      tags: updates.tags,
      category: updates.category,
      photo_url: updates.photoUrl,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapEntry(data);
};

export const deleteJournalEntryById = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
};

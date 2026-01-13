import { supabase } from '../supabaseClient';
import type { Pet } from '../../types';

const mapPet = (row: any): Pet => ({
  id: row.id,
  name: row.name,
  breed: row.breed ?? '',
  ageYears: row.age_years ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
  notes: row.notes ?? '',
  healthRecords: row.health_records ?? [],
});

export const fetchPets = async (userId: string) => {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPet);
};

export const createPet = async (userId: string, payload: Omit<Pet, 'id' | 'healthRecords'>) => {
  const { data, error } = await supabase
    .from('pets')
    .insert([
      {
        user_id: userId,
        name: payload.name,
        breed: payload.breed,
        age_years: payload.ageYears ?? null,
        avatar_url: payload.avatarUrl ?? null,
        notes: payload.notes ?? null,
        health_records: [],
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return mapPet(data);
};

export const updatePetById = async (id: string, updates: Partial<Omit<Pet, 'id' | 'healthRecords'>>) => {
  const { data, error } = await supabase
    .from('pets')
    .update({
      name: updates.name,
      breed: updates.breed,
      age_years: updates.ageYears ?? null,
      avatar_url: updates.avatarUrl ?? null,
      notes: updates.notes ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapPet(data);
};

export const deletePetById = async (id: string) => {
  const { error } = await supabase.from('pets').delete().eq('id', id);
  if (error) throw error;
};

import type { Activity } from '../types';

export const activities: Activity[] = [
  {
    id: 'act-1',
    petId: 'bailey',
    type: 'walk',
    date: new Date().toISOString(),
    durationMinutes: 45,
    distanceKm: 4.2,
    notes: 'Leisurely loop around the lakeshore with plenty of sniff stops.',
    photoUrl:
      'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'act-2',
    petId: 'meiomi',
    type: 'training',
    date: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    durationMinutes: 30,
    notes: 'Agility ladder reps + scent box game – super focused today.',
  },
  {
    id: 'act-3',
    petId: 'bailey',
    type: 'park',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    durationMinutes: 60,
    notes: 'Met up with the weekend pack at Riverdale dog park.',
  },
];

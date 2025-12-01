import type { Reminder } from '../types';

export const reminders: Reminder[] = [
  {
    id: 'rem-1',
    petId: 'bailey',
    type: 'walk',
    title: 'Evening river walk',
    dateTime: (() => {
      const date = new Date();
      date.setHours(18, 0, 0, 0);
      return date.toISOString();
    })(),
  },
  {
    id: 'rem-2',
    petId: 'meiomi',
    type: 'vet-appointment',
    title: 'Heartworm checkup',
    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'rem-3',
    petId: 'meiomi',
    type: 'medication',
    title: 'Monthly flea + tick preventative',
    dateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

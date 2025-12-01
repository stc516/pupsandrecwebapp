import type { JournalEntry } from '../types';

export const journalEntries: JournalEntry[] = [
  {
    id: 'jrnl-1',
    petId: 'bailey',
    date: new Date().toISOString(),
    title: 'Sunrise River Walk',
    content:
      'Bailey trotted proudly beside me as the sun came up over the Mississippi. She found the perfect stick and carried it the entire route.',
    tags: ['walk', 'sunrise', 'happy'],
    category: 'Walk',
    photoUrl:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jrnl-2',
    petId: 'meiomi',
    date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    title: 'Agility Course Win',
    content:
      'Meiomi zoomed through the tunnel and nailed the weave poles. Coach said she is ready for the winter fun run.',
    tags: ['training', 'agility'],
    category: 'Training',
  },
  {
    id: 'jrnl-3',
    petId: 'meiomi',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    title: 'Cozy Rainy Day',
    content:
      'Rainy afternoon journaling session. Snuggles on the couch with a puzzle toy and lo-fi beats.',
    tags: ['calm', 'home'],
    category: 'Other',
  },
];

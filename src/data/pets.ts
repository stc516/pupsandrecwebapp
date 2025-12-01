import type { Pet } from '../types';

export const pets: Pet[] = [
  {
    id: 'bailey',
    name: 'Bailey',
    breed: 'Golden Retriever',
    ageYears: 4,
    avatarUrl:
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=400&q=80',
    notes: 'Loves morning walks along the river trail and chasing tennis balls.',
    healthRecords: [
      {
        id: 'bailey-hr-1',
        date: '2025-10-15',
        type: 'vet-visit',
        description: 'Annual wellness exam – everything looked great.',
      },
      {
        id: 'bailey-hr-2',
        date: '2025-09-01',
        type: 'medication',
        description: 'Monthly heartworm preventative dose.',
      },
    ],
  },
  {
    id: 'meiomi',
    name: 'Meiomi',
    breed: 'Australian Shepherd',
    ageYears: 2,
    avatarUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    notes: 'High-energy adventure buddy who loves agility drills and puzzle toys.',
    healthRecords: [
      {
        id: 'meiomi-hr-1',
        date: '2025-11-05',
        type: 'vaccine',
        description: 'DHPP booster administered at neighborhood vet.',
      },
      {
        id: 'meiomi-hr-2',
        date: '2025-08-18',
        type: 'injury',
        description: 'Minor paw pad scrape – healed with ointment in 3 days.',
      },
    ],
  },
];

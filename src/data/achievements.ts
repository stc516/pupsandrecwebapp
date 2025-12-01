import type { Achievement } from '../types';

export const achievements: Achievement[] = [
  {
    id: 'achv-1',
    title: 'First Walk Logged',
    description: 'Log your very first walk with any pup.',
    icon: 'paw-print',
    xpReward: 25,
    conditionType: 'first-walk',
    threshold: 1,
  },
  {
    id: 'achv-2',
    title: 'Storyteller',
    description: 'Capture five journal entries to reflect on adventures.',
    icon: 'book-open',
    xpReward: 40,
    conditionType: 'journal-count',
    threshold: 5,
  },
  {
    id: 'achv-3',
    title: 'Weekly Explorer',
    description: 'Log seven activities in a single week.',
    icon: 'map',
    xpReward: 60,
    conditionType: 'activities-count',
    threshold: 7,
  },
  {
    id: 'achv-4',
    title: 'Photo Flair',
    description: 'Add photos to three activities or journal entries.',
    icon: 'camera',
    xpReward: 30,
    conditionType: 'photos-uploaded',
    threshold: 3,
  },
];

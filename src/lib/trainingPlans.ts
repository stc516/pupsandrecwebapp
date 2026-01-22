import type { PlanDay, PlanTask, TrainingPlan } from '../types';

type PlanDefinition = Omit<TrainingPlan, 'days'> & {
  weekThemes: {
    focus: string;
    tasks: Array<{
      title: string;
      minutes: number;
      category: PlanTask['category'];
      proofing?: string[];
      notes?: string;
    }>;
  }[];
};

const proofingSets = [
  ['living room', 'hallway'],
  ['front yard', 'sidewalk'],
  ['quiet park', 'driveway'],
  ['pet-friendly store', 'busy sidewalk'],
  ['backyard', 'parking lot'],
];

const buildTasks = (
  planId: string,
  day: number,
  templates: PlanDefinition['weekThemes'][number]['tasks'],
): PlanTask[] =>
  templates.map((task, index) => ({
    id: `${planId}-day${day}-task${index + 1}`,
    title: task.title,
    minutes: task.minutes,
    category: task.category,
    proofing: task.proofing ?? proofingSets[(day - 1) % proofingSets.length],
    notes: task.notes,
  }));

const buildDays = (plan: PlanDefinition): PlanDay[] =>
  Array.from({ length: plan.durationDays }, (_, index) => {
    const day = index + 1;
    const weekTheme = plan.weekThemes[Math.floor(index / 7)] ?? plan.weekThemes[plan.weekThemes.length - 1];
    return {
      day,
      focus: weekTheme.focus,
      tasks: buildTasks(plan.id, day, weekTheme.tasks),
    };
  });

const planDefinitions: PlanDefinition[] = [
  {
    id: 'puppy-essentials',
    title: 'Puppy Essentials',
    description:
      'A gentle two-week ramp into sit, down, and polite leash walking with daily proofing across distance, duration, and distraction.',
    durationDays: 14,
    difficulty: 'Beginner',
    milestones: {
      distance: '5–10 ft focus around mild distractions',
      duration: '30–45 sec sit/down stays',
      distraction: 'Calm greetings with toys + light noise',
    },
    weekThemes: [
      {
        focus: 'Foundations & focus',
        tasks: [
          {
            title: 'Name game + eye contact',
            minutes: 5,
            category: 'focus',
            notes: 'Add distance and duration before distractions.',
          },
          {
            title: 'Sit & down reps',
            minutes: 7,
            category: 'obedience',
            notes: 'Reward calm positions. Short, upbeat sets.',
          },
          {
            title: 'Loose leash intro',
            minutes: 8,
            category: 'leash',
            notes: 'Work near home with low distractions.',
          },
        ],
      },
      {
        focus: 'Proofing the basics',
        tasks: [
          {
            title: 'Stay + release word',
            minutes: 8,
            category: 'obedience',
            notes: 'Increase duration first, then distance.',
          },
          {
            title: 'Leash walking with turns',
            minutes: 10,
            category: 'leash',
            notes: 'Add gentle distractions (people or bikes).',
          },
          {
            title: 'Friendly socialization',
            minutes: 6,
            category: 'socialization',
            notes: 'Short exposures, end on a calm note.',
          },
        ],
      },
    ],
  },
  {
    id: 'basic-obedience',
    title: 'Basic Obedience',
    description:
      'Four weeks of structured obedience and leash skills with progressive 3‑D proofing and confidence building.',
    durationDays: 28,
    difficulty: 'Intermediate',
    milestones: {
      distance: '20–30 ft recalls with light distractions',
      duration: '2–3 min stay on mat',
      distraction: 'Consistent focus around other dogs',
    },
    weekThemes: [
      {
        focus: 'Week 1: Focus + positions',
        tasks: [
          { title: 'Marker timing + name response', minutes: 6, category: 'focus' },
          { title: 'Sit, down, stand transitions', minutes: 10, category: 'obedience' },
          { title: 'Loose leash in low distraction', minutes: 10, category: 'leash' },
        ],
      },
      {
        focus: 'Week 2: Stay + recall',
        tasks: [
          { title: 'Stay with duration', minutes: 8, category: 'obedience' },
          { title: 'Recall games + jackpot', minutes: 10, category: 'focus' },
          { title: 'Leash walking past mild distractions', minutes: 10, category: 'leash' },
        ],
      },
      {
        focus: 'Week 3: Impulse control',
        tasks: [
          { title: 'Leave it + drop', minutes: 10, category: 'obedience' },
          { title: 'Mat settle', minutes: 10, category: 'focus' },
          { title: 'Greeting manners', minutes: 8, category: 'socialization' },
        ],
      },
      {
        focus: 'Week 4: Real-world proofing',
        tasks: [
          { title: 'Recall with distance + distractions', minutes: 10, category: 'focus' },
          { title: 'Heel basics + turns', minutes: 10, category: 'leash' },
          { title: 'Stay around movement', minutes: 8, category: 'obedience' },
        ],
      },
    ],
  },
  {
    id: 'walk-like-a-pro',
    title: 'Walk Like a Pro',
    description:
      'Three weeks of polished leash walking with distance, duration, and distraction upgrades each week.',
    durationDays: 21,
    difficulty: 'Intermediate',
    milestones: {
      distance: '40–60 ft loose leash stretches',
      duration: '15 min consistent loose leash',
      distraction: 'Passing dogs + traffic without pulling',
    },
    weekThemes: [
      {
        focus: 'Week 1: Engagement on the leash',
        tasks: [
          { title: 'Check-ins + reward zone', minutes: 8, category: 'focus' },
          { title: 'Loose leash in quiet area', minutes: 12, category: 'leash' },
          { title: 'Pivot turns + pace changes', minutes: 8, category: 'leash' },
        ],
      },
      {
        focus: 'Week 2: Distance & distractions',
        tasks: [
          { title: 'Loose leash past mild distractions', minutes: 15, category: 'leash' },
          { title: 'Auto-sit at crossings', minutes: 8, category: 'obedience' },
          { title: 'Focus games in new environments', minutes: 8, category: 'focus' },
        ],
      },
      {
        focus: 'Week 3: Real-world polish',
        tasks: [
          { title: 'Walk with variable pace', minutes: 15, category: 'leash' },
          { title: 'Leave it + pass-by practice', minutes: 10, category: 'focus' },
          { title: 'Reward calm greetings', minutes: 8, category: 'socialization' },
        ],
      },
    ],
  },
];

export const TRAINING_PLANS: TrainingPlan[] = planDefinitions.map((plan) => ({
  ...plan,
  days: buildDays(plan),
}));

import type { PlanDay, PlanTask, TrainingPlan } from '../types';

type PlanTaskTemplate = Omit<PlanTask, 'id'>;

type PlanDefinition = Omit<TrainingPlan, 'days'> & {
  dayFocuses: string[];
  baseTasks: PlanTaskTemplate[];
};

const proofingSets = [
  ['living room', 'kitchen', 'backyard'],
  ['front yard', 'quiet sidewalk', 'driveway'],
  ['park', 'busy sidewalk', 'pet store'],
];

const buildTasks = (planId: string, day: number, focus: string, baseTasks: PlanTaskTemplate[]): PlanTask[] => {
  return baseTasks.map((task, index) => ({
    ...task,
    id: `${planId}-day-${day}-task-${index + 1}`,
    title: task.title.replace('{focus}', focus),
  }));
};

const buildDays = (plan: PlanDefinition): PlanDay[] => {
  return plan.dayFocuses.map((focus, index) => {
    const dayNumber = index + 1;
    return {
      day: dayNumber,
      focus,
      tasks: buildTasks(plan.id, dayNumber, focus, plan.baseTasks),
    };
  });
};

const puppyEssentials: PlanDefinition = {
  id: 'puppy-essentials',
  title: 'Puppy Essentials',
  description: 'Build the foundations: name, focus, and calm manners.',
  durationDays: 14,
  difficulty: 'Beginner',
  milestones: {
    distance: 'Close range focus and recall',
    duration: 'Short, consistent sessions',
    distraction: 'Low to moderate household distractions',
  },
  dayFocuses: [
    'Name game + attention',
    'Sit + release',
    'Down + settle',
    'Leash intro',
    'Recall basics',
    'Handling & grooming calm',
    'Drop it',
    'Leave it',
    'Doorway manners',
    'Loose leash warm-up',
    'Polite greetings',
    'Bite inhibition',
    'Proofing walk',
    'Review + celebration',
  ],
  baseTasks: [
    {
      title: '{focus} practice',
      minutes: 10,
      category: 'obedience',
      proofing: proofingSets[0],
      notes: 'Keep distance close and sessions upbeat.',
    },
    {
      title: 'Reward calm focus',
      minutes: 5,
      category: 'focus',
      proofing: proofingSets[0],
      notes: 'Short duration, increase distractions slowly.',
    },
    {
      title: 'Gentle play + settle',
      minutes: 8,
      category: 'socialization',
      proofing: proofingSets[1],
      notes: 'End with calm to build duration.',
    },
  ],
};

const basicObedience: PlanDefinition = {
  id: 'basic-obedience',
  title: 'Basic Obedience',
  description: 'Create reliable cues with distance, duration, and distraction.',
  durationDays: 28,
  difficulty: 'Beginner',
  milestones: {
    distance: '3–6 feet on core cues',
    duration: '30–60 seconds on stays',
    distraction: 'Moderate distractions outdoors',
  },
  dayFocuses: [
    'Sit + down refresh',
    'Leash manners',
    'Recall games',
    'Place/bed cue',
    'Impulse control',
    'Focus around distractions',
    'Review + walk practice',
    'Stay duration',
    'Heel foundations',
    'Recall with distance',
    'Leave it in motion',
    'Loose leash in public',
    'Calm greetings',
    'Review + play',
    'Distance stays',
    'Heel with turns',
    'Drop it + trade',
    'Place with distractions',
    'Recall at the park',
    'Focus in busy areas',
    'Review + reward',
    'Sit/down with distance',
    'Longer stays',
    'Heel in busier spots',
    'Recall under distraction',
    'Polite greetings',
    'Handler check-ins',
    'Graduation walk',
  ],
  baseTasks: [
    {
      title: '{focus} reps',
      minutes: 12,
      category: 'obedience',
      proofing: proofingSets[1],
      notes: 'Increase distance first, then duration.',
    },
    {
      title: 'Distraction drills',
      minutes: 8,
      category: 'focus',
      proofing: proofingSets[2],
      notes: 'Add one distraction at a time.',
    },
    {
      title: 'Leash walk practice',
      minutes: 10,
      category: 'leash',
      proofing: proofingSets[1],
      notes: 'Reward near your leg, short sessions.',
    },
  ],
};

const walkLikeAPro: PlanDefinition = {
  id: 'walk-like-a-pro',
  title: 'Walk Like a Pro',
  description: 'Transform walks into calm, confident outings.',
  durationDays: 21,
  difficulty: 'Intermediate',
  milestones: {
    distance: 'Longer walks without pulling',
    duration: 'Sustained loose leash pace',
    distraction: 'High-distraction environments',
  },
  dayFocuses: [
    'Leash handling basics',
    'Loose leash turns',
    'Engagement check-ins',
    'Stop/start technique',
    'U-turn recovery',
    'Reward zone',
    'Review walk',
    'Distraction exposure',
    'Passing dogs',
    'Squirrel drill',
    'Longer walks',
    'Impulse control',
    'Crosswalk manners',
    'Review walk',
    'Distance + duration',
    'Trail etiquette',
    'Consistency reps',
    'Public space confidence',
    'Proofing',
    'Solo walk',
    'Celebrate + review',
  ],
  baseTasks: [
    {
      title: '{focus} reps',
      minutes: 12,
      category: 'leash',
      proofing: proofingSets[1],
      notes: 'Reward for staying in your zone.',
    },
    {
      title: 'Distraction resilience',
      minutes: 8,
      category: 'focus',
      proofing: proofingSets[2],
      notes: 'Increase distractions after success.',
    },
    {
      title: 'Confidence walk',
      minutes: 10,
      category: 'socialization',
      proofing: proofingSets[2],
      notes: 'Keep sessions positive and calm.',
    },
  ],
};

const planDefinitions: PlanDefinition[] = [puppyEssentials, basicObedience, walkLikeAPro];

export const TRAINING_PLANS: TrainingPlan[] = planDefinitions.map((plan) => ({
  ...plan,
  days: buildDays(plan),
}));

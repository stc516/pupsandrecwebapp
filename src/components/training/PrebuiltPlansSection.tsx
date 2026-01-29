import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import { TagChip } from '../ui/Tag';
import { useAppState } from '../../hooks/useAppState';
import { useTrainingPlan } from '../../context/TrainingPlanContext';
import { TRAINING_PLANS } from '../../lib/trainingPlans';
import { PlanPreviewModal } from './PlanPreviewModal';
import { getPlanDayForDate, getPlanDayNumberForDate } from './trainingPlanSelectors';

export const PrebuiltPlansSection = () => {
  const { selectedPetId, selectedPet } = useAppState();
  const { getPlanForPet, startPlan, resetPlan, restartPlan, toggleTask, completeDay } = useTrainingPlan();
  const [previewPlanId, setPreviewPlanId] = useState<string | null>(null);

  const planInfo = useMemo(() => {
    if (!selectedPetId) return null;
    return getPlanForPet(selectedPetId);
  }, [getPlanForPet, selectedPetId]);

  const activePlan = planInfo?.plan ?? null;
  const petState = planInfo?.petState ?? {
    activePlanId: null,
    startDateISO: null,
    completedDayNumbers: [],
    completedTaskIds: [],
    streak: { current: 0, best: 0, lastCompletedISO: null },
  };
  const todayPlanDay = activePlan && petState?.startDateISO
    ? getPlanDayForDate(activePlan, petState.startDateISO, new Date())
    : null;
  const todayPlanDayNumber = activePlan && petState?.startDateISO
    ? getPlanDayNumberForDate(activePlan, petState.startDateISO, new Date())
    : null;

  const progressRatio = activePlan && petState
    ? Math.min(1, petState.completedDayNumbers.length / activePlan.durationDays)
    : 0;

  const allTasksDone = todayPlanDay
    ? todayPlanDay.tasks.every((task) => petState?.completedTaskIds.includes(task.id))
    : false;

  const isPlanComplete = activePlan
    ? petState?.completedDayNumbers.length >= activePlan.durationDays
    : false;

  const previewPlan = previewPlanId ? TRAINING_PLANS.find((plan) => plan.id === previewPlanId) ?? null : null;

  return (
    <section className="space-y-4">
      <Card padding="lg" className="border border-brand-border bg-gradient-to-br from-brand-subtle/70 to-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Training plan</p>
            <h3 className="text-lg font-semibold text-brand-primary">Pre-built plans</h3>
            <p className="text-sm text-text-secondary">
              Choose a plan that matches {selectedPet?.name ?? 'your pup'}’s goals.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-primary">
            <Sparkles size={14} />
            Structured plans
          </span>
        </div>
      </Card>

      {activePlan && petState && (
        <Card padding="lg" className="border border-brand-border bg-white/90">
          {isPlanComplete ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-brand-primary">Plan complete 🎉</p>
              <p className="text-sm text-text-secondary">
                You finished {activePlan.title}. Choose a new plan or restart this one.
              </p>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton onClick={() => selectedPetId && restartPlan(selectedPetId)}>
                  Restart plan
                </PrimaryButton>
                <SecondaryButton onClick={() => selectedPetId && resetPlan(selectedPetId)}>
                  Pick a new plan
                </SecondaryButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Active plan</p>
                  <h3 className="text-lg font-semibold text-brand-primary">{activePlan.title}</h3>
                  <p className="text-xs text-text-secondary">
                    Day {todayPlanDayNumber ?? 1} of {activePlan.durationDays}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => selectedPetId && resetPlan(selectedPetId)}>
                    Reset plan
                  </SecondaryButton>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-brand-border">
                <div
                  className="h-2 rounded-full bg-brand-accent transition-all"
                  style={{ width: `${Math.round(progressRatio * 100)}%` }}
                />
              </div>
              {todayPlanDay ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-brand-primary">Today’s focus: {todayPlanDay.focus}</p>
                  <div className="space-y-2">
                    {todayPlanDay.tasks.map((task) => {
                      const checked = petState.completedTaskIds.includes(task.id);
                      return (
                        <label key={task.id} className="flex items-center gap-2 text-sm text-text-secondary">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => selectedPetId && toggleTask(selectedPetId, task.id)}
                            className="h-4 w-4 rounded border-brand-border text-brand-accent"
                          />
                          <span className={checked ? 'text-brand-primary line-through' : 'text-brand-primary'}>
                            {task.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <PrimaryButton
                    onClick={() =>
                      selectedPetId &&
                      completeDay(selectedPetId, todayPlanDay.day, activePlan.durationDays, allTasksDone)
                    }
                    disabled={!allTasksDone}
                  >
                    Complete Day
                  </PrimaryButton>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No tasks scheduled for today.</p>
              )}
            </div>
          )}
        </Card>
      )}

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {TRAINING_PLANS.map((plan) => (
          <Card key={plan.id} padding="lg" className="min-w-[260px] snap-start border border-brand-border bg-white/90">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-brand-primary">{plan.title}</p>
                <p className="text-xs text-text-secondary">{plan.description}</p>
              </div>
              <TagChip variant="accent">{plan.difficulty}</TagChip>
              <p className="text-xs text-text-secondary">{plan.durationDays} days</p>
              <ul className="text-xs text-text-secondary">
                <li>Distance: {plan.milestones.distance}</li>
                <li>Duration: {plan.milestones.duration}</li>
                <li>Distraction: {plan.milestones.distraction}</li>
              </ul>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton
                  onClick={() => selectedPetId && startPlan(selectedPetId, plan.id)}
                  disabled={!selectedPetId}
                >
                  Start Plan
                </PrimaryButton>
                <SecondaryButton onClick={() => setPreviewPlanId(plan.id)}>Preview</SecondaryButton>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PlanPreviewModal open={Boolean(previewPlan)} plan={previewPlan} onClose={() => setPreviewPlanId(null)} />
    </section>
  );
};

import { useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import { TagChip } from '../ui/Tag';
import { useToast } from '../ui/ToastProvider';
import { useAppState } from '../../hooks/useAppState';
import { useTrainingPlan } from '../../context/TrainingPlanContext';
import { TRAINING_PLANS } from '../../lib/trainingPlans';
import { PlanPreviewModal } from './PlanPreviewModal';

const getDurationLabel = (days: number) => {
  const weeks = Math.round(days / 7);
  return weeks <= 1 ? `${days} days` : `${weeks} weeks`;
};

export const PrebuiltPlansSection = () => {
  const { selectedPetId, selectedPet } = useAppState();
  const { getPetState, startPlan, resetPlan, restartPlan, toggleTask, completeDay } = useTrainingPlan();
  const { pushToast } = useToast();
  const [previewPlan, setPreviewPlan] = useState<(typeof TRAINING_PLANS)[number] | null>(null);

  const petState = getPetState(selectedPetId);
  const activePlan = useMemo(
    () => TRAINING_PLANS.find((plan) => plan.id === petState.activePlanId) ?? null,
    [petState.activePlanId],
  );

  const startDate = petState.startDateISO ? startOfDay(new Date(petState.startDateISO)) : null;
  const today = startOfDay(new Date());
  const rawDayNumber = startDate ? differenceInCalendarDays(today, startDate) + 1 : 1;
  const currentDayNumber = Math.max(1, rawDayNumber);
  const totalDays = activePlan?.durationDays ?? 0;
  const planComplete =
    Boolean(activePlan) && (currentDayNumber > totalDays || petState.completedDayNumbers.length >= totalDays);

  const todaysPlanDay =
    activePlan?.days.find((day) => day.day === Math.min(currentDayNumber, totalDays)) ?? null;
  const tasksComplete = todaysPlanDay
    ? todaysPlanDay.tasks.every((task) => petState.completedTaskIds.includes(task.id))
    : false;
  const dayDateISO = startDate
    ? addDays(startDate, Math.min(currentDayNumber, totalDays) - 1).toISOString()
    : today.toISOString();

  const handleStartPlan = (planId: string) => {
    if (!selectedPetId) {
      pushToast({ tone: 'error', message: 'Select a pet first.' });
      return;
    }
    startPlan(selectedPetId, planId, new Date().toISOString());
  };

  return (
    <section className="space-y-4">
      {activePlan && (
        <Card padding="lg" className="sticky top-24 border border-brand-border bg-white/95 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Active plan</p>
              <h3 className="text-lg font-semibold text-brand-primary">{activePlan.title}</h3>
              <p className="text-xs text-text-muted">
                Day {Math.min(currentDayNumber, totalDays)} of {totalDays}
              </p>
            </div>
            <TagChip variant="accent">{activePlan.difficulty}</TagChip>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-brand-border">
            <div
              className="h-full rounded-full bg-brand-accent transition-all"
              style={{
                width: `${Math.min(100, (petState.completedDayNumbers.length / totalDays) * 100)}%`,
              }}
            />
          </div>

          {!planComplete && todaysPlanDay && (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-brand-primary">{todaysPlanDay.focus}</p>
                <p className="text-xs text-text-muted">Today&apos;s tasks</p>
              </div>
              <div className="space-y-2">
                {todaysPlanDay.tasks.map((task) => (
                  <label key={task.id} className="flex items-start gap-2 rounded-2xl border border-brand-border/70 bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={petState.completedTaskIds.includes(task.id)}
                      onChange={() => selectedPetId && toggleTask(selectedPetId, task.id)}
                      className="mt-1 h-4 w-4 accent-brand-accent"
                    />
                    <div>
                      <p className="font-semibold text-brand-primary">{task.title}</p>
                      <p className="text-xs text-text-muted">{task.minutes} min · {task.category}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton
                  type="button"
                  disabled={!tasksComplete}
                  onClick={() => {
                    if (!selectedPetId || !todaysPlanDay) return;
                    const allowed = completeDay(selectedPetId, todaysPlanDay.day, dayDateISO, todaysPlanDay.tasks.map((task) => task.id));
                    if (!allowed) {
                      pushToast({ tone: 'error', message: 'Check off all tasks before completing the day.' });
                    }
                  }}
                >
                  Complete Day
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => selectedPetId && resetPlan(selectedPetId)}
                >
                  Reset plan
                </SecondaryButton>
              </div>
            </div>
          )}

          {planComplete && (
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <p className="font-semibold text-brand-primary">Plan complete 🎉</p>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={() => selectedPetId && restartPlan(selectedPetId)}>
                  Restart
                </PrimaryButton>
                <SecondaryButton type="button" onClick={() => selectedPetId && resetPlan(selectedPetId)}>
                  Pick a new plan
                </SecondaryButton>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card padding="lg" className="border border-brand-border bg-gradient-to-br from-brand-subtle/70 to-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-primary/70">Training plan</p>
        <h2 className="mt-2 text-2xl font-semibold text-brand-primary">
          {selectedPet?.name ? `${selectedPet.name}'s training` : 'Training plan'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">Quick presets or build your own.</p>

        <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TRAINING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="min-w-[260px] snap-start"
            >
              <Card padding="md" className="h-full space-y-3 border border-brand-border bg-white/90">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-primary">{plan.title}</p>
                    <p className="text-xs text-text-muted">{plan.description}</p>
                  </div>
                  <TagChip variant="accent">{plan.difficulty}</TagChip>
                </div>
                <p className="text-xs font-semibold text-brand-primary">
                  {getDurationLabel(plan.durationDays)}
                </p>
                <ul className="text-xs text-text-secondary">
                  <li>Distance: {plan.milestones.distance}</li>
                  <li>Duration: {plan.milestones.duration}</li>
                  <li>Distraction: {plan.milestones.distraction}</li>
                </ul>
                <div className="flex flex-wrap gap-2 pt-2">
                  <PrimaryButton type="button" onClick={() => handleStartPlan(plan.id)}>
                    Start Plan
                  </PrimaryButton>
                  <SecondaryButton type="button" onClick={() => setPreviewPlan(plan)}>
                    Preview
                  </SecondaryButton>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Card>

      <PlanPreviewModal open={Boolean(previewPlan)} plan={previewPlan} onClose={() => setPreviewPlan(null)} />
    </section>
  );
};

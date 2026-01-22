import { X } from 'lucide-react';

import type { TrainingPlan } from '../../types';
import { Card } from '../ui/Card';
import { SecondaryButton } from '../ui/Button';

export const PlanPreviewModal = ({
  open,
  plan,
  onClose,
}: {
  open: boolean;
  plan: TrainingPlan | null;
  onClose: () => void;
}) => {
  if (!open || !plan) return null;

  const weekCount = Math.ceil(plan.durationDays / 7);
  const weeks = Array.from({ length: weekCount }).map((_, idx) => {
    const start = idx * 7 + 1;
    const end = Math.min(plan.durationDays, start + 6);
    return {
      label: `Week ${idx + 1}`,
      days: plan.days.filter((day) => day.day >= start && day.day <= end).slice(0, 2),
    };
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
      <Card padding="lg" className="w-full max-w-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Training plan</p>
            <h3 className="text-xl font-semibold text-brand-primary">{plan.title}</h3>
            <p className="text-sm text-text-secondary">{plan.description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-text-secondary hover:bg-brand-subtle">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3 text-xs text-brand-primary">
            <p className="font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Distance</p>
            <p className="mt-1 text-sm font-semibold">{plan.milestones.distance}</p>
          </div>
          <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3 text-xs text-brand-primary">
            <p className="font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Duration</p>
            <p className="mt-1 text-sm font-semibold">{plan.milestones.duration}</p>
          </div>
          <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3 text-xs text-brand-primary">
            <p className="font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Distraction</p>
            <p className="mt-1 text-sm font-semibold">{plan.milestones.distraction}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-primary">Weekly breakdown (sample)</h4>
          {weeks.map((week) => (
            <div key={week.label} className="rounded-2xl border border-brand-border bg-white/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">{week.label}</p>
              <div className="mt-2 space-y-2 text-sm text-text-secondary">
                {week.days.map((day) => (
                  <div key={day.day}>
                    <p className="font-semibold text-brand-primary">Day {day.day}: {day.focus}</p>
                    <ul className="ml-4 list-disc text-xs text-text-secondary">
                      {day.tasks.slice(0, 2).map((task) => (
                        <li key={task.id}>{task.title} · {task.minutes} min</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <SecondaryButton type="button" onClick={onClose}>
            Close preview
          </SecondaryButton>
        </div>
      </Card>
    </div>
  );
};

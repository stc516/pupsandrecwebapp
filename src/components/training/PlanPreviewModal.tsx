import { Card } from '../ui/Card';
import type { TrainingPlan } from '../../types';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <Card padding="lg" className="w-full max-w-2xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Plan preview</p>
            <h3 className="text-xl font-semibold text-brand-primary">{plan.title}</h3>
            <p className="text-sm text-text-secondary">{plan.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-brand-primary"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3">
            <p className="text-xs font-semibold uppercase text-text-muted">Distance</p>
            <p className="text-sm font-semibold text-brand-primary">{plan.milestones.distance}</p>
          </div>
          <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3">
            <p className="text-xs font-semibold uppercase text-text-muted">Duration</p>
            <p className="text-sm font-semibold text-brand-primary">{plan.milestones.duration}</p>
          </div>
          <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3">
            <p className="text-xs font-semibold uppercase text-text-muted">Distraction</p>
            <p className="text-sm font-semibold text-brand-primary">{plan.milestones.distraction}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-brand-primary">Sample days</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.days.slice(0, 6).map((day) => (
              <div key={day.day} className="rounded-2xl border border-brand-border bg-white/80 p-3 text-sm">
                <p className="text-xs text-text-muted">Day {day.day}</p>
                <p className="font-semibold text-brand-primary">{day.focus}</p>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                  {day.tasks.slice(0, 2).map((task) => (
                    <li key={task.id}>• {task.title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

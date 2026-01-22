import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { TagChip } from '../../components/ui/Tag';
import { useLaunchHub } from '../../context/LaunchHubContext';
import { PageLayout } from '../../layouts/PageLayout';
import type {
  GrowthExperiment,
  GrowthExperimentStatus,
  LaunchTask,
  LaunchTaskCategory,
  LaunchTaskPriority,
  LaunchTaskStatus,
} from '../../types';

const taskStatusOptions: Array<LaunchTaskStatus | 'all'> = ['all', 'todo', 'doing', 'done', 'archived'];
const experimentStatusOptions: Array<GrowthExperimentStatus | 'all'> = ['all', 'idea', 'running', 'done', 'archived'];

const categoryOptions: LaunchTaskCategory[] = [
  'Ship',
  'Analytics',
  'App Store/PWA',
  'Content',
  'Outbound',
  'Community',
  'Partnerships',
];

const priorityOptions: LaunchTaskPriority[] = ['High', 'Medium', 'Low'];

const statusStyles: Record<string, string> = {
  todo: 'bg-brand-subtle text-text-secondary',
  doing: 'bg-brand-accent/15 text-brand-accent',
  done: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
  idea: 'bg-brand-subtle text-text-secondary',
  running: 'bg-amber-100 text-amber-700',
};

const formatDate = (value?: string) => {
  if (!value) return null;
  try {
    return format(new Date(value), 'MMM d');
  } catch {
    return value;
  }
};

const TaskCard = ({
  task,
  onUpdate,
  onDuplicate,
  onArchive,
  onMarkDone,
}: {
  task: LaunchTask;
  onUpdate: (id: string, updates: Partial<LaunchTask>) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onMarkDone: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task);

  useEffect(() => {
    if (!isEditing) {
      setDraft(task);
    }
  }, [isEditing, task]);

  const handleSave = () => {
    onUpdate(task.id, {
      title: draft.title.trim() || task.title,
      category: draft.category,
      priority: draft.priority,
      status: draft.status,
      notes: draft.notes?.trim() || undefined,
      dueDate: draft.dueDate || undefined,
    });
    setIsEditing(false);
  };

  return (
    <Card className="space-y-4 border border-brand-border bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-brand-primary">{task.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <TagChip>{task.category}</TagChip>
            <TagChip variant="accent">{task.priority} priority</TagChip>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
              {task.status}
            </span>
          </div>
          {task.dueDate && (
            <p className="text-xs text-text-secondary">Due {formatDate(task.dueDate)}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {task.status !== 'done' && task.status !== 'archived' && (
            <SecondaryButton className="px-3 py-1 text-xs" onClick={() => onMarkDone(task.id)}>
              Mark done
            </SecondaryButton>
          )}
          <SecondaryButton className="px-3 py-1 text-xs" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Close' : 'Edit'}
          </SecondaryButton>
          <SecondaryButton className="px-3 py-1 text-xs" onClick={() => onDuplicate(task.id)}>
            Duplicate
          </SecondaryButton>
          <SecondaryButton className="px-3 py-1 text-xs" onClick={() => onArchive(task.id)}>
            Archive
          </SecondaryButton>
        </div>
      </div>
      {task.notes && !isEditing && <p className="text-sm text-text-secondary">{task.notes}</p>}
      {isEditing && (
        <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-subtle/40 p-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Title
            <input
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Status
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.status}
                onChange={(event) =>
                  setDraft({ ...draft, status: event.target.value as LaunchTaskStatus })
                }
              >
                {taskStatusOptions
                  .filter((status) => status !== 'all')
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Priority
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.priority}
                onChange={(event) =>
                  setDraft({ ...draft, priority: event.target.value as LaunchTaskPriority })
                }
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Category
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value as LaunchTaskCategory })
                }
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Due date
              <input
                type="date"
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.dueDate ?? ''}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Notes
            <textarea
              className="min-h-[88px] rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.notes ?? ''}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton className="px-4 py-2 text-xs" onClick={handleSave}>
              Save changes
            </PrimaryButton>
            <SecondaryButton className="px-4 py-2 text-xs" onClick={() => setIsEditing(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </div>
      )}
    </Card>
  );
};

const ExperimentCard = ({
  experiment,
  onUpdate,
  onDuplicate,
  onArchive,
  onMarkDone,
  onMarkRunning,
}: {
  experiment: GrowthExperiment;
  onUpdate: (id: string, updates: Partial<GrowthExperiment>) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onMarkDone: (id: string) => void;
  onMarkRunning: (id: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(experiment);

  useEffect(() => {
    if (!isEditing) {
      setDraft(experiment);
    }
  }, [experiment, isEditing]);

  const handleSave = () => {
    onUpdate(experiment.id, {
      title: draft.title.trim() || experiment.title,
      hypothesis: draft.hypothesis.trim(),
      channel: draft.channel.trim(),
      audience: draft.audience.trim(),
      message: draft.message.trim(),
      kpi: draft.kpi.trim(),
      status: draft.status,
      startISO: draft.startISO || undefined,
      endISO: draft.endISO || undefined,
      results: draft.results?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
    });
    setIsEditing(false);
  };

  return (
    <Card className="space-y-4 border border-brand-border bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-brand-primary">{experiment.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <TagChip>{experiment.channel}</TagChip>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[experiment.status]}`}>
              {experiment.status}
            </span>
          </div>
          <p className="text-sm text-text-secondary">{experiment.hypothesis}</p>
          <div className="text-xs text-text-secondary">
            KPI: <span className="font-semibold text-brand-primary">{experiment.kpi}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {experiment.status !== 'running' && experiment.status !== 'archived' && (
            <SecondaryButton className="px-3 py-1 text-xs" onClick={() => onMarkRunning(experiment.id)}>
              Mark running
            </SecondaryButton>
          )}
          {experiment.status !== 'done' && experiment.status !== 'archived' && (
            <SecondaryButton className="px-3 py-1 text-xs" onClick={() => onMarkDone(experiment.id)}>
              Mark done
            </SecondaryButton>
          )}
          <SecondaryButton className="px-3 py-1 text-xs" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Close' : 'Edit'}
          </SecondaryButton>
          <SecondaryButton className="px-3 py-1 text-xs" onClick={() => onDuplicate(experiment.id)}>
            Duplicate
          </SecondaryButton>
          <SecondaryButton className="px-3 py-1 text-xs" onClick={() => onArchive(experiment.id)}>
            Archive
          </SecondaryButton>
        </div>
      </div>
      {!isEditing && (
        <div className="grid gap-2 text-sm text-text-secondary">
          <p>
            <span className="font-semibold text-brand-primary">Audience:</span> {experiment.audience}
          </p>
          <p>
            <span className="font-semibold text-brand-primary">Message:</span> {experiment.message}
          </p>
          {(experiment.notes || experiment.results) && (
            <div className="rounded-xl border border-brand-border bg-brand-subtle/40 p-3 text-xs text-text-secondary">
              {experiment.notes && <p>Notes: {experiment.notes}</p>}
              {experiment.results && <p>Results: {experiment.results}</p>}
            </div>
          )}
        </div>
      )}
      {isEditing && (
        <div className="space-y-3 rounded-2xl border border-brand-border bg-brand-subtle/40 p-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Title
            <input
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Hypothesis
            <textarea
              className="min-h-[72px] rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.hypothesis}
              onChange={(event) => setDraft({ ...draft, hypothesis: event.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Channel
              <input
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.channel}
                onChange={(event) => setDraft({ ...draft, channel: event.target.value })}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Status
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.status}
                onChange={(event) =>
                  setDraft({ ...draft, status: event.target.value as GrowthExperimentStatus })
                }
              >
                {experimentStatusOptions
                  .filter((status) => status !== 'all')
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Audience
            <input
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.audience}
              onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Message
            <textarea
              className="min-h-[72px] rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.message}
              onChange={(event) => setDraft({ ...draft, message: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            KPI
            <input
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.kpi}
              onChange={(event) => setDraft({ ...draft, kpi: event.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Start date
              <input
                type="date"
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.startISO?.slice(0, 10) ?? ''}
                onChange={(event) =>
                  setDraft({ ...draft, startISO: event.target.value || undefined })
                }
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              End date
              <input
                type="date"
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={draft.endISO?.slice(0, 10) ?? ''}
                onChange={(event) => setDraft({ ...draft, endISO: event.target.value || undefined })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Results
            <textarea
              className="min-h-[72px] rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.results ?? ''}
              onChange={(event) => setDraft({ ...draft, results: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
            Notes
            <textarea
              className="min-h-[72px] rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
              value={draft.notes ?? ''}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton className="px-4 py-2 text-xs" onClick={handleSave}>
              Save changes
            </PrimaryButton>
            <SecondaryButton className="px-4 py-2 text-xs" onClick={() => setIsEditing(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </div>
      )}
    </Card>
  );
};

export const LaunchHubPage = () => {
  const {
    tasks,
    experiments,
    updateTask,
    updateExperiment,
    setTaskStatus,
    setExperimentStatus,
    duplicateTask,
    duplicateExperiment,
    archiveTask,
    archiveExperiment,
  } = useLaunchHub();

  const [activeTab, setActiveTab] = useState<'checklist' | 'experiments'>('checklist');
  const [statusFilter, setStatusFilter] = useState<LaunchTaskStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<LaunchTaskCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<LaunchTaskPriority | 'all'>('all');
  const [experimentStatusFilter, setExperimentStatusFilter] = useState<GrowthExperimentStatus | 'all'>('all');

  const launchMetrics = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.status !== 'archived');
    const doneTasks = activeTasks.filter((task) => task.status === 'done');
    const runningExperiments = experiments.filter((exp) => exp.status === 'running');
    return {
      doneCount: doneTasks.length,
      totalCount: activeTasks.length,
      runningExperiments: runningExperiments.length,
      progress: activeTasks.length === 0 ? 0 : doneTasks.length / activeTasks.length,
    };
  }, [experiments, tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter === 'all') {
        if (task.status === 'archived') return false;
      } else if (task.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [categoryFilter, priorityFilter, statusFilter, tasks]);

  const filteredExperiments = useMemo(() => {
    return experiments.filter((experiment) => {
      if (experimentStatusFilter === 'all') {
        return experiment.status !== 'archived';
      }
      return experiment.status === experimentStatusFilter;
    });
  }, [experimentStatusFilter, experiments]);

  return (
    <PageLayout
      title="Launch Hub"
      subtitle="Your launch playbook with focused tasks and growth experiments."
    >
      <Card className="border border-brand-border bg-brand-subtle/60">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-secondary">Launch Score</p>
              <p className="text-2xl font-semibold text-brand-primary">
                {launchMetrics.doneCount}/{launchMetrics.totalCount} tasks done
              </p>
            </div>
            <div className="text-sm text-text-secondary">
              Running experiments: <span className="font-semibold text-brand-primary">{launchMetrics.runningExperiments}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/70">
            <div
              className="h-2 rounded-full bg-brand-accent transition-all"
              style={{ width: `${Math.round(launchMetrics.progress * 100)}%` }}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            activeTab === 'checklist'
              ? 'bg-brand-accent text-white'
              : 'border border-brand-border bg-white text-brand-primary'
          }`}
          onClick={() => setActiveTab('checklist')}
        >
          Checklist
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            activeTab === 'experiments'
              ? 'bg-brand-accent text-white'
              : 'border border-brand-border bg-white text-brand-primary'
          }`}
          onClick={() => setActiveTab('experiments')}
        >
          Experiments
        </button>
      </div>

      {activeTab === 'checklist' && (
        <Card className="border border-brand-border bg-white">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Status
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as LaunchTaskStatus | 'all')}
              >
                {taskStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Category
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as LaunchTaskCategory | 'all')
                }
              >
                <option value="all">all</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Priority
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as LaunchTaskPriority | 'all')
                }
              >
                <option value="all">all</option>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>
      )}

      {activeTab === 'experiments' && (
        <Card className="border border-brand-border bg-white">
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-2 text-xs font-semibold text-text-secondary">
              Status
              <select
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-brand-primary"
                value={experimentStatusFilter}
                onChange={(event) =>
                  setExperimentStatusFilter(event.target.value as GrowthExperimentStatus | 'all')
                }
              >
                {experimentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>
      )}

      {activeTab === 'checklist' && (
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card className="border border-brand-border bg-white">
              <p className="text-sm text-text-secondary">No tasks match these filters.</p>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDuplicate={duplicateTask}
                onArchive={archiveTask}
                onMarkDone={(id) => setTaskStatus(id, 'done')}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'experiments' && (
        <div className="space-y-4">
          {filteredExperiments.length === 0 ? (
            <Card className="border border-brand-border bg-white">
              <p className="text-sm text-text-secondary">No experiments match these filters.</p>
            </Card>
          ) : (
            filteredExperiments.map((experiment) => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                onUpdate={updateExperiment}
                onDuplicate={duplicateExperiment}
                onArchive={archiveExperiment}
                onMarkDone={(id) => setExperimentStatus(id, 'done')}
                onMarkRunning={(id) => setExperimentStatus(id, 'running')}
              />
            ))
          )}
        </div>
      )}
    </PageLayout>
  );
};

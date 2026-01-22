import { CalendarDays, Clock, Compass, Heart, MapPinned, NotebookPen, PawPrint } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Card } from '../../components/ui/Card';
import { StatPill } from '../../components/ui/StatPill';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate } from '../../utils/dates';
import { PetAvatar } from '../../components/ui/PetAvatar';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTrainingPlan } from '../../context/TrainingPlanContext';
import { getPlanDayForDate, getPlanDayNumberForDate } from '../../components/training/trainingPlanSelectors';

const quickActions = [
  { label: 'Start Walk', icon: <MapPinned size={16} />, to: '/activity' },
  { label: 'Journal Entry', icon: <NotebookPen size={16} />, to: '/journal' },
  { label: 'View Calendar', icon: <CalendarDays size={16} />, to: '/calendar' },
];

export const HomePage = () => {
  const { selectedPet, activities, journalEntries, reminders, xp } = useAppState();
  const { state: onboarding, startTour, restartTour, closeTour, setChecklist, resetOnboarding } = useOnboarding();
  const { getPlanForPet } = useTrainingPlan();
  const petName = selectedPet?.name ?? 'your pup';
  const petAvatar = selectedPet?.avatarUrl ?? '';
  const petActivities = activities.filter((activity) => activity.petId === selectedPet?.id);
  const petReminders = reminders.filter((reminder) => reminder.petId === selectedPet?.id);
  const todaysActivities = petActivities.filter((activity) => {
    const activityDate = new Date(activity.date);
    const now = new Date();
    return (
      activityDate.getDate() === now.getDate() &&
      activityDate.getMonth() === now.getMonth() &&
      activityDate.getFullYear() === now.getFullYear()
    );
  });

  const totalWalkMinutes = petActivities
    .filter((activity) => activity.durationMinutes)
    .reduce((sum, activity) => sum + (activity.durationMinutes ?? 0), 0);

  const lastJournalEntry = journalEntries.find((entry) => entry.petId === selectedPet?.id);
  const lastActivity = petActivities[0];
  const nextReminder = petReminders[0];

  const checklist = {
    petAdded: Boolean(selectedPet?.id),
    avatarUploaded: Boolean(selectedPet?.avatarUrl),
    activityLogged: petActivities.length > 0,
    journalWritten: journalEntries.some((entry) => entry.petId === selectedPet?.id),
    reminderAdded: petReminders.length > 0,
  };

  useEffect(() => {
    if (onboarding.completed) return;
    setChecklist(checklist).catch(() => {});
  }, [checklist.activityLogged, checklist.avatarUploaded, checklist.journalWritten, checklist.petAdded, checklist.reminderAdded, onboarding.completed, setChecklist]);

  const trainingPlanInfo = useMemo(
    () => (selectedPet?.id ? getPlanForPet(selectedPet.id) : null),
    [getPlanForPet, selectedPet?.id],
  );
  const activePlan = trainingPlanInfo?.plan ?? null;
  const planState = trainingPlanInfo?.petState ?? null;
  const todayPlanDay = activePlan && planState?.startDateISO
    ? getPlanDayForDate(activePlan, planState.startDateISO, new Date())
    : null;
  const todayPlanDayNumber = activePlan && planState?.startDateISO
    ? getPlanDayNumberForDate(activePlan, planState.startDateISO, new Date())
    : null;
  const progressRatio =
    activePlan && planState ? Math.min(1, planState.completedDayNumbers.length / activePlan.durationDays) : 0;

  const showReset = import.meta.env.DEV || import.meta.env.VITE_SMOKE_ENABLED === 'true';

  return (
    <PageLayout
      title={`Good Morning, ${petName}!`}
      subtitle="Here is what we have lined up for the day."
      actions={<Link to="/activity" className="text-sm font-semibold text-brand-primary">Start an activity</Link>}
    >
      <Card data-tour="home-today" padding="lg" className="border border-brand-accent/15 bg-gradient-to-br from-brand-subtle to-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Today</p>
              <h3 className="text-lg font-semibold text-brand-primary">What’s up for {petName}</h3>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Next reminder</p>
              {nextReminder ? (
                <>
                  <p className="text-sm font-semibold text-brand-primary line-clamp-1">{nextReminder.title}</p>
                  <p className="text-xs text-text-secondary">{formatDate(nextReminder.dateTime)}</p>
                </>
              ) : (
                <div className="space-y-2 text-xs text-text-secondary">
                  <p>No reminders yet.</p>
                  <Link
                    to="/calendar"
                    className="inline-flex items-center justify-center rounded-full bg-brand-primary px-3 py-1 text-[11px] font-semibold text-white shadow hover:bg-brand-primary/90"
                  >
                    Add reminder
                  </Link>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Last activity</p>
              {lastActivity ? (
                <>
                  <p className="text-sm font-semibold text-brand-primary capitalize line-clamp-1">{lastActivity.type}</p>
                  <p className="text-xs text-text-secondary">{formatDate(lastActivity.date)}</p>
                </>
              ) : (
                <div className="space-y-2 text-xs text-text-secondary">
                  <p>No activities yet.</p>
                  <Link
                    to="/activity"
                    className="inline-flex items-center justify-center rounded-full bg-brand-primary px-3 py-1 text-[11px] font-semibold text-white shadow hover:bg-brand-primary/90"
                  >
                    Start activity
                  </Link>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-subtle/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Last journal</p>
              {lastJournalEntry ? (
                <>
                  <p className="text-sm font-semibold text-brand-primary line-clamp-1">{lastJournalEntry.title}</p>
                  <p className="text-xs text-text-secondary">{formatDate(lastJournalEntry.date)}</p>
                </>
              ) : (
                <div className="space-y-2 text-xs text-text-secondary">
                  <p>No journal entries yet.</p>
                  <Link
                    to="/journal"
                    className="inline-flex items-center justify-center rounded-full bg-brand-primary px-3 py-1 text-[11px] font-semibold text-white shadow hover:bg-brand-primary/90"
                  >
                    Write journal
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/activity"
              className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-primary/95 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            >
              Start activity
            </Link>
            <Link
              to="/journal"
              className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow-sm transition hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              Write journal
            </Link>
            <Link
              to="/calendar"
              className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow-sm transition hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              Add reminder
            </Link>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="border border-brand-border bg-gradient-to-br from-brand-ice/60 to-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Today&apos;s Training</p>
            {activePlan ? (
              <>
                <h3 className="mt-1 text-lg font-semibold text-brand-primary">{activePlan.title}</h3>
                <p className="text-xs text-text-muted">
                  Day {todayPlanDayNumber ?? 1} of {activePlan.durationDays}
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-1 text-lg font-semibold text-brand-primary">No plan yet</h3>
                <p className="text-xs text-text-secondary">
                  Start a plan to build consistency with {petName}.
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/training"
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
            >
              {activePlan ? 'Continue training' : 'Browse plans'}
            </Link>
            {activePlan && (
              <Link to="/training" className="text-sm font-semibold text-brand-primary hover:underline">
                View plan
              </Link>
            )}
          </div>
        </div>

        {activePlan && (
          <>
            <div className="mt-4 h-2 w-full rounded-full bg-brand-border">
              <div
                className="h-full rounded-full bg-brand-accent transition-all"
                style={{ width: `${Math.round(progressRatio * 100)}%` }}
              />
            </div>
            <div className="mt-4 space-y-2 text-sm text-text-secondary">
              {todayPlanDay?.tasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <span className="text-brand-accent">•</span>
                  <span>{task.title}</span>
                </div>
              ))}
              {!todayPlanDay && (
                <p className="text-xs text-text-muted">No tasks scheduled for today.</p>
              )}
            </div>
          </>
        )}
      </Card>

      {!onboarding.completed && (
        <Card padding="md" className="border border-brand-border bg-white/90 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Setup</p>
              <h3 className="text-lg font-semibold text-brand-primary">Complete your setup</h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void startTour(true)}
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
              >
                Resume tour
              </button>
              <button
                type="button"
                onClick={() => void restartTour()}
                className="inline-flex items-center justify-center rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-primary hover:border-brand-primary"
              >
                Restart tutorial
              </button>
              <button
                type="button"
                onClick={() => void closeTour('skip', { skipped: true, introSeen: true, lastStepIndex: 0 })}
                className="inline-flex items-center justify-center rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-primary hover:border-brand-primary"
              >
                Stop tour
              </button>
              {showReset && (
                <button
                  type="button"
                  onClick={() => void resetOnboarding()}
                  className="inline-flex items-center justify-center rounded-full border border-dashed border-brand-border px-4 py-2 text-sm font-semibold text-brand-primary/70 hover:border-brand-primary"
                >
                  Reset onboarding
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
            <Link to="/pets" className="rounded-2xl border border-brand-border bg-brand-subtle/60 px-3 py-2">
              {checklist.petAdded ? '✓' : '○'} Add first pet
            </Link>
            <Link to="/pets" className="rounded-2xl border border-brand-border bg-brand-subtle/60 px-3 py-2">
              {checklist.avatarUploaded ? '✓' : '○'} Upload avatar
            </Link>
            <Link to="/activity" className="rounded-2xl border border-brand-border bg-brand-subtle/60 px-3 py-2">
              {checklist.activityLogged ? '✓' : '○'} Log activity
            </Link>
            <Link to="/journal" className="rounded-2xl border border-brand-border bg-brand-subtle/60 px-3 py-2">
              {checklist.journalWritten ? '✓' : '○'} Write journal
            </Link>
            <Link to="/calendar" className="rounded-2xl border border-brand-border bg-brand-subtle/60 px-3 py-2">
              {checklist.reminderAdded ? '✓' : '○'} Add reminder
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-4 border-0 bg-gradient-to-br from-brand-accent to-brand-accentDeep text-white shadow-xl p-4 sm:p-6" padding="md">
          <div className="flex items-center gap-3">
            <PetAvatar
              name={selectedPet?.name}
              avatarUrl={petAvatar}
              petId={selectedPet?.id}
              size="lg"
              className="rounded-2xl"
            />
            <div>
              <p className="text-sm text-brand-accentSoft/80">Daily Summary</p>
              <h3 className="text-2xl font-semibold text-white">{petName}&apos;s Agenda</h3>
              <p className="text-sm text-white/80">Walks, meals, and mood all in one place.</p>
            </div>
          </div>
          <div className="grid min-w-0 gap-2 sm:gap-3 sm:grid-cols-3">
            <StatPill label="Today" value={`${todaysActivities.length} activities`} icon={<Compass size={18} />} />
            <StatPill
              label="Walk Minutes"
              value={`${totalWalkMinutes} min`}
              icon={<Clock size={18} />}
              accent="slate"
            />
            <StatPill label="Total XP" value={`${xp} XP`} icon={<Heart size={18} />} accent="emerald" />
          </div>
        </Card>
        <Card padding="md" className="border-0 bg-brand-ice/50 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-primary">Quick Actions</h3>
            <PawPrint className="text-brand-accent" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex min-w-[6.5rem] flex-1 items-center justify-center gap-2 rounded-2xl border border-brand-border px-3 py-3 text-sm font-semibold text-brand-primary transition hover:border-brand-accent hover:text-brand-accent sm:min-w-0"
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-0 bg-white/90 shadow-lg p-4 sm:p-6" padding="md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Link to="/activity" className="text-sm font-semibold text-brand-primary">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {petActivities.slice(0, 4).map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-1 rounded-2xl border border-brand-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold capitalize text-brand-primary">{activity.type}</p>
                  <p className="text-xs text-text-muted">{formatDate(activity.date)}</p>
                </div>
                <div className="text-sm text-text-secondary">
                  {activity.durationMinutes ? `${activity.durationMinutes} min` : 'Logged'}
                </div>
              </div>
            ))}
            {petActivities.length === 0 && (
              <div className="space-y-2 rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">
                <p className="text-sm font-semibold text-brand-primary">No activities yet for {petName}</p>
                <p>Start tracking walks, playtime, and adventures.</p>
                <Link
                  to="/activity"
                  className="inline-flex w-fit items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
                >
                  Create activity
                </Link>
              </div>
            )}
          </div>
        </Card>
        <Card padding="md" className="border-0 bg-brand-blush/50 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-brand-primary">Latest Journal</h3>
          {lastJournalEntry ? (
            <div className="mt-3 rounded-2xl bg-brand-subtle p-4">
              <p className="text-sm font-semibold text-brand-primary">{lastJournalEntry.title}</p>
              <p className="text-xs text-text-muted">{formatDate(lastJournalEntry.date)}</p>
              <p className="mt-2 text-sm text-text-secondary">{lastJournalEntry.content.slice(0, 100)}...</p>
              <Link to="/journal" className="mt-3 inline-flex text-sm font-semibold text-brand-primary">
                Continue reading →
              </Link>
            </div>
          ) : (
            <div className="mt-3 space-y-3 text-sm text-text-secondary">
              <p>No entries yet – add your first memory for {petName}!</p>
              <Link
                to="/journal"
                className="inline-flex w-fit items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
              >
                Write a journal entry
              </Link>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

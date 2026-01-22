import { addDays, startOfDay } from 'date-fns';
import { CalendarDays, CheckCircle2, Clock, Compass, Heart, MapPinned, NotebookPen, PawPrint, Sparkles } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Card } from '../../components/ui/Card';
import { StatPill } from '../../components/ui/StatPill';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate, formatTime, sameDay } from '../../utils/dates';
import { PetAvatar } from '../../components/ui/PetAvatar';
import { useOnboarding } from '../../context/OnboardingContext';

const quickActions = [
  { label: 'Start Walk', icon: <MapPinned size={16} />, to: '/activity' },
  { label: 'Journal Entry', icon: <NotebookPen size={16} />, to: '/journal' },
  { label: 'View Calendar', icon: <CalendarDays size={16} />, to: '/calendar' },
];

export const HomePage = () => {
  const { selectedPet, activities, journalEntries, reminders, xp } = useAppState();
  const { state: onboarding, startTour, closeTour, setChecklist, resetOnboarding } = useOnboarding();
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
  const trainingActivities = useMemo(
    () => petActivities.filter((activity) => activity.type === 'training'),
    [petActivities],
  );
  const todayTraining = useMemo(
    () => trainingActivities.filter((activity) => sameDay(activity.date, new Date())),
    [trainingActivities],
  );
  const hasTrainingToday = todayTraining.length > 0;
  const trainingStreak = useMemo(() => {
    if (trainingActivities.length === 0) return 0;
    const daySet = new Set(trainingActivities.map((activity) => startOfDay(new Date(activity.date)).getTime()));
    let streak = 0;
    let cursor = startOfDay(new Date());
    while (daySet.has(cursor.getTime())) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }, [trainingActivities]);
  const trainingWeekSummary = useMemo(() => {
    const cutoff = addDays(startOfDay(new Date()), -6).getTime();
    let minutes = 0;
    const daySet = new Set<number>();
    trainingActivities.forEach((activity) => {
      const day = startOfDay(new Date(activity.date)).getTime();
      if (day >= cutoff) {
        daySet.add(day);
        minutes += activity.durationMinutes ?? 0;
      }
    });
    return { dayCount: daySet.size, minutes };
  }, [trainingActivities]);
  const weeklyGoal = 3;
  const weeklyProgress = Math.min(1, trainingWeekSummary.dayCount / weeklyGoal);

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

  const nextLaunchTask = useMemo(() => getNextTask(), [getNextTask]);

  const showReset = import.meta.env.DEV || import.meta.env.VITE_SMOKE_ENABLED === 'true';

  return (
    <PageLayout
      title={`Good Morning, ${petName}!`}
      subtitle="Here’s today’s focus and how you’re progressing."
      actions={<Link to="/activity" className="text-sm font-semibold text-brand-primary">Start today’s training</Link>}
    >
      <Card padding="lg" className="border border-brand-accent/25 bg-gradient-to-br from-brand-accent/15 via-white to-white shadow-xl">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Today&apos;s Training</p>
              <h3 className="text-xl font-semibold text-brand-primary">Build focus with {petName}.</h3>
              <p className="text-sm text-text-secondary">
                {hasTrainingToday
                  ? 'Nice work — today’s training is in.'
                  : 'Start a short session to keep the streak alive.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-semibold text-brand-primary">
                Streak {trainingStreak} day{trainingStreak === 1 ? '' : 's'}
              </span>
              <span
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                hasTrainingToday ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-subtle text-text-secondary'
                }`}
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  {hasTrainingToday && (
                    <span className="absolute h-4 w-4 animate-ping rounded-full bg-emerald-400/40" />
                  )}
                  {hasTrainingToday ? (
                    <CheckCircle2 size={14} className="relative" />
                  ) : (
                    <Sparkles size={14} className="relative text-brand-primary/70" />
                  )}
                </span>
                {hasTrainingToday ? 'Training complete' : 'Ready to train'}
              </span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-brand-border bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Today&apos;s sessions</p>
              {hasTrainingToday ? (
                <div className="mt-3 space-y-3">
                  {todayTraining.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-subtle/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-brand-primary">Training session</p>
                        <p className="text-xs text-text-secondary">{formatTime(activity.date)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        {activity.durationMinutes ? <span>{activity.durationMinutes} min</span> : null}
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 size={14} />
                          Done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-sm text-text-secondary">
                  <p>No training logged yet.</p>
                  <p>Try a 10-minute focus session or leash warm-up.</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/activity"
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
                >
                  Log training
                </Link>
                <Link
                  to="/activity"
                  className="inline-flex items-center justify-center rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-primary hover:border-brand-primary"
                >
                  View progress
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-brand-border bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Weekly rhythm</p>
              <div className="mt-3 flex items-center justify-between text-sm text-text-secondary">
                <span>{trainingWeekSummary.dayCount} / {weeklyGoal} training days</span>
                <span>{trainingWeekSummary.minutes} min</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-brand-border">
                <div
                  className="h-full rounded-full bg-brand-accent transition-all"
                  style={{ width: `${Math.round(weeklyProgress * 100)}%` }}
                />
              </div>
              <div className="mt-4 rounded-xl border border-brand-border bg-brand-subtle/50 px-3 py-2 text-xs text-text-secondary">
                {trainingWeekSummary.dayCount >= weeklyGoal
                  ? 'You hit your weekly rhythm — keep the momentum.'
                  : `Aim for ${weeklyGoal - trainingWeekSummary.dayCount} more day${weeklyGoal - trainingWeekSummary.dayCount === 1 ? '' : 's'} this week.`}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card data-tour="home-today" padding="lg" className="border border-brand-accent/15 bg-gradient-to-br from-brand-subtle to-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Today snapshot</p>
              <h3 className="text-lg font-semibold text-brand-primary">Everything else in one glance</h3>
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
        </div>
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
                onClick={() => void startTour()}
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-primary/90"
              >
                Resume tour
              </button>
              <button
                type="button"
                onClick={() => void closeTour('skip', { skipped: true, introSeen: true, lastStepIndex: 0 })}
                className="inline-flex items-center justify-center rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-primary hover:border-brand-primary"
              >
                Skip
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
        <Card className="flex flex-col gap-4 border border-brand-border bg-white/90 shadow-sm p-4 sm:p-6" padding="md">
          <div className="flex items-center gap-3">
            <PetAvatar
              name={selectedPet?.name}
              avatarUrl={petAvatar}
              petId={selectedPet?.id}
              size="lg"
              className="rounded-2xl"
            />
            <div>
              <p className="text-xs text-text-muted">Daily Summary</p>
              <h3 className="text-2xl font-semibold text-brand-primary">{petName}&apos;s Agenda</h3>
              <p className="text-sm text-text-secondary">Walks, meals, and mood in one place.</p>
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
            <h3 className="text-lg font-semibold text-brand-primary">More actions</h3>
            <PawPrint className="text-brand-accent" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
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

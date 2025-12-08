import { CalendarDays, Clock, Compass, Heart, MapPinned, NotebookPen, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '../../components/ui/Card';
import { StatPill } from '../../components/ui/StatPill';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate } from '../../utils/dates';

const quickActions = [
  { label: 'Start Walk', icon: <MapPinned size={16} />, to: '/activity' },
  { label: 'Journal Entry', icon: <NotebookPen size={16} />, to: '/journal' },
  { label: 'View Calendar', icon: <CalendarDays size={16} />, to: '/calendar' },
];

export const HomePage = () => {
  const { selectedPet, activities, journalEntries, xp } = useAppState();
  const petName = selectedPet?.name ?? 'your pup';
  const petAvatar =
    selectedPet?.avatarUrl ?? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=60';
  const petActivities = activities.filter((activity) => activity.petId === selectedPet?.id);
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

  return (
    <PageLayout
      title={`Good Morning, ${petName}!`}
      subtitle="Here is what we have lined up for the day."
      actions={<Link to="/activity" className="text-sm font-semibold text-brand-primary">Start an activity</Link>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-4 border-0 bg-gradient-to-br from-brand-accent to-brand-accentDeep text-white shadow-xl" padding="lg">
          <div className="flex items-center gap-3">
            <img src={petAvatar} alt={selectedPet?.name} className="h-16 w-16 rounded-2xl object-cover" />
            <div>
              <p className="text-sm text-brand-accentSoft/80">Daily Summary</p>
              <h3 className="text-2xl font-semibold text-white">{petName}&apos;s Agenda</h3>
              <p className="text-sm text-white/80">Walks, meals, and mood all in one place.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
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
        <Card padding="lg" className="border-0 bg-brand-ice/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-primary">Quick Actions</h3>
            <PawPrint className="text-brand-accent" />
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-2xl border border-brand-border px-3 py-3 text-sm font-semibold text-brand-primary transition hover:border-brand-accent hover:text-brand-accent sm:min-w-0"
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-0 bg-white/90 shadow-lg" padding="lg">
          <div className="flex items-center justify-between">
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
              <p className="rounded-2xl bg-brand-subtle p-4 text-sm text-text-secondary">
                No activity yet today. Tap “Start an activity” to log the first one.
              </p>
            )}
          </div>
        </Card>
        <Card padding="lg" className="border-0 bg-brand-blush/50">
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
            <p className="mt-3 text-sm text-text-secondary">No entries yet – add your first memory!</p>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useMemo } from 'react';

import { Card } from '../../components/ui/Card';
import { PageLayout } from '../../components/layout/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate, formatTime } from '../../utils/dates';

export const FeedPage = () => {
  const { activities, journalEntries, pets } = useAppState();

  const feedItems = useMemo(() => {
    const activityItems = activities.map((activity) => ({
      id: activity.id,
      type: 'activity' as const,
      date: activity.date,
      title: `${activity.type.charAt(0).toUpperCase()}${activity.type.slice(1)} with ${
        pets.find((pet) => pet.id === activity.petId)?.name ?? 'a pup'
      }`,
      content: activity.notes ?? 'Great session logged!',
      photoUrl: activity.photoUrl,
      petId: activity.petId,
    }));

    const journalItems = journalEntries.map((entry) => ({
      id: entry.id,
      type: 'journal' as const,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      photoUrl: entry.photoUrl,
      petId: entry.petId,
    }));

    return [...activityItems, ...journalItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [activities, journalEntries, pets]);

  return (
    <PageLayout title="Community Feed" subtitle="Share the joy locally">
      <div className="space-y-4">
        {feedItems.map((item) => {
          const pet = pets.find((pet) => pet.id === item.petId);
          return (
            <Card key={item.id} padding="lg">
              <div className="flex items-center gap-3">
                <img src={pet?.avatarUrl} alt={pet?.name} className="h-12 w-12 rounded-2xl object-cover" />
                <div>
                  <p className="font-semibold">{pet?.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(item.date)} · {formatTime(item.date)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.content}</p>
              </div>
              {item.photoUrl && (
                <img
                  src={item.photoUrl}
                  alt={item.title}
                  className="mt-3 h-48 w-full rounded-2xl object-cover"
                />
              )}
              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <button className="flex items-center gap-1">
                  <Heart size={16} /> Like
                </button>
                <button className="flex items-center gap-1">
                  <MessageCircle size={16} /> Comment
                </button>
                <button className="flex items-center gap-1">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </Card>
          );
        })}
        {feedItems.length === 0 && (
          <Card padding="lg" className="text-sm text-slate-500">
            No activity yet. Log a walk or journal entry to see it here.
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

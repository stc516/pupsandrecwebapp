import clsx from 'clsx';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';

import { Card } from '../../components/ui/Card';
import { PageLayout } from '../../components/layout/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { formatDate, formatTime } from '../../utils/dates';
import { PrimaryButton } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastProvider';

type FeedInteraction = {
  likes: number;
  liked: boolean;
  comments: Array<{ id: string; text: string; createdAt: string }>;
};

export const FeedPage = () => {
  const { activities, journalEntries, pets } = useAppState();
  const { pushToast } = useToast();

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

  const [interactions, setInteractions] = useState<Record<string, FeedInteraction>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setInteractions((prev) => {
      const next: Record<string, FeedInteraction> = {};
      feedItems.forEach((item) => {
        next[item.id] =
          prev[item.id] ?? {
            likes: 0,
            liked: false,
            comments: [],
          };
      });
      return next;
    });
    setCommentDrafts((prev) => {
      const next: Record<string, string> = {};
      feedItems.forEach((item) => {
        next[item.id] = prev[item.id] ?? '';
      });
      return next;
    });
  }, [feedItems]);

  const handleToggleLike = (itemId: string) => {
    setInteractions((prev) => {
      const current = prev[itemId] ?? { likes: 0, liked: false, comments: [] };
      const liked = !current.liked;
      const likes = liked ? current.likes + 1 : Math.max(0, current.likes - 1);
      return {
        ...prev,
        [itemId]: {
          ...current,
          liked,
          likes,
        },
      };
    });
  };

  const handleCommentSubmit = (itemId: string) => {
    const text = (commentDrafts[itemId] ?? '').trim();
    if (!text) {
      pushToast({ tone: 'error', message: 'Enter a comment first.' });
      return;
    }
    setInteractions((prev) => {
      const current = prev[itemId] ?? { likes: 0, liked: false, comments: [] };
      const nextComment = { id: nanoid(), text, createdAt: new Date().toISOString() };
      return {
        ...prev,
        [itemId]: {
          ...current,
          comments: [...current.comments, nextComment],
        },
      };
    });
    setCommentDrafts((prev) => ({ ...prev, [itemId]: '' }));
    pushToast({ tone: 'success', message: 'Comment added.' });
  };

  return (
    <PageLayout title="Community Feed" subtitle="Share the joy locally">
      <div className="space-y-4">
        {feedItems.map((item) => {
          const pet = pets.find((pet) => pet.id === item.petId);
          const interaction = interactions[item.id] ?? { likes: 0, liked: false, comments: [] };
          const draftValue = commentDrafts[item.id] ?? '';
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
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <button
                  type="button"
                  onClick={() => handleToggleLike(item.id)}
                  className={clsx(
                    'flex items-center gap-1 rounded-full border px-3 py-1',
                    interaction.liked
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                      : 'border-slate-200 hover:border-brand-border',
                  )}
                >
                  <Heart size={16} className={interaction.liked ? 'fill-current' : undefined} />
                  {interaction.liked ? 'Liked' : 'Like'} · {interaction.likes}
                </button>
                <div className="flex items-center gap-1 text-slate-500">
                  <MessageCircle size={16} />
                  {interaction.comments.length} comments
                </div>
                <button className="flex items-center gap-1">
                  <Share2 size={16} /> Share
                </button>
              </div>
              {interaction.comments.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {interaction.comments.map((comment) => (
                    <div key={comment.id} className="text-sm text-slate-600">
                      <span className="font-semibold text-brand-primary">You</span> {comment.text}
                    </div>
                  ))}
                </div>
              )}
              <form
                className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCommentSubmit(item.id);
                }}
              >
                <input
                  className="flex-1 rounded-2xl border border-brand-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent"
                  placeholder="Leave a quick note..."
                  value={draftValue}
                  onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                />
                <PrimaryButton type="submit" className="w-full sm:w-auto px-4 py-2 text-sm">
                  Comment
                </PrimaryButton>
              </form>
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

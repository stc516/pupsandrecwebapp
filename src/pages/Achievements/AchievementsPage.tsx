import { Award, Trophy } from 'lucide-react';

import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { calculateLevel, percentToNextLevel, XP_PER_LEVEL } from '../../utils/xp';

export const AchievementsPage = () => {
  const { achievements, xp } = useAppState();
  const level = calculateLevel(xp);
  const progressPercent = percentToNextLevel(xp);

  return (
    <PageLayout title="Achievements" subtitle="Earn XP and celebrate milestones">
      <div className="grid gap-4 md:grid-cols-3">
        <Card padding="lg" className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Trophy className="text-brand-primary" />
            <div>
              <p className="text-sm text-slate-500">Current Level</p>
              <p className="text-2xl font-semibold">Level {level}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{Math.round(progressPercent)}% to next level</span>
              <span>{XP_PER_LEVEL} XP / level</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-accent" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </Card>
        <Card padding="lg" className="flex flex-col items-center justify-center text-center">
          <Award className="text-brand-primary" size={48} />
          <p className="mt-3 text-sm text-slate-500">Total XP</p>
          <p className="text-3xl font-semibold">{xp}</p>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement) => {
          const percent = (achievement.progress / achievement.threshold) * 100;
          return (
            <Card key={achievement.id} padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{achievement.title}</p>
                  <p className="text-sm text-slate-500">{achievement.description}</p>
                </div>
                {achievement.unlocked ? (
                  <Badge tone="success">Unlocked</Badge>
                ) : (
                  <Badge tone="info">{achievement.progress}/{achievement.threshold}</Badge>
                )}
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${achievement.unlocked ? 'bg-emerald-400' : 'bg-brand-accent'}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Earn {achievement.xpReward} XP</p>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
};

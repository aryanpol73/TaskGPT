import React from 'react';
import { ArrowLeft, Trophy, Flame, Star, Zap, Gift } from 'lucide-react';
import { useProfile, useRewards } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface Props {
  onBack: () => void;
}

const milestones = [
  { points: 50, title: 'Getting Started', emoji: '🌱', reward: 'Starter Badge' },
  { points: 200, title: 'Task Warrior', emoji: '⚔️', reward: 'Warrior Badge' },
  { points: 500, title: 'Productivity Pro', emoji: '🏆', reward: 'Pro Badge' },
  { points: 1000, title: 'Task Master', emoji: '👑', reward: 'Master Badge' },
  { points: 2500, title: 'Legend', emoji: '🌟', reward: 'Legend Badge' },
];

const RewardsSection: React.FC<Props> = ({ onBack }) => {
  const { data: profile } = useProfile();
  const { data: rewards = [] } = useRewards();

  const totalPoints = profile?.total_points ?? 0;
  const weeklyPoints = profile?.weekly_points ?? 0;
  const monthlyPoints = profile?.monthly_points ?? 0;
  const streak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;

  const nextMilestone = milestones.find(m => m.points > totalPoints) || milestones[milestones.length - 1];
  const prevMilestone = milestones.filter(m => m.points <= totalPoints).pop();
  const progressBase = prevMilestone?.points ?? 0;
  const progressPercent = nextMilestone ? Math.min(100, ((totalPoints - progressBase) / (nextMilestone.points - progressBase)) * 100) : 100;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">Rewards & Points</h2>

      {/* Points Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 text-center">
          <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">Total Points</p>
        </div>
        <div className="glass p-4 text-center">
          <Star className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold text-foreground">{weeklyPoints}</p>
          <p className="text-xs text-muted-foreground">This Week</p>
        </div>
        <div className="glass p-4 text-center">
          <Trophy className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold text-foreground">{monthlyPoints}</p>
          <p className="text-xs text-muted-foreground">This Month</p>
        </div>
      </div>

      {/* Streak */}
      <div className="glass p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Flame className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-foreground">{streak} Day Streak 🔥</p>
          <p className="text-xs text-muted-foreground">Longest streak: {longestStreak} days</p>
        </div>
      </div>

      {/* Next Milestone */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Next: {nextMilestone?.title}</p>
          <span className="text-lg">{nextMilestone?.emoji}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{totalPoints} / {nextMilestone?.points} points</p>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Milestones</h3>
        <div className="glass overflow-hidden divide-y divide-border">
          {milestones.map(m => {
            const achieved = totalPoints >= m.points;
            return (
              <div key={m.points} className={cn('flex items-center gap-3 px-4 py-3', !achieved && 'opacity-50')}>
                <span className="text-xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.points} points — {m.reward}</p>
                </div>
                {achieved && <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">Earned</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Rewards */}
      {rewards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Recent Activity</h3>
          <div className="glass overflow-hidden divide-y divide-border">
            {rewards.slice(0, 10).map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <Gift className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.earned_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-medium text-primary">+{r.points_earned}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsSection;

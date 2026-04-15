import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { AVATAR_OPTIONS } from '@/types/profile';
import TaskList from '@/components/TaskList';
import AddTaskBar from '@/components/AddTaskBar';
import { Sparkles, Flame, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: profile } = useProfile();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === (profile?.selected_avatar || 'default'));
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedToday = tasks.filter(
    t => t.status === 'completed' && t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{currentAvatar?.emoji || '😊'}</span>
          <h1 className="text-3xl font-bold text-foreground">
            {greeting()}{profile?.display_name ? `, ${profile.display_name}` : ''}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {pendingCount > 0
            ? `${pendingCount} task${pendingCount > 1 ? 's' : ''} pending`
            : 'All clear!'}
          {completedToday > 0 && ` · ${completedToday} done today`}
        </p>
      </header>

      {/* Stats bar */}
      {profile && (
        <div className="flex gap-3 mb-6">
          <div className="glass flex-1 p-3 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{profile.total_points ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Points</p>
            </div>
          </div>
          <div className="glass flex-1 p-3 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-sm font-bold text-foreground">{profile.current_streak ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Day Streak</p>
            </div>
          </div>
          {completedToday > 0 && (
            <div className="glass flex-1 p-3 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">{completedToday}</p>
                <p className="text-[10px] text-muted-foreground">Today</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Streak card */}
      {completedToday > 0 && (
        <div className="glass mb-6 p-4 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              🔥 You completed {completedToday} task{completedToday > 1 ? 's' : ''} today! +{completedToday * 10} pts
            </p>
            <p className="text-xs text-muted-foreground">Keep up the momentum</p>
          </div>
        </div>
      )}

      {/* Add task */}
      <div className="mb-6">
        <AddTaskBar />
      </div>

      {/* Task list */}
      <TaskList tasks={tasks} loading={isLoading} />
    </div>
  );
};

export default Dashboard;

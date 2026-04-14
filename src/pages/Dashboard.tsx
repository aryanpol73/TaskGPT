import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import TaskList from '@/components/TaskList';
import AddTaskBar from '@/components/AddTaskBar';
import AiAssistant from '@/components/AiAssistant';
import { Button } from '@/components/ui/button';
import { LogOut, Sparkles } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: tasks = [], isLoading } = useTasks();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedToday = tasks.filter(
    t => t.status === 'completed' && t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] gradient-primary" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-5 blur-[100px]" style={{ background: 'hsl(330 70% 55%)' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {greeting()} <span className="text-gradient">✨</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {pendingCount > 0
                ? `${pendingCount} task${pendingCount > 1 ? 's' : ''} pending`
                : 'All clear!'}
              {completedToday > 0 && ` · ${completedToday} done today`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </Button>
        </header>

        {/* Streak / insight card */}
        {completedToday > 0 && (
          <div className="glass mb-6 p-4 flex items-center gap-3 animate-slide-up">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                🔥 You completed {completedToday} task{completedToday > 1 ? 's' : ''} today!
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

      {/* AI Floating button */}
      <AiAssistant />
    </div>
  );
};

export default Dashboard;

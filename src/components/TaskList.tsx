import React, { useState } from 'react';
import type { Task, TaskFilter } from '@/types/task';
import TaskItem from './TaskItem';
import { cn } from '@/lib/utils';
import { isToday, isFuture, parseISO } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
}

const filters: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Done' },
];

function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'today':
      return tasks.filter(t => t.status !== 'completed' && t.due_date && isToday(parseISO(t.due_date)));
    case 'upcoming':
      return tasks.filter(t => t.status !== 'completed' && t.due_date && isFuture(parseISO(t.due_date)));
    case 'completed':
      return tasks.filter(t => t.status === 'completed');
    default:
      return tasks.filter(t => t.status !== 'archived');
  }
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading }) => {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const filtered = filterTasks(tasks, activeFilter);
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 glass-subtle p-1 w-fit">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              activeFilter === f.value
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
            {f.value === 'all' && pendingCount > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            {activeFilter === 'completed' ? 'No completed tasks yet' : 'No tasks here'}
          </p>
          <p className="text-muted-foreground/60 text-sm mt-1">
            Add a task above or ask the AI assistant ✨
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;

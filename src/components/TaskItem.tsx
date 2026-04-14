import React from 'react';
import type { Task } from '@/types/task';
import { useToggleTask, useDeleteTask } from '@/hooks/useTasks';
import { Check, Trash2, Calendar, Tag } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
}

const priorityColors: Record<string, string> = {
  high: 'border-priority-high',
  medium: 'border-priority-medium',
  low: 'border-priority-low',
};

const priorityDots: Record<string, string> = {
  high: 'bg-priority-high shadow-[0_0_8px_hsl(var(--priority-high)/0.5)]',
  medium: 'bg-priority-medium shadow-[0_0_8px_hsl(var(--priority-medium)/0.5)]',
  low: 'bg-priority-low shadow-[0_0_8px_hsl(var(--priority-low)/0.5)]',
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted;

  return (
    <div
      className={cn(
        'glass p-4 transition-all duration-300 hover:scale-[1.01] group animate-slide-up',
        isCompleted && 'opacity-60'
      )}
      style={{ animationDelay: '0.05s' }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleTask.mutate({ id: task.id, status: task.status })}
          className={cn(
            'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200',
            priorityColors[task.priority],
            isCompleted && 'bg-success border-success'
          )}
          aria-label={isCompleted ? 'Mark as pending' : 'Mark as complete'}
        >
          {isCompleted && <Check className="w-3 h-3 text-success-foreground" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-foreground transition-all',
            isCompleted && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </p>

          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Priority dot */}
            <div className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', priorityDots[task.priority])} />
              <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
            </div>

            {/* Due date */}
            {task.due_date && (
              <div className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue ? 'text-destructive' : 'text-muted-foreground'
              )}>
                <Calendar className="w-3 h-3" />
                <span>{formatDueDate(task.due_date)}</span>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {task.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => deleteTask.mutate(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;

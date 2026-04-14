import React, { useState } from 'react';
import { useCreateTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const AddTaskBar: React.FC = () => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [expanded, setExpanded] = useState(false);
  const createTask = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate({
      title: title.trim(),
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      tags: [],
      status: 'pending',
      is_recurring: false,
      recurrence_pattern: null,
      parent_task_id: null,
      sort_order: 0,
    });
    setTitle('');
    setDueDate('');
    setPriority('medium');
    setExpanded(false);
  };

  const priorities: Array<{ value: 'high' | 'medium' | 'low'; label: string; color: string }> = [
    { value: 'high', label: 'High', color: 'bg-priority-high' },
    { value: 'medium', label: 'Med', color: 'bg-priority-medium' },
    { value: 'low', label: 'Low', color: 'bg-priority-low' },
  ];

  return (
    <form onSubmit={handleSubmit} className="glass-strong p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Add a task... or describe it naturally"
          className="bg-transparent border-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 text-base"
        />
        {title.trim() && (
          <Button type="submit" variant="ai" size="sm" disabled={createTask.isPending}>
            Add
          </Button>
        )}
      </div>

      {expanded && (
        <div className="flex items-center gap-4 mt-3 ml-11 animate-slide-up">
          {/* Priority selector */}
          <div className="flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-muted-foreground mr-1" />
            {priorities.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full transition-all',
                  priority === p.value
                    ? `${p.color} text-foreground`
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Due date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent border-none text-xs text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      )}
    </form>
  );
};

export default AddTaskBar;

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'archived';
  tags: string[];
  due_date: string | null;
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | null;
  parent_task_id: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'> & {
  id?: string;
  completed_at?: string | null;
};

export type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed';

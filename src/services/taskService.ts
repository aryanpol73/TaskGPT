import { supabase } from '@/integrations/supabase/client';
import type { Task } from '@/types/task';

export async function fetchTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .is('parent_task_id', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function fetchSubtasks(parentId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_task_id', parentId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(task: Partial<Task> & { title: string; user_id: string }): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      user_id: task.user_id,
      description: task.description ?? null,
      priority: task.priority ?? 'medium',
      status: task.status ?? 'pending',
      tags: task.tags ?? [],
      due_date: task.due_date ?? null,
      is_recurring: task.is_recurring ?? false,
      recurrence_pattern: task.recurrence_pattern ?? null,
      parent_task_id: task.parent_task_id ?? null,
      sort_order: task.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleTaskStatus(id: string, currentStatus: string): Promise<Task> {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  return updateTask(id, {
    status: newStatus,
    completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
  });
}

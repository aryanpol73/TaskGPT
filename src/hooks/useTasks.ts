import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as taskService from '@/services/taskService';
import type { Task } from '@/types/task';
import { toast } from 'sonner';
import { useAddPoints } from '@/hooks/useProfile';

export function useTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => taskService.fetchTasks(user!.id),
    enabled: !!user,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (task: Partial<Task> & { title: string }) =>
      taskService.createTask({ ...task, user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
    onError: () => toast.error('Failed to create task'),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Failed to update task'),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task'),
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  const addPoints = useAddPoints();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      taskService.toggleTaskStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.status === 'completed') {
        const points = data.priority === 'high' ? 15 : data.priority === 'medium' ? 10 : 5;
        addPoints.mutate({
          points,
          rewardType: 'task_completed',
          title: `Completed: ${data.title}`,
        });
        toast.success(`+${points} points! Task completed 🎉`);
      }
    },
  });
}

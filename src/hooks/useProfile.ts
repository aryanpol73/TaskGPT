import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import * as profileService from '@/services/profileService';
import type { Profile } from '@/types/profile';
import { toast } from 'sonner';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profileService.fetchProfile(user!.id),
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (updates: Partial<Profile>) =>
      profileService.upsertProfile(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });
}

export function useAddPoints() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ points, rewardType, title }: { points: number; rewardType: string; title: string }) =>
      profileService.addPoints(user!.id, points, rewardType, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}

export function useRewards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rewards', user?.id],
    queryFn: () => profileService.fetchRewards(user!.id),
    enabled: !!user,
  });
}

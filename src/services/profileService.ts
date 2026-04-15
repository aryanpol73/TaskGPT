import { supabase } from '@/integrations/supabase/client';
import type { Profile, Reward } from '@/types/profile';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function upsertProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function addPoints(userId: string, points: number, rewardType: string, title: string): Promise<void> {
  // Get current profile
  const profile = await fetchProfile(userId);
  const today = new Date().toISOString().split('T')[0];
  
  let newStreak = 1;
  let longestStreak = profile?.longest_streak ?? 0;
  
  if (profile?.last_completed_date) {
    const lastDate = new Date(profile.last_completed_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      newStreak = (profile.current_streak ?? 0) + 1;
    } else if (diffDays === 0) {
      newStreak = profile.current_streak ?? 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, newStreak);

  await upsertProfile(userId, {
    total_points: (profile?.total_points ?? 0) + points,
    weekly_points: (profile?.weekly_points ?? 0) + points,
    monthly_points: (profile?.monthly_points ?? 0) + points,
    current_streak: newStreak,
    longest_streak: longestStreak,
    last_completed_date: today,
  });

  // Log reward
  await supabase.from('rewards').insert({
    user_id: userId,
    reward_type: rewardType,
    title,
    points_earned: points,
  });
}

export async function fetchRewards(userId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as Reward[];
}

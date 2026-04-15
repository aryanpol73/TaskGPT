import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

async function callGoogleApi(action: string, params?: Record<string, any>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('google-api', {
    body: { action, params },
  });

  if (error) throw new Error(error.message || 'API call failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useGoogleConnected() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['google-connected', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('google_tokens')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
}

export function useGmailMessages(enabled: boolean) {
  return useQuery({
    queryKey: ['gmail-messages'],
    queryFn: () => callGoogleApi('gmail.list', { maxResults: 20 }),
    enabled,
    refetchInterval: 60000,
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { to: string; subject: string; body: string }) =>
      callGoogleApi('gmail.send', params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gmail-messages'] }),
  });
}

export function useCalendarEvents(enabled: boolean, timeMin?: string, timeMax?: string) {
  return useQuery({
    queryKey: ['calendar-events', timeMin, timeMax],
    queryFn: () => callGoogleApi('calendar.list', { timeMin, timeMax }),
    enabled,
    refetchInterval: 120000,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { summary: string; description?: string; start: string; end: string; allDay?: boolean }) =>
      callGoogleApi('calendar.create', params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setLoading(false);

      // Capture Google provider tokens on sign-in
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.provider_token) {
        const userId = session.user.id;
        const providerToken = session.provider_token;
        const providerRefreshToken = session.provider_refresh_token;

        // Store tokens in database (upsert)
        setTimeout(async () => {
          try {
            const { data: existing } = await supabase
              .from('google_tokens')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();

            if (existing) {
              await supabase.from('google_tokens').update({
                access_token: providerToken,
                refresh_token: providerRefreshToken || undefined,
                expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
              }).eq('user_id', userId);
            } else {
              await supabase.from('google_tokens').insert({
                user_id: userId,
                access_token: providerToken,
                refresh_token: providerRefreshToken || null,
                expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
              });
            }
          } catch (err) {
            console.error('Failed to store Google tokens:', err);
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

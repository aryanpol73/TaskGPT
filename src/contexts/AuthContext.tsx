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

const getAuthParams = () => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
  const code = searchParams.get('code');

  return { accessToken, refreshToken, code };
};

const clearAuthParamsFromUrl = () => {
  const url = new URL(window.location.href);
  ['access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type', 'provider_token', 'provider_refresh_token', 'code'].forEach((key) => {
    url.searchParams.delete(key);
  });
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
};

const storeOAuthSessionFromUrl = async () => {
  const { accessToken, refreshToken, code } = getAuthParams();

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    clearAuthParamsFromUrl();
    return data.session;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    clearAuthParamsFromUrl();
    return data.session;
  }

  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up listener FIRST so we never miss an auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    const syncSession = async () => {
      try {
        const oauthSession = await storeOAuthSessionFromUrl();
        if (oauthSession) {
          if (mounted) setSession(oauthSession);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setSession(session);
      } catch (error) {
        console.error('Auth session sync failed:', error);
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setSession(session);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Then process OAuth return params before protected routes can redirect
    syncSession();

    // Re-check session when window regains focus (helps after OAuth redirects)
    const onFocus = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    };
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
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

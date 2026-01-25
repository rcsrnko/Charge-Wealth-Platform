import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN' && session) {
          try {
            await fetch('/api/auth/supabase-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                accessToken: session.access_token,
                user: {
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
                  avatar: session.user.user_metadata?.avatar_url,
                }
              })
            });
          } catch (error) {
            console.error('Failed to sync session with backend:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await fetch('/api/logout', { credentials: 'include' });
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
}

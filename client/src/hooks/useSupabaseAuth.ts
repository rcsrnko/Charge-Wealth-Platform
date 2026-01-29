import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

async function syncSessionWithBackend(session: Session) {
  try {
    console.log('[Auth] Syncing session with backend for:', session.user.email);
    const response = await fetch('/api/auth/supabase-sync', {
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
    const data = await response.json();
    console.log('[Auth] Backend sync result:', data);
    return data;
  } catch (error) {
    console.error('[Auth] Failed to sync session with backend:', error);
    return null;
  }
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncedRef = useRef(false);

  useEffect(() => {
    // Get initial session and sync if exists
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Sync on initial load if session exists and hasn't been synced
      if (session && !syncedRef.current) {
        syncedRef.current = true;
        await syncSessionWithBackend(session);
      }
      
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Sync on sign in or token refresh
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
          if (!syncedRef.current) {
            syncedRef.current = true;
            await syncSessionWithBackend(session);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          syncedRef.current = false;
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

  const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });
    if (error) throw error;
    return data;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
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
    signUpWithEmail,
    signInWithEmail,
    signOut,
  };
}

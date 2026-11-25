'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (!newSession) {
        // Clear all TanStack query private data
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  const signInWithGoogle = async () => {
    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (err) {
      console.error('Failed to initiate Google login:', err);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
      setUser(null);
      setSession(null);
      router.push('/');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

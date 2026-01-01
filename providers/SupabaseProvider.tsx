/**
 * providers/SupabaseProvider.tsx
 *
 * 【責務】
 * Supabase Auth のセッションを監視し、ログイン/ログアウト用のハンドラと共にコンテキストで提供する。
 *
 * 【使用箇所】
 * - app/_layout.tsx の全体ラップ
 * - components/auth/AuthGate.tsx などでログインフォームを描画
 *
 * 【やらないこと】
 * - ドメインデータの読み込み
 *
 * 【他ファイルとの関係】
 * - lib/supabaseClient.ts で初期化したクライアントを利用する。
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabaseClient';

interface SupabaseContextValue {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  error?: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (isMounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setError(undefined);
        }
      } catch (authError) {
        console.error('[supabase] auth bootstrap error', authError);
        if (isMounted) {
          setError(authError instanceof Error ? authError.message : 'Supabase auth 初期化に失敗しました');
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(undefined);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      throw signInError;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(undefined);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      throw signUpError;
    }
    if (!data.session) {
      throw new Error('確認メールを送信しました。メールのリンクから認証後にログインしてください。');
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw signOutError;
    }
  }, []);

  const value = useMemo(
    () => ({ session, user, initializing, error, signIn, signUp, signOut }),
    [session, user, initializing, error, signIn, signUp, signOut],
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase は SupabaseProvider 配下でのみ利用してください');
  }
  return context;
}

/**
 * hooks/useSupabaseBootstrap.ts
 *
 * 【責務】
 * Supabase の匿名ユーザーが確立された後に、各 Zustand ストアへ初期データをロードさせる。
 *
 * 【使用箇所】
 * - app/_layout.tsx から呼び出し、UI を描画する前に同期状態を保証する。
 *
 * 【やらないこと】
 * - UI 描画
 * - ストア以外の副作用
 *
 * 【他ファイルとの関係】
 * - providers/SupabaseProvider.tsx から得られるユーザー情報に依存する。
 */

import { useEffect, useMemo, useState } from 'react';

import { useSupabase } from '@/providers/SupabaseProvider';
import { useMenuPresetStore } from '@/hooks/useMenuPresetStore';
import { useBodyDataStore } from '@/hooks/useBodyDataStore';
import { useCalorieStore } from '@/hooks/useCalorieStore';

interface BootstrapState {
  ready: boolean;
  error?: string;
}

export function useSupabaseBootstrap(): BootstrapState {
  const { user, initializing: authInitializing, error: authError } = useSupabase();
  const initializePresets = useMenuPresetStore(state => state.initialize);
  const presetsReady = useMenuPresetStore(state => state.hasInitialized);
  const initializeBody = useBodyDataStore(state => state.initialize);
  const bodyReady = useBodyDataStore(state => state.hasInitialized);
  const initializeCalories = useCalorieStore(state => state.initialize);
  const caloriesReady = useCalorieStore(state => state.hasInitialized);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!user || authInitializing) return;
      try {
        await Promise.all([
          initializePresets(user.id),
          initializeBody(user.id),
          initializeCalories(user.id),
        ]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Supabase データ同期に失敗しました');
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [user, authInitializing, initializePresets, initializeBody, initializeCalories]);

  useEffect(() => {
    if (!user) {
      setError(undefined);
    }
  }, [user]);

  const ready = useMemo(
    () => Boolean(user) && !authInitializing && presetsReady && bodyReady && caloriesReady,
    [user, authInitializing, presetsReady, bodyReady, caloriesReady],
  );

  return { ready, error: error ?? authError };
}

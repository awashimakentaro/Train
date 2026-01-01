/**
 * lib/supabaseClient.ts
 *
 * 【責務】
 * Supabase SDK を初期化し、アプリ全体から共有できるクライアントインスタンスを提供する。
 *
 * 【使用箇所】
 * - providers/SupabaseProvider.tsx
 * - hooks/useSupabaseBootstrap.ts
 * - 各ドメインストアの CRUD 実装
 *
 * 【やらないこと】
 * - 認証状態の管理
 * - ドメイン固有のリクエストロジック
 *
 * 【他ファイルとの関係】
 * - providers/SupabaseProvider.tsx が本クライアントに依存し、Auth セッションを制御する。
 */

import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL または EXPO_PUBLIC_SUPABASE_ANON_KEY が未設定です。');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
    autoRefreshToken: true,
  },
});

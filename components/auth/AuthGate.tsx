/**
 * components/auth/AuthGate.tsx
 *
 * 【責務】
 * Supabase のログイン状態を判定し、未ログイン時はメール/パスワードのサインイン・サインアップ UI を表示する。
 *
 * 【使用箇所】
 * - app/_layout.tsx でアプリ全体を囲んで利用。
 *
 * 【やらないこと】
 * - ドメインデータの同期
 * - Supabase の初期化
 *
 * 【他ファイルとの関係】
 * - providers/SupabaseProvider.tsx が提供する signIn/signUp/signOut を呼び出す。
 */

import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/constants/design-tokens';
import { useSupabase } from '@/providers/SupabaseProvider';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { initializing, user, error, signIn, signUp } = useSupabase();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!email.trim() || !password.trim()) {
      setFormError('メールアドレスとパスワードを入力してください');
      return;
    }
    setSubmitting(true);
    setFormError(undefined);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (authError) {
      setFormError(authError instanceof Error ? authError.message : 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.blocker}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.blockerText}>Supabase と接続中です...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.blocker}>
        <Text style={styles.title}>ログインが必要です</Text>
        <Text style={styles.subtitle}>メールアドレスとパスワードでサインインしてください。</Text>
        {error ? <Text style={styles.errorLabel}>{error}</Text> : null}
        {formError ? <Text style={styles.errorLabel}>{formError}</Text> : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="メールアドレス"
          placeholderTextColor="#cbd5f5"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="パスワード"
          placeholderTextColor="#cbd5f5"
          style={styles.input}
          secureTextEntry
        />
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          accessibilityRole="button">
          <Text style={styles.primaryText}>{submitting ? '送信中...' : mode === 'signin' ? 'ログイン' : 'アカウント登録'}</Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} accessibilityRole="button">
          <Text style={styles.toggleText}>
            {mode === 'signin' ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの場合はこちら'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  blocker: {
    flex: 1,
    backgroundColor: '#03030a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
  blockerText: {
    color: '#fff',
    textAlign: 'center',
  },
  title: {
    color: '#fff',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  errorLabel: {
    color: '#f87171',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: tokens.radii.full,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
  toggleText: {
    color: '#c4b5fd',
    textDecorationLine: 'underline',
  },
});

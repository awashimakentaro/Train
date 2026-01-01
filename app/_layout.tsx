/**
 * app/_layout.tsx
 *
 * 【責務】
 * Expo Router 全体のルートレイアウトを定義し、SafeAreaProvider + 背景グラデーション + Stack ナビゲーションの枠組みを提供する。
 *
 * 【使用箇所】
 * - Expo Router により自動で読み込まれ、アプリ全画面の共通レイアウトとして機能する。
 *
 * 【やらないこと】
 * - 個別画面の UI や状態管理
 * - タブバーの構築（app/(tabs)/_layout.tsx が担当）
 *
 * 【他ファイルとの関係】
 * - hooks/use-color-scheme.ts で提供されるカラースキーム判定を利用する。
 * - constants/design-tokens.ts の背景グラデーションを参照してビジュアルを統一する。
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { tokens } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { useSupabaseBootstrap } from '@/hooks/useSupabaseBootstrap';
import { AuthGate } from '@/components/auth/AuthGate';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * RootLayout
 *
 * 【処理概要】
 * Expo Router の Stack を SafeAreaProvider と背景グラデーションで包み、ステータスバーのスタイルを一元制御する。
 *
 * 【呼び出し元】
 * Expo Router によりアプリ起動時に自動実行される。
 *
 * 【入力 / 出力】
 * 引数なし / 画面全体を構築する React 要素。
 *
 * 【副作用】
 * ThemeProvider のコンテキストを提供し、StatusBar の表示スタイルを設定する。
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';

  return (
    <SafeAreaProvider>
      <SupabaseProvider>
        <AuthGate>
          <BootstrapGate>
            <LinearGradient colors={tokens.gradients.appBackground} style={styles.background}>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false, contentStyle: styles.stackContent }}>
                  <Stack.Screen name="(tabs)" />
                </Stack>
                <StatusBar style={statusBarStyle} />
              </ThemeProvider>
            </LinearGradient>
          </BootstrapGate>
        </AuthGate>
      </SupabaseProvider>
    </SafeAreaProvider>
  );
}

interface BootstrapGateProps {
  children: ReactNode;
}

function BootstrapGate({ children }: BootstrapGateProps) {
  const { ready, error } = useSupabaseBootstrap();

  if (error) {
    return (
      <View style={styles.blocker}>
        <Text style={styles.blockerText}>データ同期に失敗しました: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.blocker}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.blockerText}>Supabase と同期中です...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  stackContent: {
    backgroundColor: 'transparent',
  },
  blocker: {
    flex: 1,
    backgroundColor: '#03030a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blockerText: {
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
});

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
import { StyleSheet } from 'react-native';

import { tokens } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
      <LinearGradient colors={tokens.gradients.appBackground} style={styles.background}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.stackContent }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style={statusBarStyle} />
        </ThemeProvider>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  stackContent: {
    backgroundColor: 'transparent',
  },
});

/**
 * app/index.tsx
 *
 * 【責務】
 * アプリ起動時に最初に実行されるルートで、メニュータブへ即時リダイレクトする。
 *
 * 【使用箇所】
 * - Expo Router により '/' アクセス時に読み込まれる。
 *
 * 【やらないこと】
 * - UI 描画
 * - 状態管理
 *
 * 【他ファイルとの関係】
 * - app/(tabs)/_layout.tsx に定義されたタブ構成へ遷移する。
 */

import { Redirect } from 'expo-router';

export default function RootRedirect() {
  return <Redirect href="/(tabs)/menu" />;
}

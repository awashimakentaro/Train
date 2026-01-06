/**
 * app/(tabs)/_layout.tsx
 *
 * 【責務】
 * Expo Router のタブグループを定義し、各タブ画面（メニュー/身体データ/カロリー）のメタ情報とカスタムタブバーを設定する。
 *
 * 【使用箇所】
 * - app/_layout.tsx から Stack 経由で読み込まれ、タブ遷移を提供する。
 *
 * 【やらないこと】
 * - 各画面の UI/状態管理
 * - タブ以外のナビゲーション構築
 *
 * 【他ファイルとの関係】
 * - components/navigation/MainTabBar.tsx を利用してタブバーを描画する。
 */

import { Tabs } from 'expo-router';

import { MainTabBar } from '@/components/navigation/MainTabBar';

/**
 * TabLayout
 *
 * 【処理概要】
 * 3 つのタブ画面（メニュー / 身体データ / カロリー）を登録し、
 * タイトルやアクセシビリティラベルを付与する。
 *
 * 【呼び出し元】
 * Expo Router により app/_layout.tsx から自動的に利用される。
 *
 * 【入力 / 出力】
 * 引数なし / Tabs コンポーネント。
 *
 * 【副作用】
 * なし。
 */
export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="menu"
      tabBar={props => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="menu" options={{ title: 'メニュー', tabBarAccessibilityLabel: 'メニュータブ' }} />
      <Tabs.Screen name="index" options={{ title: '身体データ', tabBarAccessibilityLabel: '身体データタブ' }} />
      <Tabs.Screen name="calories" options={{ title: 'カロリー', tabBarAccessibilityLabel: 'カロリータブ' }} />
      <Tabs.Screen
        name="training-session"
        options={{
          href: null,
          title: 'トレーニング',
        }}
      />
    </Tabs>
  );
}

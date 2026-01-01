/**
 * components/navigation/MainTabBar.tsx
 *
 * 【責務】
 * Expo Router のタブナビゲーションに表示するカスタムタブバーを描画し、
 * メニュー/身体データ/カロリーの 3 タブ導線を figuma のリズムで制御する。
 *
 * 【使用箇所】
 * - app/(tabs)/_layout.tsx から `tabBar` オプションとして参照される。
 *
 * 【やらないこと】
 * - タブごとの画面内容やビジネスロジック
 * - グローバル状態の管理
 *
 * 【他ファイルとの関係】
 * - constants/design-tokens.ts のトークンを参照しスタイルを統一する。
 */

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tokens } from '@/constants/design-tokens';

const TAB_META: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  menu: { icon: 'grid', label: 'メニュー' },
  index: { icon: 'activity', label: '身体データ' },
  calories: { icon: 'pie-chart', label: 'カロリー' },
  'training-session': { icon: 'clock', label: 'タイマー' },
};

/**
 * MainTabBar
 *
 * 【処理概要】
 * 受け取ったタブ状態を元に Pressable リストを構築し、選択タブは強調表示、
 * 未選択タブはアイコンのみ淡色表示で描画する。
 *
 * 【呼び出し元】
 * app/(tabs)/_layout.tsx の Tabs コンポーネントから自動で呼び出される。
 *
 * 【入力 / 出力】
 * BottomTabBarProps / JSX.Element。
 *
 * 【副作用】
 * navigation.navigate によりタブ遷移を実行する。
 */
export function MainTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={tokens.gradients.tabBar} style={[styles.container, { paddingBottom: Math.max(insets.bottom, tokens.spacing.sm) }] }>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] ?? { icon: 'circle', label: route.name };
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
              accessibilityRole="button"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? meta.label}
              accessibilityState={isFocused ? { selected: true } : {}}>
              <Feather
                name={meta.icon}
                size={24}
                color={isFocused ? tokens.palette.textPrimary : tokens.palette.textTertiary}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    paddingHorizontal: tokens.spacing.lg,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    gap: 4,
  },
  tabActive: {
    borderRadius: tokens.radii.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    fontSize: tokens.typography.caption,
    color: tokens.palette.textTertiary,
  },
  labelActive: {
    color: tokens.palette.textPrimary,
    fontWeight: '600',
  },
});

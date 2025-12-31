/**
 * constants/design-tokens.ts
 *
 * 【責務】
 * アプリ全体で共有する色・余白・タイポグラフィ等のデザイントークンを単一の参照元として提供する。
 *
 * 【使用箇所】
 * - UI コンポーネントのスタイル指定
 * - 画面レイアウトの spacing / radius の共通化
 *
 * 【やらないこと】
 * - 動的テーマ切り替えの状態管理
 * - コンポーネント固有のスタイルロジック
 *
 * 【他ファイルとの関係】
 * - components/ 以下の各 UI コンポーネントが本トークンを参照して一貫性を保つ
 * - app/ 配下の画面で背景グラデーションなどを構築する際の基準値となる
 */

export const palette = {
  backgroundDeep: '#05060f',
  backgroundCard: '#111324',
  backgroundElevated: '#1a1d33',
  accentPurple: '#a855f7',
  accentPink: '#ec4899',
  accentBlue: '#38bdf8',
  accentGreen: '#10b981',
  accentOrange: '#fb923c',
  accentRed: '#ef4444',
  accentYellow: '#facc15',
  borderMuted: 'rgba(255,255,255,0.08)',
  textPrimary: '#f8fafc',
  textSecondary: 'rgba(248,250,252,0.7)',
  textTertiary: 'rgba(248,250,252,0.5)',
  shadow: 'rgba(3,5,19,0.8)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  mega: 40,
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  full: 999,
};

export const typography = {
  title: 28,
  subtitle: 20,
  body: 16,
  caption: 13,
  micro: 11,
  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemiBold: '600' as const,
  weightBold: '700' as const,
};

export const shadows = {
  card: {
    shadowColor: palette.shadow,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 10,
  },
};

export const gradients = {
  appBackground: ['#070912', '#05060f', '#03030a'],
  tabBar: ['rgba(8,10,25,0.95)', 'rgba(8,10,25,0.8)'],
  cardPurple: ['#4c1d95', '#7c3aed'],
};

export const tokens = {
  palette,
  spacing,
  radii,
  typography,
  shadows,
  gradients,
};

export type Tokens = typeof tokens;

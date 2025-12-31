/**
 * components/body-data/BodyDataCard.tsx
 *
 * 【責務】
 * 単一の身体データ項目（体重 / 体脂肪など）をカードとして表示し、値・トレンド・チャート・履歴ボタンをまとめる。
 *
 * 【使用箇所】
 * - Body タブのカード一覧
 *
 * 【やらないこと】
 * - データ取得やストア操作
 * - モーダル表示制御
 *
 * 【他ファイルとの関係】
 * - components/charts/Sparkline.tsx を使用して小型チャートを描画する。
 */

import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/constants/design-tokens';
import { Sparkline } from '@/components/charts/Sparkline';

interface BodyDataCardProps {
  title: string;
  value?: number;
  unit?: string;
  trend: number;
  series: number[];
  accentColor: string;
  onHistoryPress: () => void;
}

/**
 * formatValue
 *
 * 【処理概要】
 * undefined の場合はハイフンを返し、数値は小数 1 桁で整形する。
 *
 * 【呼び出し元】
 * BodyDataCard 内。
 *
 * 【入力 / 出力】
 * number | undefined / string。
 *
 * 【副作用】
 * なし。
 */
function formatValue(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

/**
 * BodyDataCard
 *
 * 【処理概要】
 * 値やトレンド、履歴ボタンをまとめて表示するカードを返す。
 *
 * 【呼び出し元】
 * Body タブの FlatList 相当ロジック。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * なし。
 */
function BodyDataCardComponent({ title, value, unit, trend, series, accentColor, onHistoryPress }: BodyDataCardProps) {
  const trendSign = trend > 0 ? '+' : '';
  const trendColor = trend >= 0 ? accentColor : tokens.palette.accentBlue;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onHistoryPress} style={styles.historyButton} accessibilityRole="button">
          <Text style={styles.historyText}>履歴</Text>
        </Pressable>
      </View>
      <Text style={[styles.value, { color: accentColor }]}>
        {formatValue(value)}
        {unit ? <Text style={styles.unit}>{` ${unit}`}</Text> : null}
      </Text>
      <Text style={[styles.trend, { color: trendColor }]}>{`${trendSign}${trend.toFixed(1)} 昨日比`}</Text>
      <Sparkline values={series} color={accentColor} style={styles.chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.palette.backgroundCard,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  title: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  historyButton: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  historyText: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.caption,
  },
  value: {
    fontSize: 32,
    fontWeight: tokens.typography.weightBold,
  },
  unit: {
    fontSize: tokens.typography.body,
    color: tokens.palette.textSecondary,
  },
  trend: {
    fontSize: tokens.typography.caption,
    marginBottom: tokens.spacing.md,
  },
  chart: {
    marginTop: tokens.spacing.sm,
  },
});

export const BodyDataCard = memo(BodyDataCardComponent);

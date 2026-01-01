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
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const arrowSymbol = isPositive ? '↗' : isNegative ? '↘' : '→';
  const trendColor = isPositive ? '#f97316' : isNegative ? '#10b981' : '#94a3b8';
  const sign = isPositive ? '+' : isNegative ? '-' : '';
  const delta = Math.abs(trend).toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onHistoryPress} accessibilityRole="button">
          <Text style={styles.historyText}>履歴</Text>
        </Pressable>
      </View>
      <View style={styles.contentRow}>
        <View style={styles.metaBlock}>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color: accentColor }]}>{formatValue(value)}</Text>
            {unit ? <Text style={styles.unit}>{unit}</Text> : null}
          </View>
          <View style={styles.trendRow}>
            <Text style={[styles.trendArrow, { color: trendColor }]}>{arrowSymbol}</Text>
            <Text style={[styles.trendValue, { color: trendColor }]}>{`${sign}${delta}`}</Text>
            <Text style={styles.trendUnit}>昨日比</Text>
          </View>
        </View>
        <Sparkline values={series} color={accentColor} style={styles.chart} width={96} height={32} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
    shadowColor: '#94a3b8',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  title: {
    color: '#475569',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  historyText: {
    color: '#a855f7',
    fontSize: tokens.typography.caption,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaBlock: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tokens.spacing.xs,
  },
  value: {
    fontSize: 36,
    fontWeight: tokens.typography.weightBold,
  },
  unit: {
    fontSize: tokens.typography.body,
    color: '#94a3b8',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendArrow: {
    fontSize: tokens.typography.body,
  },
  trendValue: {
    fontSize: tokens.typography.body,
    fontWeight: tokens.typography.weightMedium,
  },
  trendUnit: {
    fontSize: tokens.typography.caption,
    color: '#94a3b8',
  },
  chart: {
    marginTop: -tokens.spacing.sm,
  },
});

export const BodyDataCard = memo(BodyDataCardComponent);

/**
 * components/body-data/BodyTrendChart.tsx
 *
 * 【責務】
 * 身体データの履歴を折れ線グラフとして描画し、最近の変化を視覚化する。
 *
 * 【使用箇所】
 * - app/(tabs)/index.tsx のトレンドカード。
 *
 * 【やらないこと】
 * - データ取得やフォーマット。
 *
 * 【他ファイルとの関係】
 * - constants/design-tokens.ts のトークンを参照する。
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { tokens } from '@/constants/design-tokens';

export interface BodyTrendPoint {
  dateLabel: string;
  value: number;
}

interface BodyTrendChartProps {
  title: string;
  unit?: string;
  color: string;
  data: BodyTrendPoint[];
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const CHART_PADDING = 32;

function mapY(value: number, minValue: number, maxValue: number) {
  if (maxValue === minValue) return CHART_HEIGHT / 2;
  const ratio = (value - minValue) / (maxValue - minValue);
  return CHART_HEIGHT - ratio * (CHART_HEIGHT - CHART_PADDING) - CHART_PADDING / 2;
}

function mapX(index: number, length: number) {
  if (length <= 1) return CHART_WIDTH / 2;
  const step = (CHART_WIDTH - CHART_PADDING) / (length - 1);
  return CHART_PADDING / 2 + index * step;
}

function BodyTrendChartComponent({ title, unit, color, data }: BodyTrendChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>まだデータがありません</Text>
      </View>
    );
  }

  const values = data.map(point => point.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const pathD = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${mapX(index, data.length)},${mapY(point.value, minValue, maxValue)}`)
    .join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {unit ? <Text style={styles.unitLabel}>単位: {unit}</Text> : null}
        </View>
        <Text style={[styles.latestValue, { color }]}>{values[values.length - 1].toFixed(1)}</Text>
      </View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Line
          x1={CHART_PADDING / 2}
          y1={CHART_HEIGHT - CHART_PADDING / 2}
          x2={CHART_WIDTH - CHART_PADDING / 4}
          y2={CHART_HEIGHT - CHART_PADDING / 2}
          stroke="rgba(148,163,184,0.4)"
        />
        <Path d={pathD} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
        {data.map((point, index) => (
          <SvgText
            key={`${point.dateLabel}-${index}`}
            x={mapX(index, data.length)}
            y={CHART_HEIGHT - CHART_PADDING / 2 + 16}
            fontSize={10}
            fill="#94a3b8"
            textAnchor="middle">
            {point.dateLabel}
          </SvgText>
        ))}
      </Svg>
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
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    gap: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    color: '#0f172a',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  unitLabel: {
    color: '#94a3b8',
    fontSize: tokens.typography.caption,
  },
  latestValue: {
    fontSize: 28,
    fontWeight: tokens.typography.weightBold,
  },
  emptyText: {
    color: '#94a3b8',
  },
});

export const BodyTrendChart = memo(BodyTrendChartComponent);

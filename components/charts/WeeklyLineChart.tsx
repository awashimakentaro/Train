/**
 * components/charts/WeeklyLineChart.tsx
 *
 * 【責務】
 * カロリータブで使用する 1 週間のカロリー収支を折れ線チャートで描画する。
 *
 * 【使用箇所】
 * - app/(tabs)/calories.tsx
 *
 * 【やらないこと】
 * - データ取得
 *
 * 【他ファイルとの関係】
 * - constants/design-tokens.ts の色を使用
 */

import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { tokens } from '@/constants/design-tokens';

export interface WeeklyPoint {
  id: string;
  label: string;
  balance: number;
}

interface WeeklyLineChartProps {
  data: WeeklyPoint[];
}

const VIEWPORT_HEIGHT = 280;
const VIEWPORT_WIDTH = 320;
const WIDTH_SCALE = 1.35;
const CHART_HEIGHT = 200;
const CHART_WIDTH = VIEWPORT_WIDTH * WIDTH_SCALE;
const AXIS_BOTTOM_SPACE = 36;
const AXIS_LEFT_SPACE = 48;
const DRAW_HEIGHT = CHART_HEIGHT - AXIS_BOTTOM_SPACE;
const DRAW_WIDTH = CHART_WIDTH - AXIS_LEFT_SPACE;
const AXIS_TICK_COUNT = 4;
const AXIS_COLOR = '#94a3b8';
const AXIS_TEXT_COLOR = '#475569';
const AXIS_LABEL_COLOR = '#334155';
const GRID_COLOR = 'rgba(148,163,184,0.25)';
const AREA_COLOR_ID = 'balanceAreaGradient';

interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

/**
 * getXPosition
 *
 * 【処理概要】
 * インデックスとデータ数から X 座標を算出し、単一点の場合は中央へ配置する。
 *
 * 【呼び出し元】
 * buildLine, WeeklyLineChart。
 *
 * 【入力 / 出力】
 * index, total / number。
 *
 * 【副作用】
 * なし。
 */
function getXPosition(index: number, total: number) {
  if (total <= 1) {
    return AXIS_LEFT_SPACE + DRAW_WIDTH / 2;
  }
  const step = DRAW_WIDTH / (total - 1);
  return AXIS_LEFT_SPACE + index * step;
}

/**
 * mapValueToY
 *
 * 【処理概要】
 * 値を縦軸の座標へ変換し、最小値を底・最大値を天井にマッピングする。
 *
 * 【呼び出し元】
 * createChartPoints, WeeklyLineChart。
 *
 * 【入力 / 出力】
 * value, minValue, maxValue / number。
 *
 * 【副作用】
 * なし。
 */
function mapValueToY(value: number, minValue: number, maxValue: number) {
  if (maxValue === minValue) {
    return DRAW_HEIGHT / 2;
  }
  const ratio = (value - minValue) / (maxValue - minValue);
  return DRAW_HEIGHT - ratio * DRAW_HEIGHT;
}

/**
 * createChartPoints
 *
 * 【処理概要】
 * 値配列を描画用の座標列へ変換する。
 *
 * 【呼び出し元】
 * WeeklyLineChart。
 *
 * 【入力 / 出力】
 * values, minValue, maxValue / ChartPoint[]。
 *
 * 【副作用】
 * なし。
 */
function createChartPoints(values: number[], minValue: number, maxValue: number): ChartPoint[] {
  if (values.length === 0) return [];
  return values.map((value, index) => {
    const x = getXPosition(index, values.length);
    const y = mapValueToY(value, minValue, maxValue);
    return { x, y, value };
  });
}

/**
 * buildLine
 *
 * 【処理概要】
 * 計算済み座標列から折れ線 Path を生成する。
 *
 * 【呼び出し元】
 * WeeklyLineChart。
 *
 * 【入力 / 出力】
 * points, color / Path 要素。
 *
 * 【副作用】
 * なし。
 */
function buildLine(points: ChartPoint[], color: string) {
  if (points.length === 0) return null;
  const pathD = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  return <Path d={pathD} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />;
}

/**
 * buildArea
 *
 * 【処理概要】
 * 折れ線の下部を閉じる面積グラフ Path を返す。
 *
 * 【呼び出し元】
 * WeeklyLineChart。
 *
 * 【入力 / 出力】
 * points, baselineY, gradientId / Path 要素。
 *
 * 【副作用】
 * なし。
 */
function buildArea(points: ChartPoint[], baselineY: number, gradientId: string) {
  if (points.length === 0) return null;
  const start = points[0];
  const end = points[points.length - 1];
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const areaPath = `${linePath} L${end.x},${baselineY} L${start.x},${baselineY} Z`;
  return <Path d={areaPath} fill={`url(#${gradientId})`} opacity={0.9} />;
}

/**
 * WeeklyLineChart
 *
 * 【処理概要】
 * カロリー収支の折れ線、軸ラベル/目盛り、ゼロ基準線を描画し、横方向スクロールで広い領域を確認できるようにする。
 *
 * 【呼び出し元】
 * カロリータブ。
 *
 * 【入力 / 出力】
 * data / JSX.Element。
 *
 * 【副作用】
 * なし。
 */
function WeeklyLineChartComponent({ data }: WeeklyLineChartProps) {
  const balances = data.map(point => point.balance);
  const maxBalance = balances.length ? Math.max(...balances) : 0;
  const minBalance = balances.length ? Math.min(...balances) : 0;
  const maxValue = Math.max(maxBalance, 0);
  const minValue = Math.min(minBalance, 0);
  const axisTicks = Array.from({ length: AXIS_TICK_COUNT + 1 }, (_, index) => {
    const ratio = index / AXIS_TICK_COUNT;
    const value = Math.round((maxValue - minValue) * ratio + minValue);
    const y = mapValueToY(value, minValue, maxValue);
    return { value, y, index };
  });
  const zeroBaselineY = mapValueToY(0, minValue, maxValue);
  const balancePoints = createChartPoints(balances, minValue, maxValue);

  return (
    <View style={styles.container}>
      <View style={styles.surface}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chartScroll}
          contentContainerStyle={styles.chartScrollContent}>
          <View style={styles.chartCanvas}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id={AREA_COLOR_ID} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={tokens.palette.accentOrange} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={tokens.palette.accentOrange} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Line
                x1={AXIS_LEFT_SPACE}
                y1={0}
                x2={AXIS_LEFT_SPACE}
                y2={DRAW_HEIGHT}
                stroke={AXIS_COLOR}
                strokeWidth={1}
              />
              <Line
                x1={AXIS_LEFT_SPACE}
                y1={DRAW_HEIGHT}
                x2={CHART_WIDTH}
                y2={DRAW_HEIGHT}
                stroke={AXIS_COLOR}
                strokeWidth={1}
              />
              {axisTicks
                .filter(tick => tick.value !== 0)
                .map(tick => (
                  <Line
                    key={`grid-${tick.index}`}
                    x1={AXIS_LEFT_SPACE}
                    y1={tick.y}
                    x2={CHART_WIDTH}
                    y2={tick.y}
                    stroke={GRID_COLOR}
                    strokeWidth={1}
                  />
                ))}
              <Line
                x1={AXIS_LEFT_SPACE}
                y1={zeroBaselineY}
                x2={CHART_WIDTH}
                y2={zeroBaselineY}
                stroke={tokens.palette.accentBlue}
                strokeDasharray="4"
                strokeWidth={1}
              />
              {buildArea(balancePoints, zeroBaselineY, AREA_COLOR_ID)}
              {buildLine(balancePoints, tokens.palette.accentOrange)}
              {axisTicks.map(tick => (
                <SvgText
                  key={`tick-label-${tick.index}`}
                  x={AXIS_LEFT_SPACE - 6}
                  y={tick.y + 4}
                  fontSize={10}
                  fill={AXIS_TEXT_COLOR}
                  textAnchor="end">
                  {tick.value}
                </SvgText>
              ))}
              <SvgText
                x={12}
                y={DRAW_HEIGHT / 2}
                fontSize={11}
                fill={AXIS_LABEL_COLOR}
                transform={`rotate(-90 12 ${DRAW_HEIGHT / 2})`}>
                収支 (kcal)
              </SvgText>
              <SvgText
                x={(AXIS_LEFT_SPACE + CHART_WIDTH) / 2}
                y={CHART_HEIGHT - 6}
                fontSize={11}
                fill={AXIS_LABEL_COLOR}
                textAnchor="middle">
                日付
              </SvgText>
              {data.map((point, index) => (
                <SvgText
                  key={point.id}
                  x={getXPosition(index, data.length)}
                  y={DRAW_HEIGHT + 20}
                  fontSize={11}
                  fill={AXIS_TEXT_COLOR}
                  textAnchor="middle">
                  {point.label}
                </SvgText>
              ))}
            </Svg>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  surface: {
    width: '100%',
    borderRadius: tokens.radii.lg,
    backgroundColor: '#f8fafc',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148,163,184,0.5)',
    paddingVertical: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.md,
    shadowColor: 'rgba(15,23,42,0.15)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  chartScroll: {
    width: '100%',
    height: VIEWPORT_HEIGHT,
  },
  chartScrollContent: {
    width: CHART_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCanvas: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: 'center',
  },
});

export const WeeklyLineChart = memo(WeeklyLineChartComponent);

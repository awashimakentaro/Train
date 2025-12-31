/**
 * components/charts/WeeklyLineChart.tsx
 *
 * 【責務】
 * カロリータブで使用する摂取/消費の週次データを折れ線チャートとして描画する。
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
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { tokens } from '@/constants/design-tokens';

export interface WeeklyPoint {
  date: string;
  intake: number;
  burn: number;
}

interface WeeklyLineChartProps {
  data: WeeklyPoint[];
}

const CHART_HEIGHT = 160;
const CHART_WIDTH = 320;

/**
 * buildLine
 *
 * 【処理概要】
 * データ配列から折れ線の Path を生成する。
 *
 * 【呼び出し元】
 * WeeklyLineChart。
 *
 * 【入力 / 出力】
 * values, maxValue, color / Path 要素。
 *
 * 【副作用】
 * なし。
 */
function buildLine(values: number[], maxValue: number, color: string) {
  if (values.length === 0) return null;
  const stepX = values.length > 1 ? CHART_WIDTH / (values.length - 1) : CHART_WIDTH;
  const pathD = values
    .map((value, index) => {
      const x = index * stepX;
      const ratio = value / (maxValue || 1);
      const y = CHART_HEIGHT - ratio * CHART_HEIGHT;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
  return <Path d={pathD} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />;
}

/**
 * WeeklyLineChart
 *
 * 【処理概要】
 * 摂取(青)と消費(オレンジ)の折れ線と x 軸ラベルを描画する。
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
  const maxValue = Math.max(...data.flatMap(point => [point.intake, point.burn]), 1);
  const stepX = data.length > 1 ? CHART_WIDTH / (data.length - 1) : CHART_WIDTH;

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
        <Line x1={0} y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="rgba(255,255,255,0.1)" />
        {buildLine(
          data.map(point => point.intake),
          maxValue,
          tokens.palette.accentBlue,
        )}
        {buildLine(
          data.map(point => point.burn),
          maxValue,
          tokens.palette.accentOrange,
        )}
        {data.map((point, index) => (
          <SvgText
            key={point.date}
            x={index * stepX}
            y={CHART_HEIGHT + 18}
            fontSize={10}
            fill={tokens.palette.textTertiary}
            textAnchor="middle">
            {point.date.slice(5)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});

export const WeeklyLineChart = memo(WeeklyLineChartComponent);

/**
 * components/charts/Sparkline.tsx
 *
 * 【責務】
 * 数値配列をもとにシンプルなスパークラインチャートを描画し、カード上のトレンド可視化を担う。
 *
 * 【使用箇所】
 * - BodyDataCard でのトレンド表示
 *
 * 【やらないこと】
 * - 軸や凡例など複雑なチャート
 * - データフェッチ
 *
 * 【他ファイルとの関係】
 * - constants/design-tokens.ts の色設定を間接的に利用する。
 */

import { memo, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface SparklineProps {
  values: number[];
  color: string;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 32;

/**
 * buildPathD
 *
 * 【処理概要】
 * 値配列から SVG Path の d 属性を生成する。
 *
 * 【呼び出し元】
 * Sparkline コンポーネント。
 *
 * 【入力 / 出力】
 * values, width, height / path 文字列。
 *
 * 【副作用】
 * なし。
 */
function buildPathD(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return '';
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * stepX;
      const ratio = (value - min) / range;
      const y = height - ratio * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Sparkline
 *
 * 【処理概要】
 * SVG を用いて小型の折れ線+塗り面を描画する。
 *
 * 【呼び出し元】
 * BodyDataCard。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * なし。
 */
function SparklineComponent({ values, color, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, style }: SparklineProps) {
  const linePath = buildPathD(values, width, height);
  const gradientId = useMemo(() => `sparkline-${Math.random().toString(36).slice(2, 9)}`, []);

  if (!linePath) {
    return <View style={[styles.placeholder, { width, height }, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Path d={linePath} stroke={`url(#${gradientId})`} strokeWidth={4} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  placeholder: {
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderRadius: 999,
  },
});

export const Sparkline = memo(SparklineComponent);

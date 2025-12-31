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

import { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface SparklineProps {
  values: number[];
  color: string;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

const DEFAULT_WIDTH = 140;
const DEFAULT_HEIGHT = 48;

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
 * buildAreaPath
 *
 * 【処理概要】
 * スパークライン下部を塗るためのパス文字列を生成する。
 *
 * 【呼び出し元】
 * Sparkline コンポーネント。
 *
 * 【入力 / 出力】
 * values, width, height / path。
 *
 * 【副作用】
 * なし。
 */
function buildAreaPath(values: number[], width: number, height: number) {
  const linePath = buildPathD(values, width, height);
  if (!linePath) return '';
  const lastX = width;
  return `${linePath} L${lastX.toFixed(2)},${height} L0,${height} Z`;
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
  const areaPath = buildAreaPath(values, width, height);

  if (!linePath) {
    return <View style={[styles.placeholder, { width, height }, style]} />;
  }

  return (
    <View style={style}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {areaPath ? <Path d={areaPath} fill="url(#sparklineGradient)" /> : null}
        <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
});

export const Sparkline = memo(SparklineComponent);

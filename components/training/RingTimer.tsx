/**
 * components/training/RingTimer.tsx
 *
 * 【責務】
 * トレーニングタイマーの残り時間を円形プログレスとして描画する。
 *
 * 【使用箇所】
 * - app/(tabs)/training-session.tsx
 *
 * 【やらないこと】
 * - タイマー計測
 * - 状態遷移
 *
 * 【他ファイルとの関係】
 * - constants/design-tokens.ts の配色を利用
 */

import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { tokens } from '@/constants/design-tokens';

interface RingTimerProps {
  progress: number; // 0-1
  label: string;
  subLabel: string;
}

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * formatSubLabel
 *
 * 【処理概要】
 * 秒数ラベルなどをそのまま返却するが、欠損時には '--' を表示する。
 *
 * 【呼び出し元】
 * RingTimer 内。
 *
 * 【入力 / 出力】
 * string / string。
 *
 * 【副作用】
 * なし。
 */
function formatSubLabel(value: string) {
  return value || '--';
}

/**
 * RingTimer
 *
 * 【処理概要】
 * SVG Circle のストロークを利用して進捗リングを描画し、中央に文字列を表示する。
 *
 * 【呼び出し元】
 * トレーニング画面。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * なし。
 */
function RingTimerComponent({ progress, label, subLabel }: RingTimerProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = CIRCUMFERENCE - CIRCUMFERENCE * clamped;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          stroke="rgba(255,255,255,0.1)"
          fill="none"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
        />
        <Circle
          stroke={tokens.palette.accentGreen}
          fill="none"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subLabel}>{formatSubLabel(subLabel)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: tokens.spacing.lg,
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: tokens.palette.textPrimary,
    fontSize: 32,
    fontWeight: tokens.typography.weightBold,
  },
  subLabel: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.caption,
  },
});

export const RingTimer = memo(RingTimerComponent);

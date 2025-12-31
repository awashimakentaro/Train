/**
 * components/menu/StartTrainingCard.tsx
 *
 * 【責務】
 * メニュータブ下部に配置される「トレーニング開始」カードを描画し、利用可能な種目数と開始ボタンを提供する。
 *
 * 【使用箇所】
 * - app/(tabs)/menu.tsx のフッターセクション
 *
 * 【やらないこと】
 * - タイマー制御や状態管理
 *
 * 【他ファイルとの関係】
 * - useTrainingSession の startSession を呼び出すトリガーとして利用される。
 */

import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { tokens } from '@/constants/design-tokens';

interface StartTrainingCardProps {
  enabledCount: number;
  onStart: () => void;
}

/**
 * StartTrainingCard
 *
 * 【処理概要】
 * 緑系グラデーションのカードに種目数と開始ボタンを併記する。
 */
function StartTrainingCardComponent({ enabledCount, onStart }: StartTrainingCardProps) {
  const disabled = enabledCount === 0;
  return (
    <LinearGradient colors={['#22d3ee', '#14b8a6']} style={styles.card}>
      <View>
        <Text style={styles.title}>トレーニング開始</Text>
        <Text style={styles.subtitle}>実施予定 {enabledCount} 種目</Text>
      </View>
      <Pressable
        onPress={onStart}
        disabled={disabled}
        style={[styles.button, disabled && styles.buttonDisabled]}
        accessibilityRole="button">
        <Text style={styles.buttonText}>スタート</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  subtitle: {
    color: '#d1fae5',
    marginTop: tokens.spacing.xs,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.full,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

export const StartTrainingCard = memo(StartTrainingCardComponent);

/**
 * components/menu/ExerciseCard.tsx
 *
 * 【責務】
 * メニュータブで表示する各種目カードを描画し、セット/重量などの値をインラインで調整できるようにする。
 *
 * 【使用箇所】
 * - app/(tabs)/menu.tsx
 *
 * 【やらないこと】
 * - Zustand ストアの直接管理
 * - 新規作成モーダルの表示
 *
 * 【他ファイルとの関係】
 * - hooks/useMenuPresetStore.ts の Exercise 型を利用
 */

import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { tokens } from '@/constants/design-tokens';
import { Exercise } from '@/hooks/useMenuPresetStore';

interface ExerciseCardProps {
  exercise: Exercise;
  onChange: (id: string, updates: Partial<Exercise>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

const NUMBER_FIELDS: { key: keyof Exercise; label: string; unit?: string }[] = [
  { key: 'sets', label: 'セット数', unit: 'セット' },
  { key: 'reps', label: 'レップ数', unit: 'レップ' },
  { key: 'weight', label: '重量', unit: 'kg' },
  { key: 'restSeconds', label: '休憩時間', unit: '秒' },
  { key: 'trainingSeconds', label: 'トレーニング時間', unit: '秒' },
];

/**
 * formatNumber
 *
 * 【処理概要】
 * 数値を整数として表示するために整形する。
 *
 * 【呼び出し元】
 * adjustButtons 内。
 *
 * 【入力 / 出力】
 * number / string。
 *
 * 【副作用】
 * なし。
 */
function formatNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

/**
 * ExerciseCard
 *
 * 【処理概要】
 * 種目名・有効切替・主要パラメータのステッパー UI をまとめて表示する。
 *
 * 【呼び出し元】
 * メニュータブの一覧。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * なし（押下時に親コールバックを通して状態変更）。
 */
function ExerciseCardComponent({ exercise, onChange, onRemove, onToggle }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  /**
   * adjustField
   *
   * 【処理概要】
   * 指定フィールドへ加算/減算を適用し onChange を呼び出す。
   *
   * 【呼び出し元】
   * 各ステッパーボタン。
   *
   * 【入力 / 出力】
   * key, delta / なし。
   *
   * 【副作用】
   * 親コールバックを実行。
   */
  const handleInputChange = (key: keyof Exercise, text: string) => {
    const numericValue = Number(text.replace(/[^0-9.]/g, ''));
    onChange(exercise.id, { [key]: Number.isNaN(numericValue) ? 0 : numericValue } as Partial<Exercise>);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable style={styles.headerMain} onPress={() => onToggle(exercise.id)} accessibilityRole="button">
          <View style={[styles.checkBox, exercise.enabled && styles.checkBoxActive]}>
            {exercise.enabled ? <Feather name="check" size={20} color="#fff" /> : null}
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.meta}>{exercise.focusArea.toUpperCase()}</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setExpanded(prev => !prev)} accessibilityRole="button">
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#0f172a"
          />
        </Pressable>
      </View>
      {expanded ? (
        <>
          <View style={styles.fieldGrid}>
            {NUMBER_FIELDS.map(field => (
              <View key={field.key as string} style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    value={String(formatNumber(exercise[field.key] as number))}
                    onChangeText={text => handleInputChange(field.key, text)}
                    keyboardType="numeric"
                    style={styles.numberInput}
                  />
                  {field.suffix ? <Text style={styles.suffix}>{field.suffix}</Text> : null}
                </View>
              </View>
            ))}
          </View>
          <Pressable onPress={() => onRemove(exercise.id)} style={styles.removeButton} accessibilityRole="button">
            <Text style={styles.removeText}>削除</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: tokens.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    flex: 1,
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tokens.palette.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkBoxActive: {
    backgroundColor: tokens.palette.accentPurple,
  },
  headerTextBlock: {
    flex: 1,
  },
  name: {
    color: '#0f172a',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  meta: {
    color: '#475569',
    fontSize: tokens.typography.caption,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  fieldItem: {
    width: '48%',
  },
  fieldLabel: {
    color: tokens.palette.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.sm,
  },
  numberInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: tokens.typography.body,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.xs,
  },
  suffix: {
    color: '#475569',
    fontSize: tokens.typography.caption,
    marginLeft: tokens.spacing.xs,
  },
  removeButton: {
    marginTop: tokens.spacing.md,
    alignSelf: 'flex-end',
  },
  removeText: {
    color: tokens.palette.accentRed,
    fontWeight: tokens.typography.weightMedium,
  },
});

export const ExerciseCard = memo(ExerciseCardComponent);

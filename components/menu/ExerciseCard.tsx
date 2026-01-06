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
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { tokens } from '@/constants/design-tokens';
import { Exercise } from '@/hooks/useMenuPresetStore';

interface ExerciseCardProps {
  exercise: Exercise;
  onChange: (id: string, updates: Partial<Exercise>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
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
function ExerciseCardComponent({ exercise, onChange, onRemove, onToggle, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: ExerciseCardProps) {
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
    onChange(exercise.id, { [key]: Number.isNaN(numericValue) ? 0 : numericValue } as Partial<Exercise>).catch(err => {
      Alert.alert('更新に失敗しました', err instanceof Error ? err.message : '不明なエラー');
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.headerMain}
          onPress={() =>
            onToggle(exercise.id).catch(err =>
              Alert.alert('更新に失敗しました', err instanceof Error ? err.message : '不明なエラー'),
            )
          }
          accessibilityRole="button">
          <View style={[styles.checkBox, exercise.enabled && styles.checkBoxActive]}>
            {exercise.enabled ? <Feather name="check" size={20} color="#fff" /> : null}
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.meta}>{exercise.focusArea.toUpperCase()}</Text>
          </View>
        </Pressable>
        <View style={styles.orderControls}>
          <Pressable
            onPress={onMoveUp}
            disabled={!canMoveUp}
            style={[styles.orderButton, !canMoveUp && styles.orderButtonDisabled]}
            accessibilityRole="button">
            <Feather name="arrow-up" size={16} color={canMoveUp ? '#475569' : '#cbd5f5'} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={!canMoveDown}
            style={[styles.orderButton, !canMoveDown && styles.orderButtonDisabled]}
            accessibilityRole="button">
            <Feather name="arrow-down" size={16} color={canMoveDown ? '#475569' : '#cbd5f5'} />
          </Pressable>
        </View>
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
                  {field.unit ? <Text style={styles.suffix}>{field.unit}</Text> : null}
                </View>
              </View>
            ))}
          </View>
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>トレーニングメモ</Text>
            <TextInput
              value={exercise.note ?? ''}
              onChangeText={text => onChange(exercise.id, { note: text })}
              placeholder="フォームやリマインドを記録"
              placeholderTextColor={tokens.palette.textTertiary}
              multiline
              style={styles.noteInput}
            />
          </View>
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>YouTube リンク</Text>
            <TextInput
              value={exercise.youtubeUrl ?? ''}
              onChangeText={text => onChange(exercise.id, { youtubeUrl: text })}
              placeholder="https://youtu.be/..."
              autoCapitalize="none"
              keyboardType="url"
              style={styles.linkInput}
            />
          </View>
          <Pressable
            onPress={() =>
              onRemove(exercise.id).catch(err =>
                Alert.alert('削除に失敗しました', err instanceof Error ? err.message : '不明なエラー'),
              )
            }
            style={styles.removeButton}
            accessibilityRole="button">
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
  orderControls: {
    flexDirection: 'column',
    gap: 2,
    marginRight: tokens.spacing.xs,
  },
  orderButton: {
    padding: tokens.spacing.xs,
    borderRadius: tokens.radii.sm,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  orderButtonDisabled: {
    backgroundColor: '#f8fafc',
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
  noteSection: {
    marginTop: tokens.spacing.md,
  },
  noteLabel: {
    color: '#334155',
    marginBottom: tokens.spacing.xs,
    fontSize: tokens.typography.caption,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 96,
    textAlignVertical: 'top',
  },
  linkInput: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
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

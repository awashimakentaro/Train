/**
 * components/menu/CreateExerciseModal.tsx
 *
 * 【責務】
 * 種目追加用のフォームモーダルを表示し、入力値を親へ渡す。
 *
 * 【使用箇所】
 * - app/(tabs)/menu.tsx
 *
 * 【やらないこと】
 * - ストアの直接変更
 * - バリデーションメッセージ表示
 *
 * 【他ファイルとの関係】
 * - hooks/useMenuPresetStore.ts の addExercise を呼び出すための値を組み立てる。
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/constants/design-tokens';
import { Exercise } from '@/hooks/useMenuPresetStore';

interface CreateExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: Omit<Exercise, 'id'>) => void;
}

const INITIAL_FORM = {
  name: '',
  sets: '3',
  reps: '8',
  weight: '40',
  restSeconds: '90',
  trainingSeconds: '60',
  focusArea: 'push' as Exercise['focusArea'],
};

/**
 * CreateExerciseModal
 *
 * 【処理概要】
 * 種目追加フォームを描画し、送信時に数値へ変換して親コンポーネントへ渡す。
 *
 * 【呼び出し元】
 * メニュータブ。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * 送信時に内部フォームをリセット。
 */
export function CreateExerciseModal({ visible, onClose, onSubmit }: CreateExerciseModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);

  /**
   * handleSubmit
   *
   * 【処理概要】
   * 入力値を数値に変換し onSubmit を実行、フォームを初期化する。
   *
   * 【呼び出し元】
   * 保存ボタン。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * フォーム state を初期値へ戻す。
   */
  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      sets: Number(form.sets) || 3,
      reps: Number(form.reps) || 8,
      weight: Number(form.weight) || 0,
      restSeconds: Number(form.restSeconds) || 60,
      trainingSeconds: Number(form.trainingSeconds) || 60,
      focusArea: form.focusArea ?? 'push',
      note: '',
      enabled: true,
      youtubeUrl: undefined,
    });
    setForm(INITIAL_FORM);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>種目を追加</Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>種目名</Text>
            <TextInput
              value={form.name}
              onChangeText={text => setForm(prev => ({ ...prev, name: text }))}
              placeholder="ベンチプレス"
              placeholderTextColor={tokens.palette.textTertiary}
              style={styles.input}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.fieldBlockHalf}>
              <Text style={styles.label}>セット</Text>
              <TextInput
                value={form.sets}
                onChangeText={text => setForm(prev => ({ ...prev, sets: text }))}
                placeholder="3"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldBlockHalf}>
              <Text style={styles.label}>レップ</Text>
              <TextInput
                value={form.reps}
                onChangeText={text => setForm(prev => ({ ...prev, reps: text }))}
                placeholder="8"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.fieldBlockHalf}>
              <Text style={styles.label}>重量 (kg)</Text>
              <TextInput
                value={form.weight}
                onChangeText={text => setForm(prev => ({ ...prev, weight: text }))}
                placeholder="40"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldBlockHalf}>
              <Text style={styles.label}>休憩 (秒)</Text>
              <TextInput
                value={form.restSeconds}
                onChangeText={text => setForm(prev => ({ ...prev, restSeconds: text }))}
                placeholder="90"
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>トレーニング時間 (秒)</Text>
            <TextInput
              value={form.trainingSeconds}
              onChangeText={text => setForm(prev => ({ ...prev, trainingSeconds: text }))}
              placeholder="60"
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.button, styles.secondary]}>
              <Text style={styles.secondaryText}>閉じる</Text>
            </Pressable>
            <Pressable onPress={handleSubmit} style={[styles.button, styles.primary]}>
              <Text style={styles.primaryText}>追加</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  sheet: {
    backgroundColor: tokens.palette.backgroundElevated,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    padding: tokens.spacing.lg,
  },
  title: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
    marginBottom: tokens.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: tokens.palette.textPrimary,
    marginBottom: tokens.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  fieldBlock: {
    marginBottom: tokens.spacing.md,
  },
  fieldBlockHalf: {
    flex: 1,
  },
  label: {
    color: tokens.palette.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  focusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  focusChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  focusChipActive: {
    backgroundColor: tokens.palette.accentBlue,
    borderColor: tokens.palette.accentBlue,
  },
  focusText: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.caption,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
  },
  secondary: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  secondaryText: {
    color: tokens.palette.textSecondary,
  },
  primary: {
    backgroundColor: tokens.palette.accentPurple,
  },
  primaryText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

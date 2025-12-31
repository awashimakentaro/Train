/**
 * components/menu/CreateMenuModal.tsx
 *
 * 【責務】
 * 新しいメニュー（プリセット）の作成フローをモーダルとして提供し、メニュー名と初期種目を入力させる。
 *
 * 【使用箇所】
 * - app/(tabs)/menu.tsx の「新しいメニューを作成」ボタン
 *
 * 【やらないこと】
 * - Zustand ストアへの直接書き込み（親から渡される onCreate が担当）
 *
 * 【他ファイルとの関係】
 * - hooks/useMenuPresetStore.ts で定義された createPreset に渡すための payload を構築
 */

import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/constants/design-tokens';

export interface DraftExercisePayload {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  trainingSeconds: number;
}

interface CreateMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; exercises: DraftExercisePayload[] }) => void;
}

const DEFAULT_EXERCISE: DraftExercisePayload = {
  name: '',
  sets: 3,
  reps: 10,
  weight: 0,
  restSeconds: 60,
  trainingSeconds: 60,
};

/**
 * CreateMenuModal
 *
 * 【処理概要】
 * メニュー名と種目情報を入力する UI を表示し、「メニューを作成」押下時に親へ値を返す。
 *
 * 【呼び出し元】
 * MenuScreen。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * 状態リセットのみ。
 */
export function CreateMenuModal({ visible, onClose, onCreate }: CreateMenuModalProps) {
  const [menuName, setMenuName] = useState('');
  const [draftExercises, setDraftExercises] = useState<DraftExercisePayload[]>([]);
  const [editingExercise, setEditingExercise] = useState<DraftExercisePayload>(DEFAULT_EXERCISE);
  const [isAdding, setIsAdding] = useState(false);

  const isCreateDisabled = useMemo(() => menuName.trim().length === 0 || draftExercises.length === 0, [menuName, draftExercises]);

  /**
   * resetModal
   *
   * 【処理概要】
   * フォームを初期状態へ戻す。
   */
  const resetModal = () => {
    setMenuName('');
    setDraftExercises([]);
    setEditingExercise(DEFAULT_EXERCISE);
    setIsAdding(false);
  };

  /**
   * addExerciseDraft
   *
   * 【処理概要】
   * 入力中の種目をドラフト配列へ追加する。
   */
  const addExerciseDraft = () => {
    if (!editingExercise.name.trim()) return;
    setDraftExercises(prev => [...prev, { ...editingExercise, name: editingExercise.name.trim() }]);
    setEditingExercise(DEFAULT_EXERCISE);
    setIsAdding(false);
  };

  /**
   * removeDraft
   *
   * 【処理概要】
   * 指定位置のドラフト種目を削除する。
   */
  const removeDraft = (index: number) => {
    setDraftExercises(prev => prev.filter((_, idx) => idx !== index));
  };

  /**
   * handleCreate
   *
   * 【処理概要】
   * 入力結果を親へ渡し、モーダルを閉じる。
   */
  const handleCreate = () => {
    if (isCreateDisabled) return;
    onCreate({ name: menuName.trim(), exercises: draftExercises });
    resetModal();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        resetModal();
        onClose();
      }}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>メニュー管理</Text>
            <Pressable onPress={() => { resetModal(); onClose(); }} accessibilityRole="button">
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>メニュー名</Text>
              <TextInput
                value={menuName}
                onChangeText={setMenuName}
                placeholder="例: 胸・肩の日"
                placeholderTextColor={tokens.palette.textTertiary}
                style={styles.textInput}
              />
            </View>
            <View style={styles.fieldBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>種目リスト</Text>
                <Pressable onPress={() => setIsAdding(true)} accessibilityRole="button">
                  <Text style={styles.addExerciseText}>＋ 種目追加</Text>
                </Pressable>
              </View>
              {draftExercises.length === 0 ? (
                <View style={styles.placeholderBox}>
                  <Text style={styles.placeholderText}>種目を追加してください</Text>
                </View>
              ) : (
                <View style={{ gap: tokens.spacing.sm }}>
                  {draftExercises.map((exercise, index) => (
                    <View key={`${exercise.name}-${index}`} style={styles.exerciseChip}>
                      <View>
                        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.sets}セット / {exercise.reps}レップ / 休憩 {exercise.restSeconds}s / トレ {exercise.trainingSeconds}s / {exercise.weight}kg
                        </Text>
                      </View>
                      <Pressable onPress={() => removeDraft(index)} accessibilityRole="button">
                        <Text style={styles.removeText}>削除</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {isAdding ? (
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>種目を追加</Text>
                <TextInput
                  value={editingExercise.name}
                  onChangeText={text => setEditingExercise(prev => ({ ...prev, name: text }))}
                  placeholder="種目名"
                  placeholderTextColor={tokens.palette.textTertiary}
                  style={styles.textInput}
                />
                <View style={styles.inlineInputs}>
                  <View style={styles.inlineField}>
                    <Text style={styles.inlineLabel}>セット</Text>
                    <TextInput
                      value={String(editingExercise.sets)}
                      onChangeText={text => setEditingExercise(prev => ({ ...prev, sets: Number(text) || 0 }))}
                      keyboardType="number-pad"
                      style={styles.inlineInput}
                    />
                  </View>
                  <View style={styles.inlineField}>
                    <Text style={styles.inlineLabel}>レップ</Text>
                    <TextInput
                      value={String(editingExercise.reps)}
                      onChangeText={text => setEditingExercise(prev => ({ ...prev, reps: Number(text) || 0 }))}
                      keyboardType="number-pad"
                      style={styles.inlineInput}
                    />
                  </View>
                </View>
                <View style={styles.inlineInputs}>
                  <View style={styles.inlineField}>
                    <Text style={styles.inlineLabel}>重量 (kg)</Text>
                    <TextInput
                      value={String(editingExercise.weight)}
                      onChangeText={text => setEditingExercise(prev => ({ ...prev, weight: Number(text) || 0 }))}
                      keyboardType="number-pad"
                      style={styles.inlineInput}
                    />
                  </View>
                  <View style={styles.inlineField}>
                    <Text style={styles.inlineLabel}>休憩 (秒)</Text>
                    <TextInput
                      value={String(editingExercise.restSeconds)}
                      onChangeText={text => setEditingExercise(prev => ({ ...prev, restSeconds: Number(text) || 0 }))}
                      keyboardType="number-pad"
                      style={styles.inlineInput}
                    />
                  </View>
                </View>
                <View style={styles.inlineInputs}>
                  <View style={styles.inlineField}>
                    <Text style={styles.inlineLabel}>トレーニング時間 (秒)</Text>
                    <TextInput
                      value={String(editingExercise.trainingSeconds)}
                      onChangeText={text => setEditingExercise(prev => ({ ...prev, trainingSeconds: Number(text) || 0 }))}
                      keyboardType="number-pad"
                      style={styles.inlineInput}
                    />
                  </View>
                </View>
                <Pressable onPress={addExerciseDraft} style={styles.addConfirmButton} accessibilityRole="button">
                  <Text style={styles.primaryText}>この種目を追加</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
          <Pressable
            onPress={handleCreate}
            disabled={isCreateDisabled}
            style={[styles.createButton, isCreateDisabled && styles.createButtonDisabled]}
            accessibilityRole="button">
            <Text style={styles.createButtonText}>メニューを作成</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  sheet: {
    backgroundColor: tokens.palette.backgroundElevated,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: tokens.spacing.lg,
    backgroundColor: '#9333EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  closeText: {
    color: '#fff',
    fontSize: tokens.typography.subtitle,
  },
  content: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
  },
  fieldBlock: {
    gap: tokens.spacing.sm,
  },
  label: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
  },
  textInput: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: tokens.palette.textPrimary,
    backgroundColor: tokens.palette.backgroundCard,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addExerciseText: {
    color: tokens.palette.accentPink,
    fontWeight: tokens.typography.weightMedium,
  },
  placeholderBox: {
    marginTop: tokens.spacing.sm,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  placeholderText: {
    color: tokens.palette.textSecondary,
  },
  exerciseChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: tokens.palette.backgroundCard,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  exerciseTitle: {
    color: tokens.palette.textPrimary,
    fontWeight: tokens.typography.weightSemiBold,
  },
  exerciseMeta: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.caption,
  },
  removeText: {
    color: tokens.palette.accentRed,
    fontWeight: tokens.typography.weightMedium,
  },
  addForm: {
    marginTop: -tokens.spacing.sm,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    gap: tokens.spacing.sm,
  },
  addFormTitle: {
    color: tokens.palette.textPrimary,
    fontWeight: tokens.typography.weightSemiBold,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  inlineField: {
    flex: 1,
  },
  inlineLabel: {
    color: tokens.palette.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    color: tokens.palette.textPrimary,
    backgroundColor: tokens.palette.backgroundCard,
  },
  addConfirmButton: {
    backgroundColor: tokens.palette.accentBlue,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
  createButton: {
    margin: tokens.spacing.lg,
    marginTop: 0,
    backgroundColor: tokens.palette.accentPink,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

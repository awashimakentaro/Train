/**
 * app/(tabs)/menu.tsx
 *
 * 【責務】
 * メニュータブの画面を構築し、種目一覧の編集・追加を提供する。
 *
 * 【使用箇所】
 * - Expo Router のメニュータブ
 *
 * 【やらないこと】
 * - Zustand ストア定義
 *
 * 【他ファイルとの関係】
 * - components/menu/ 配下のカード・モーダルを利用
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseCard } from '@/components/menu/ExerciseCard';
import { StartTrainingCard } from '@/components/menu/StartTrainingCard';
import { CreateExerciseModal } from '@/components/menu/CreateExerciseModal';
import { CreateMenuModal, DraftExercisePayload } from '@/components/menu/CreateMenuModal';
import { tokens } from '@/constants/design-tokens';
import { Exercise, useMenuPresetStore } from '@/hooks/useMenuPresetStore';
import { useTrainingSession } from '@/hooks/useTrainingSession';
import { useRouter } from 'expo-router';

/**
 * MenuScreen
 *
 * 【処理概要】
 * アクティブプリセットの種目情報を取得し、カード一覧と追加モーダルを表示する。
 *
 * 【呼び出し元】
 * Expo Router。
 *
 * 【入力 / 出力】
 * なし / JSX.Element。
 *
 * 【副作用】
 * ストア更新アクション (add/update/remove)。
 */
export default function MenuScreen() {
  const {
    presets,
    activePresetId,
    getActivePreset,
    setActivePreset,
    createPreset,
    deletePreset,
    addExercise,
    updateExercise,
    removeExercise,
    toggleExercise,
  } = useMenuPresetStore();
  const { startSession, resetSession } = useTrainingSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const preset = getActivePreset();
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showCreateMenuModal, setShowCreateMenuModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const hasPreset = presets.length > 0;
  const hasExercises = preset.exercises.length > 0;
  const canAddExercises = hasPreset && preset.id !== 'preset_placeholder';
  const enabledCount = preset.exercises.filter(exercise => exercise.enabled).length;


  /**
   * handleAddExercise
   *
   * 【処理概要】
   * モーダルで入力された種目をストアへ追加し、モーダルを閉じる。
   *
   * 【呼び出し元】
   * CreateExerciseModal。
   *
   * 【入力 / 出力】
   * payload / なし。
   *
   * 【副作用】
   * addExercise を実行。
   */
  const handleAddExercise = (payload: Omit<Exercise, 'id'>) => {
    addExercise(payload);
    setShowExerciseModal(false);
  };

  /**
   * handleCreateMenu
   *
   * 【処理概要】
   * メニュー作成モーダルからの入力を受け取り、新しいプリセットとして保存する。
   */
  const handleCreateMenu = ({ name, exercises }: { name: string; exercises: DraftExercisePayload[] }) => {
    const normalized: Omit<Exercise, 'id'>[] = exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      restSeconds: ex.restSeconds,
      trainingSeconds: ex.trainingSeconds,
      focusArea: 'push',
      note: '',
      enabled: true,
    }));
    const id = createPreset({ name, exercises: normalized });
    setActivePreset(id);
    setShowCreateMenuModal(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + tokens.spacing.md }] }>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#7c3aed', '#ec4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconContainer}>
              <Feather name="activity" size={28} color="white" />
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroEyebrow}>カスタムプラン</Text>
              <Text style={styles.heroLabel}>メニューを整えてベストな1日へ</Text>
              <Text style={styles.heroSubText}>目的に合わせて種目をすぐ呼び出せます</Text>
            </View>
          </View>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroChip}>
              <Feather name="check-circle" size={16} color="#22c55e" />
              <Text style={styles.heroChipText}>有効 {enabledCount} 種目</Text>
            </View>
            <Pressable
              onPress={() => setShowCreateMenuModal(true)}
              style={styles.heroCta}
              accessibilityRole="button">
              <Feather name="plus" size={18} color="#7c3aed" />
              <Text style={styles.heroCtaText}>新しいメニュー</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={styles.sectionTitle}>メニュー選択</Text>
            <Text style={styles.sectionCaption}>プリセットから今日のプランを選びます</Text>
          </View>
          <Pressable
            onPress={() => setShowPresetPicker(true)}
            style={styles.dropdown}
            accessibilityRole="button">
            <View>
              <Text style={styles.dropdownLabel}>{preset.name}</Text>
              <Text style={styles.dropdownMeta}>{preset.exercises.length} 種目</Text>
            </View>
            <Feather name="chevron-down" size={20} color={tokens.palette.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>メニュー管理</Text>
            {canAddExercises ? (
              <Pressable
                onPress={() => setShowExerciseModal(true)}
                style={styles.inlineAddButton}
                accessibilityRole="button">
                <Feather name="plus" size={16} color={tokens.palette.accentBlue} />
                <Text style={styles.inlineAddText}>種目追加</Text>
              </Pressable>
            ) : null}
          </View>
          {!hasPreset ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>メニューがありません。「新しいメニューを作成」からスタートしてください。</Text>
            </View>
          ) : !hasExercises ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>種目がありません。種目追加からメニューを構成してください。</Text>
            </View>
          ) : (
            preset.exercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onChange={updateExercise}
                onRemove={removeExercise}
                onToggle={toggleExercise}
              />
            ))
          )}
        </View>
      </ScrollView>
      <CreateExerciseModal
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        onSubmit={handleAddExercise}
      />
      <CreateMenuModal
        visible={showCreateMenuModal}
        onClose={() => setShowCreateMenuModal(false)}
        onCreate={handleCreateMenu}
      />
      <Modal transparent animationType="fade" visible={showPresetPicker} onRequestClose={() => setShowPresetPicker(false)}>
        <View style={styles.presetOverlay}>
          <View style={styles.presetSheet}>
            <Text style={styles.presetSheetTitle}>メニューを選択</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {presets.map(current => {
                const isActive = current.id === activePresetId;
                return (
                  <Pressable
                    key={current.id}
                    onPress={() => {
                      setActivePreset(current.id);
                      setShowPresetPicker(false);
                    }}
                    style={[styles.presetOption, isActive && styles.presetOptionActive]}>
                    <View>
                      <Text style={[styles.presetName, isActive && styles.presetNameActive]}>{current.name}</Text>
                      <Text style={[styles.presetMeta, isActive && styles.presetMetaActive]}>{current.exercises.length}種目</Text>
                    </View>
                    <Pressable onPress={() => setConfirmDeleteId(current.id)} style={styles.deletePresetButton}>
                      <Feather name="trash-2" size={18} color={isActive ? '#fff' : tokens.palette.accentRed} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setShowPresetPicker(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {canAddExercises ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.startCardWrapper,
            { bottom: insets.bottom + tokens.spacing.md },
          ]}>
          <StartTrainingCard
            enabledCount={enabledCount}
            onStart={() => {
              if (enabledCount === 0) return;
              resetSession();
              startSession();
              router.push('/training-session');
            }}
          />
        </View>
      ) : null}
      {confirmDeleteId ? (
        <Modal transparent animationType="fade" visible onRequestClose={() => setConfirmDeleteId(null)}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmSheet}>
              <View style={styles.confirmIconWrapper}>
                <Feather name="trash-2" size={32} color={tokens.palette.accentRed} />
              </View>
              <Text style={styles.confirmTitle}>メニューを削除しますか？</Text>
              <Text style={styles.confirmText}>
                「{presets.find(preset => preset.id === confirmDeleteId)?.name ?? ''}」を削除します。この操作は取り消せません。
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  onPress={() => setConfirmDeleteId(null)}
                  style={[styles.confirmButton, styles.confirmCancel]}>
                  <Text style={styles.confirmCancelText}>キャンセル</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    deletePreset(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  style={[styles.confirmButton, styles.confirmDelete]}>
                  <Text style={styles.confirmDeleteText}>削除</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf4ff',
  },
  scroll: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.mega * 2.5,
  },
  heroCard: {
    borderRadius: 32,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.lg,
    shadowColor: '#4c1d95',
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  heroHeader: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    alignItems: 'center',
  },
  heroIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
  },
  heroTextBlock: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: tokens.typography.caption,
    letterSpacing: 0.5,
  },
  heroLabel: {
    color: '#fff',
    fontSize: 24,
    fontWeight: tokens.typography.weightSemiBold,
  },
  heroSubText: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: 'rgba(15,23,42,0.25)',
    borderRadius: tokens.radii.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
  heroChipText: {
    color: '#fff',
    fontWeight: tokens.typography.weightMedium,
  },
  heroCta: {
    backgroundColor: '#fff',
    borderRadius: tokens.radii.full,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    shadowColor: '#a855f7',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  heroCtaText: {
    color: '#7c3aed',
    fontWeight: tokens.typography.weightSemiBold,
  },
  section: {
    marginBottom: tokens.spacing.lg,
    gap: tokens.spacing.md,
    backgroundColor: '#fff',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    shadowColor: 'rgba(79,70,229,0.15)',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  sectionTop: {
    gap: tokens.spacing.xs,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  sectionCaption: {
    color: '#94a3b8',
    fontSize: tokens.typography.caption,
  },
  dropdown: {
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    padding: tokens.spacing.md,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownLabel: {
    color: '#1f2937',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  dropdownMeta: {
    color: '#475569',
  },
  presetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  presetCardActive: {
    backgroundColor: '#fff0fb',
    borderColor: '#c084fc',
  },
  presetName: {
    color: '#1f2937',
    fontSize: tokens.typography.body,
    fontWeight: tokens.typography.weightSemiBold,
  },
  presetNameActive: {
    color: '#1f2937',
  },
  presetMeta: {
    color: '#475569',
  },
  presetMetaActive: {
    color: '#475569',
  },
  deletePresetButton: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineAddButton: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  inlineAddText: {
    color: tokens.palette.accentBlue,
    fontWeight: tokens.typography.weightMedium,
  },
  emptyState: {
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.lg,
    backgroundColor: tokens.palette.backgroundCard,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  emptyText: {
    color: tokens.palette.textSecondary,
    textAlign: 'center',
  },
  startCardWrapper: {
    position: 'absolute',
    left: tokens.spacing.lg,
    right: tokens.spacing.lg,
    zIndex: 5,
  },
  presetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  presetSheet: {
    backgroundColor: '#fff',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  presetSheetTitle: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  presetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.palette.borderMuted,
  },
  presetOptionActive: {
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  modalCloseButton: {
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.full,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
  },
  modalCloseText: {
    color: tokens.palette.accentPurple,
    fontWeight: tokens.typography.weightMedium,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: tokens.spacing.lg,
    justifyContent: 'center',
  },
  confirmSheet: {
    backgroundColor: tokens.palette.backgroundCard,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  confirmIconWrapper: {
    alignSelf: 'center',
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.full,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  confirmTitle: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
    textAlign: 'center',
  },
  confirmText: {
    color: tokens.palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
  },
  confirmCancel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  confirmCancelText: {
    color: tokens.palette.textPrimary,
    fontWeight: tokens.typography.weightMedium,
  },
  confirmDelete: {
    backgroundColor: tokens.palette.accentRed,
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

/**
 * components/training/TrainingResultModal.tsx
 *
 * 【責務】
 * セッション完了後に結果サマリー（消費カロリー・時間・完了種目）を表示するモーダルを提供する。
 *
 * 【使用箇所】
 * - app/(tabs)/training-session.tsx でセッション完了時に呼び出される。
 *
 * 【やらないこと】
 * - Zustand の状態更新
 *
 * 【他ファイルとの関係】
 * - hooks/useTrainingSession.ts から渡されるログデータを表示する。
 */

import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { tokens } from '@/constants/design-tokens';
import { TrainingSessionLog } from '@/hooks/useTrainingSession';

interface TrainingResultModalProps {
  visible: boolean;
  log: TrainingSessionLog | null;
  onClose: () => void;
}

/**
 * TrainingResultModal
 *
 * 【処理概要】
 * 完了ログをカード形式で表示し、閉じるボタンを提供する。
 */
export function TrainingResultModal({ visible, log, onClose }: TrainingResultModalProps) {
  if (!log) return null;
  const pending = log.calorieEstimatePending;
  const perExerciseMap = pending ? null : buildPerExerciseCalorieMap(log);
  const providerLabel = pending
    ? 'AI 推定中'
    : log.calorieDetail.provider === 'openai'
      ? 'AI 推定値'
      : 'ベースライン推定';
  const providerMeta = pending
    ? 'AI で消費カロリーを算出しています'
    : log.calorieDetail.model
      ? `${providerLabel} (${log.calorieDetail.model})`
      : providerLabel;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.resultHeader}>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <Text style={styles.resultTitle}>お疲れ様でした！</Text>
            <Text style={styles.resultSubtitle}>{presetNameOrDefault(log)}</Text>
          </LinearGradient>
          <ScrollView
            contentContainerStyle={styles.resultContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {pending ? (
              <View style={styles.pendingCard}>
                <ActivityIndicator size="large" color={tokens.palette.accentOrange} />
                <Text style={styles.pendingText}>AI で消費カロリーを算出しています...</Text>
              </View>
            ) : (
              <>
                <View style={styles.totalCard}>
                  <Text style={styles.totalLabel}>総消費カロリー</Text>
                  <Text style={styles.totalValue}>{log.caloriesBurned}</Text>
                  <Text style={styles.totalUnit}>kcal</Text>
                  <Text style={styles.sourceTag}>{providerMeta}</Text>
                </View>
                <View style={styles.infoRow}>
                  <View style={[styles.infoCard, styles.infoBlue]}>
                    <Text style={styles.infoLabel}>トレーニング時間</Text>
                    <Text style={styles.infoValue}>{formatDuration(log.durationSeconds)}</Text>
                  </View>
                  <View style={[styles.infoCard, styles.infoPurple]}>
                    <Text style={styles.infoLabel}>完了種目</Text>
                    <Text style={styles.infoValue}>{log.exercises.length} 種目</Text>
                  </View>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailTitle}>種目別詳細</Text>
                  {log.exercises.map(exercise => (
                    <View key={exercise.id} style={styles.detailRow}>
                      <View>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.detailMeta}>
                          重量 {exercise.weight ?? 0} kg / {exercise.sets} セット
                        </Text>
                        {perExerciseMap?.[exercise.id]?.reasoning ? (
                          <Text style={styles.detailReason}>{perExerciseMap?.[exercise.id]?.reasoning}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.detailCalories}>{perExerciseMap?.[exercise.id]?.calories ?? 0} kcal</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            <Pressable onPress={onClose} style={styles.footerButton} accessibilityRole="button">
              <Text style={styles.footerButtonText}>完了</Text>
            </Pressable>
          </ScrollView>
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
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  resultHeader: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: tokens.spacing.md,
    right: tokens.spacing.md,
  },
  closeText: {
    color: '#fff',
    fontSize: 20,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    fontSize: 16,
  },
  resultContent: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  totalCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fb923c',
    padding: tokens.spacing.lg,
    alignItems: 'center',
    backgroundColor: '#fff9f3',
  },
  totalLabel: {
    color: '#b45309',
    fontSize: 16,
  },
  totalValue: {
    color: '#b45309',
    fontSize: 48,
    fontWeight: '700',
    marginVertical: tokens.spacing.xs,
  },
  totalUnit: {
    color: '#b45309',
    fontSize: 16,
  },
  sourceTag: {
    color: '#9a3412',
    fontSize: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  infoCard: {
    flex: 1,
    borderRadius: 20,
    padding: tokens.spacing.lg,
  },
  infoBlue: {
    backgroundColor: '#e0f2fe',
  },
  infoPurple: {
    backgroundColor: '#f5f3ff',
  },
  infoLabel: {
    color: '#475569',
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  detailCard: {
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pendingCard: {
    borderRadius: 20,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    backgroundColor: '#fff9f3',
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: tokens.spacing.md,
  },
  pendingText: {
    color: '#9a3412',
    fontWeight: '600',
    textAlign: 'center',
  },
  detailTitle: {
    color: '#a855f7',
    fontWeight: '600',
    marginBottom: tokens.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  exerciseName: {
    color: '#1f2937',
    fontWeight: '600',
  },
  detailMeta: {
    color: '#475569',
    fontSize: 13,
  },
  detailReason: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 220,
  },
  detailCalories: {
    color: '#fb923c',
    fontWeight: '600',
  },
  footerButton: {
    margin: tokens.spacing.lg,
    marginTop: 0,
    borderRadius: tokens.radii.full,
    backgroundColor: '#ec4899',
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}分${remainder}秒`;
}

function presetNameOrDefault(log: TrainingSessionLog) {
  return log.exercises[0]?.name ?? 'メニュー';
}

function buildPerExerciseCalorieMap(log: TrainingSessionLog) {
  return log.calorieDetail.perExercise.reduce<Record<string, { calories: number; reasoning?: string }>>((acc, entry) => {
    acc[entry.id] = { calories: entry.calories, reasoning: entry.reasoning };
    return acc;
  }, {});
}

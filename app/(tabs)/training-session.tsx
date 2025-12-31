/**
 * app/(tabs)/training-session.tsx
 *
 * 【責務】
 * トレーニングセッションの状態を表示し、タイマー制御や結果モーダルを提供する。
 *
 * 【使用箇所】
 * - メニュータブからモーダル的に遷移され、タブバーを維持する。
 *
 * 【やらないこと】
 * - Zustand ストアの定義
 *
 * 【他ファイルとの関係】
 * - hooks/useTrainingSession.ts / components/training/RingTimer.tsx / TrainingResultModal
 */

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { RingTimer } from '@/components/training/RingTimer';
import { TrainingResultModal } from '@/components/training/TrainingResultModal';
import { useMenuPresetStore } from '@/hooks/useMenuPresetStore';
import { useTrainingSession } from '@/hooks/useTrainingSession';

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export default function TrainingScreen() {
  const { getActivePreset } = useMenuPresetStore();
  const {
    phase,
    isPaused,
    exercises,
    exerciseIndex,
    currentSet,
    phaseRemainingSeconds,
    lastCompletedSession,
    markSetComplete,
    skipRest,
    pause,
    resume,
    resetSession,
    tick,
  } = useTrainingSession();
  const preset = getActivePreset();
  const activeExercise = exercises[exerciseIndex];
  const idlePreview = phase === 'idle' ? preset.exercises : exercises;
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => tick(1), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  useEffect(() => {
    if (phase === 'completed' && lastCompletedSession) {
      setResultVisible(true);
    }
  }, [phase, lastCompletedSession]);

  const phaseTheme = useMemo(() => {
    switch (phase) {
      case 'training':
        return { colors: ['#16a34a', '#22c55e'], label: 'トレーニング中', icon: '💪' };
      case 'rest':
        return { colors: ['#0ea5e9', '#38bdf8'], label: '休憩中', icon: '😌' };
      case 'completed':
        return { colors: ['#a855f7', '#ec4899'], label: '完了', icon: '🏆' };
      default:
        return { colors: ['#1f2937', '#0f172a'], label: '待機中', icon: '🕒' };
    }
  }, [phase]);

  const phaseDuration = useMemo(() => {
    if (phase === 'training') {
      return activeExercise?.trainingSeconds ?? 60;
    }
    if (phase === 'rest') {
      return activeExercise?.restSeconds ?? 60;
    }
    return 60;
  }, [phase, activeExercise]);

  const progress = phase === 'idle' ? 0 : phaseDuration ? 1 - phaseRemainingSeconds / phaseDuration : 0;
  const timerLabel = phase === 'idle' ? '00:00' : formatSeconds(Math.max(0, Math.floor(phaseRemainingSeconds)));
  const subLabel = phase === 'training' ? '残り時間' : phase === 'rest' ? '休憩残り' : phase === 'completed' ? '完了' : '待機中';

  const handleSkip = () => {
    if (phase === 'rest') {
      skipRest();
    } else if (phase === 'training') {
      markSetComplete();
    }
  };

  return (
    <LinearGradient colors={phaseTheme.colors} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>
            {phaseTheme.icon} {phaseTheme.label}
          </Text>
          {phase !== 'idle' && activeExercise ? (
            <Text style={styles.statusMeta}>
              {activeExercise.name} / セット {currentSet}/{activeExercise.sets}
            </Text>
          ) : (
            <Text style={styles.statusMeta}>メニューから開始してください</Text>
          )}
        </View>
        <RingTimer progress={progress} label={timerLabel} subLabel={subLabel} />
        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>重量</Text>
          <Text style={styles.weightValue}>{activeExercise?.weight ?? 0} kg</Text>
        </View>
        <View style={styles.controlRow}>
          <Pressable
            disabled={phase === 'idle' || phase === 'completed'}
            onPress={isPaused ? resume : pause}
            style={[styles.controlButton, (phase === 'idle' || phase === 'completed') && styles.controlDisabled]}>
            <Text style={styles.controlText}>{isPaused ? '再開' : '一時停止'}</Text>
          </Pressable>
          <Pressable
            disabled={phase === 'idle' || phase === 'completed'}
            onPress={handleSkip}
            style={[styles.controlButton, (phase === 'idle' || phase === 'completed') && styles.controlDisabled]}>
            <Text style={styles.controlText}>スキップ</Text>
          </Pressable>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>メニュー</Text>
          {idlePreview.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseRow}>
              <View>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets} セット / {exercise.reps} レップ / トレ {exercise.trainingSeconds}s / 休憩 {exercise.restSeconds}s
                </Text>
              </View>
              {phase !== 'idle' && index === exerciseIndex ? (
                <Text style={styles.badge}>進行中</Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
      <TrainingResultModal
        visible={resultVisible}
        log={lastCompletedSession ?? null}
        onClose={() => {
          setResultVisible(false);
          resetSession();
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 80,
    gap: 24,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  statusMeta: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  weightCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
  },
  weightLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  weightValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    marginTop: 4,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
  },
  exerciseName: {
    color: '#fff',
    fontWeight: '600',
  },
  exerciseMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  badge: {
    color: '#fff',
    fontWeight: '600',
  },
});

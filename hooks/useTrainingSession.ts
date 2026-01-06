/**
 * hooks/useTrainingSession.ts
 *
 * 【責務】
 * トレーニングセッションの状態マシンを管理し、タイマー進行やセット完了処理を一元的に制御する。
 *
 * 【使用箇所】
 * - トレーニングタブ画面
 * - セッション完了後のカロリーログ連携
 *
 * 【やらないこと】
 * - UI 描画
 * - 永続化
 *
 * 【他ファイルとの関係】
 * - hooks/useMenuPresetStore.ts から有効な種目一覧を取得する。
 * - hooks/useCalorieStore.ts へセッション結果を通知する。
 */

import { create } from 'zustand';

import { useBodyDataStore } from '@/hooks/useBodyDataStore';
import { useCalorieStore } from '@/hooks/useCalorieStore';
import { Exercise, useMenuPresetStore } from '@/hooks/useMenuPresetStore';
import { MissingOpenAIKeyError, estimateTrainingCaloriesWithAI } from '@/lib/ai/calorieEstimationAgent';

const DEFAULT_TRAINING_SECONDS = 60;

export type SessionPhase = 'idle' | 'training' | 'rest' | 'completed';

export interface SessionExerciseSnapshot {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  trainingSeconds: number;
  focusArea: Exercise['focusArea'];
  note?: string;
  youtubeUrl?: string;
}

export interface TrainingSessionLog {
  id: string;
  finishedAt: string;
  durationSeconds: number;
  exercises: SessionExerciseSnapshot[];
  caloriesBurned: number;
  calorieDetail: CalorieDetail;
  calorieEstimatePending: boolean;
}

interface CalorieDetail {
  provider: 'baseline' | 'openai';
  perExercise: { id: string; name: string; calories: number; reasoning?: string }[];
  reasoning?: string;
  model?: string;
  confidence?: number;
}

type SessionCompletedCallback = (log: TrainingSessionLog) => void;

interface TrainingSessionSlice {
  phase: SessionPhase;
  isPaused: boolean;
  exercises: SessionExerciseSnapshot[];
  exerciseIndex: number;
  currentSet: number;
  phaseRemainingSeconds: number;
  totalElapsedSeconds: number;
  sessionStartedAt?: string;
  completedSessions: TrainingSessionLog[];
  lastCompletedSession?: TrainingSessionLog;
}

interface TrainingSessionActions {
  startSession: (exerciseIds?: string[]) => void;
  markSetComplete: () => void;
  proceedFromRest: () => void;
  skipRest: () => void;
  pause: () => void;
  resume: () => void;
  resetSession: () => void;
  tick: (seconds?: number) => void;
}

export type TrainingSessionState = TrainingSessionSlice & TrainingSessionActions;

/**
 * createSessionId
 *
 * 【処理概要】
 * 時刻情報を元に一意なセッション ID を生成する。
 *
 * 【呼び出し元】
 * セッション完了時。
 *
 * 【入力 / 出力】
 * なし / string。
 *
 * 【副作用】
 * なし。
 */
function createSessionId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * buildExerciseQueue
 *
 * 【処理概要】
 * メニューストアから有効化されている種目を取得し、トレーニング用のスナップショット配列を生成する。
 *
 * 【呼び出し元】
 * startSession。
 *
 * 【入力 / 出力】
 * オプションの種目 ID 配列 / SessionExerciseSnapshot 配列。
 *
 * 【副作用】
 * useMenuPresetStore.getState を参照するのみ。
 */
function buildExerciseQueue(exerciseIds?: string[]): SessionExerciseSnapshot[] {
  const { getActivePreset } = useMenuPresetStore.getState();
  const preset = getActivePreset();
  const enabled = preset.exercises.filter(exercise => exercise.enabled);
  const filtered = exerciseIds?.length
    ? enabled.filter(exercise => exerciseIds.includes(exercise.id))
    : enabled;

  return filtered.map(exercise => ({
    id: exercise.id,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight,
    restSeconds: exercise.restSeconds,
    trainingSeconds: exercise.trainingSeconds ?? DEFAULT_TRAINING_SECONDS,
    focusArea: exercise.focusArea,
    note: exercise.note ?? undefined,
    youtubeUrl: exercise.youtubeUrl ?? undefined,
  }));
}

/**
 * calculateBaselineCalories
 *
 * 【処理概要】
 * 種目ごとのボリューム (sets * reps * weight) から概算消費カロリーを算出する。
 *
 * 【呼び出し元】
 * createSessionLog。
 *
 * 【入力 / 出力】
 * SessionExerciseSnapshot 配列 / number。
 *
 * 【副作用】
 * なし。
 */
function calculateBaselineCalories(exercises: SessionExerciseSnapshot[]) {
  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets * exercise.reps * Math.max(exercise.weight, 5), 0);
  return Math.round(volume * 0.09);
}

function calculateBaselineExerciseCalories(exercise: SessionExerciseSnapshot) {
  return Math.round(exercise.sets * exercise.reps * Math.max(exercise.weight, 5) * 0.01);
}

function buildBaselineCalorieDetail(exercises: SessionExerciseSnapshot[]): CalorieDetail {
  return {
    provider: 'baseline',
    perExercise: exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      calories: calculateBaselineExerciseCalories(exercise),
      reasoning: '重量×レップ×セットの簡易概算',
    })),
    reasoning: '重量とボリュームに基づく簡易計算',
  } satisfies CalorieDetail;
}

function buildAiCalorieDetail(
  exercises: SessionExerciseSnapshot[],
  result: { perExercise: { id: string; name: string; calories: number; reasoning?: string }[]; reasoning: string; model: string; confidence?: number },
): CalorieDetail {
  const baseline = buildBaselineCalorieDetail(exercises);
  const aiMap = new Map(result.perExercise.map(item => [item.id || item.name, item]));
  return {
    provider: 'openai',
    perExercise: exercises.map(exercise => {
      const aiEntry = aiMap.get(exercise.id) ?? aiMap.get(exercise.name);
      if (aiEntry) {
        return {
          id: exercise.id,
          name: exercise.name,
          calories: Math.max(0, Math.round(aiEntry.calories)),
          reasoning: aiEntry.reasoning,
        };
      }
      return baseline.perExercise.find(item => item.id === exercise.id) ?? {
        id: exercise.id,
        name: exercise.name,
        calories: calculateBaselineExerciseCalories(exercise),
        reasoning: 'AI 推定値が不足したためベース値を使用',
      };
    }),
    reasoning: result.reasoning,
    model: result.model,
    confidence: result.confidence,
  } satisfies CalorieDetail;
}

function applyCalorieDetailToSlice(
  state: TrainingSessionSlice,
  sessionId: string,
  calories: number,
  detail: CalorieDetail,
): TrainingSessionSlice {
  const applyDetail = (log: TrainingSessionLog | undefined) =>
    log && log.id === sessionId
      ? { ...log, caloriesBurned: calories, calorieDetail: detail, calorieEstimatePending: false }
      : log;
  const updatedSessions = state.completedSessions.map(session =>
    session.id === sessionId
      ? { ...session, caloriesBurned: calories, calorieDetail: detail, calorieEstimatePending: false }
      : session,
  );
  return {
    ...state,
    completedSessions: updatedSessions,
    lastCompletedSession: applyDetail(state.lastCompletedSession),
  };
}

function setCalorieEstimatePending(
  state: TrainingSessionSlice,
  sessionId: string,
  pending: boolean,
): TrainingSessionSlice {
  const updateLog = (log?: TrainingSessionLog) =>
    log && log.id === sessionId ? { ...log, calorieEstimatePending: pending } : log;
  return {
    ...state,
    completedSessions: state.completedSessions.map(log =>
      log.id === sessionId ? { ...log, calorieEstimatePending: pending } : log,
    ),
    lastCompletedSession: updateLog(state.lastCompletedSession),
  };
}

function getCurrentTrainingDuration(state: TrainingSessionSlice) {
  const current = state.exercises[state.exerciseIndex];
  return current?.trainingSeconds ?? DEFAULT_TRAINING_SECONDS;
}

/**
 * createSessionLog
 *
 * 【処理概要】
 * セッション完了時の履歴レコードを構築する。
 *
 * 【呼び出し元】
 * finalizeSession。
 *
 * 【入力 / 出力】
 * TrainingSessionSlice, 完了時刻 / TrainingSessionLog。
 *
 * 【副作用】
 * なし。
 */
function createSessionLog(state: TrainingSessionSlice, finishedAt: string): TrainingSessionLog {
  const id = createSessionId();
  const durationSeconds = state.totalElapsedSeconds;
  const exercises = state.exercises.map(exercise => ({ ...exercise }));
  const caloriesBurned = calculateBaselineCalories(state.exercises);
  const calorieDetail = buildBaselineCalorieDetail(state.exercises);

  return {
    id,
    finishedAt,
    durationSeconds,
    exercises,
    caloriesBurned,
    calorieDetail,
    calorieEstimatePending: false,
  };
}

/**
 * finalizeSession
 *
 * 【処理概要】
 * セッション完了処理をまとめ、ログ記録とカロリーストアへの通知を行う。
 *
 * 【呼び出し元】
 * advanceFromTraining 内。
 *
 * 【入力 / 出力】
 * TrainingSessionSlice, callback / TrainingSessionSlice。
 *
 * 【副作用】
 * useCalorieStore.getState().addTrainingEntry を呼び出す。
 */
function finalizeSession(state: TrainingSessionSlice, onCompleted?: SessionCompletedCallback): TrainingSessionSlice {
  const finishedAt = new Date().toISOString();
  const log = createSessionLog(state, finishedAt);
  const mainName = log.exercises[0]?.name ?? 'セッション';
  useCalorieStore
    .getState()
    .addTrainingEntry({
      sessionId: log.id,
      calories: log.caloriesBurned,
      finishedAt,
      exerciseCount: log.exercises.length,
      durationSeconds: log.durationSeconds,
      label: log.exercises.length > 1 ? `${mainName} 他${log.exercises.length - 1}種目` : mainName,
    })
    .catch(error => {
      console.error('[training] addTrainingEntry failed', error);
    });

  onCompleted?.(log);

  return {
    ...state,
    phase: 'completed',
    isPaused: false,
    exercises: state.exercises,
    exerciseIndex: 0,
    currentSet: 0,
    phaseRemainingSeconds: 0,
    lastCompletedSession: log,
    completedSessions: [...state.completedSessions, log],
  };
}

/**
 * advanceFromTraining
 *
 * 【処理概要】
 * トレーニングフェーズ終了時に休憩へ入るか完了させるかを判断する。
 *
 * 【呼び出し元】
 * markSetComplete, tick。
 *
 * 【入力 / 出力】
 * TrainingSessionSlice, callback / TrainingSessionSlice。
 *
 * 【副作用】
 * finalizeSession を呼ぶ場合に限り、カロリーストアを更新する。
 */
function advanceFromTraining(state: TrainingSessionSlice, onCompleted?: SessionCompletedCallback): TrainingSessionSlice {
  const currentExercise = state.exercises[state.exerciseIndex];
  if (!currentExercise) {
    return finalizeSession(state, onCompleted);
  }

  const hasMoreSets = state.currentSet < currentExercise.sets;
  if (hasMoreSets) {
    return {
      ...state,
      currentSet: state.currentSet + 1,
      phase: 'rest',
      phaseRemainingSeconds: currentExercise.restSeconds,
    };
  }

  const hasMoreExercises = state.exerciseIndex < state.exercises.length - 1;
  if (hasMoreExercises) {
    return {
      ...state,
      exerciseIndex: state.exerciseIndex + 1,
      currentSet: 1,
      phase: 'rest',
      phaseRemainingSeconds: state.exercises[state.exerciseIndex + 1].restSeconds,
    };
  }

  return finalizeSession(state, onCompleted);
}

/**
 * resumeTrainingAfterRest
 *
 * 【処理概要】
 * 休憩終了後にトレーニングフェーズへ復帰させ、セット時間を初期化する。
 *
 * 【呼び出し元】
 * proceedFromRest, skipRest, tick。
 *
 * 【入力 / 出力】
 * TrainingSessionSlice / TrainingSessionSlice。
 *
 * 【副作用】
 * なし。
 */
function resumeTrainingAfterRest(state: TrainingSessionSlice): TrainingSessionSlice {
  if (state.phase !== 'rest') return state;
  return {
    ...state,
    phase: 'training',
    phaseRemainingSeconds: getCurrentTrainingDuration(state),
  };
}

const initialSlice: TrainingSessionSlice = {
  phase: 'idle',
  isPaused: false,
  exercises: [],
  exerciseIndex: 0,
  currentSet: 0,
  phaseRemainingSeconds: 0,
  totalElapsedSeconds: 0,
  sessionStartedAt: undefined,
  completedSessions: [],
  lastCompletedSession: undefined,
};

/**
 * useTrainingSession
 *
 * 【処理概要】
 * 状態マシンとアクションを束ねた Zustand フックを生成する。
 */
export const useTrainingSession = create<TrainingSessionState>((set, get) => {
  const triggerAiCalorieEstimation: SessionCompletedCallback = log => {
    const bodyStore = useBodyDataStore.getState();
    const latest = bodyStore.latest ? bodyStore.latest() : null;
    const payload = {
      user: {
        weightKg: latest?.weight ?? 70,
        heightCm: latest?.heightCm ?? undefined,
        gender: latest?.gender ?? undefined,
        bodyFat: latest?.bodyFat ?? undefined,
        muscleMass: latest?.muscleMass ?? undefined,
      },
      session: {
        durationSeconds: log.durationSeconds,
      },
      exercises: log.exercises.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        restSeconds: exercise.restSeconds,
        trainingSeconds: exercise.trainingSeconds,
      })),
    };

    set(state => setCalorieEstimatePending(state, log.id, true));

    estimateTrainingCaloriesWithAI(payload)
      .then(result => {
        const detail = buildAiCalorieDetail(log.exercises, result);
        set(state => applyCalorieDetailToSlice(state, log.id, result.totalCalories, detail));
        useCalorieStore
          .getState()
          .updateTrainingEntryCalories(log.id, result.totalCalories)
          .catch(error => {
            console.error('[training] updateTrainingEntryCalories failed', error);
          });
      })
      .catch(error => {
        set(state => setCalorieEstimatePending(state, log.id, false));
        if (error instanceof MissingOpenAIKeyError) {
          console.info('[training] AI calorie estimation skipped', error.message);
          return;
        }
        console.error('[training] AI calorie estimation failed', error);
      });
  };

  return {
    ...initialSlice,
  /**
   * startSession
   *
   * 【処理概要】
   * メニューストアから有効種目を取得し、状態をトレーニングフェーズへ初期化する。
   *
   * 【呼び出し元】
   * トレーニングタブの開始ボタン。
   *
   * 【入力 / 出力】
   * 任意の exerciseIds / なし。
   *
   * 【副作用】
   * 内部状態を初期化し直す。
   */
  startSession: exerciseIds => {
    const queue = buildExerciseQueue(exerciseIds);
    if (queue.length === 0) {
      return;
    }
    set(state => ({
      ...state,
      ...initialSlice,
      completedSessions: state.completedSessions,
      lastCompletedSession: state.lastCompletedSession,
      exercises: queue,
      phase: 'training',
      exerciseIndex: 0,
      currentSet: 1,
      phaseRemainingSeconds: queue[0]?.trainingSeconds ?? DEFAULT_TRAINING_SECONDS,
      sessionStartedAt: new Date().toISOString(),
    }));
  },
  /**
   * markSetComplete
   *
   * 【処理概要】
   * 現在のセットを完了させ、残セット数に応じて休憩 or 完了へ遷移する。
   *
   * 【呼び出し元】
   * UI 上の完了ボタン、または tick 内の自動呼び出し。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * 内部状態変更、完了時はカロリーストア更新。
   */
  markSetComplete: () => {
    set(state => {
      if (state.phase !== 'training') return state;
      const updated = advanceFromTraining({ ...state }, triggerAiCalorieEstimation);
      return updated;
    });
  },
  /**
   * proceedFromRest
   *
   * 【処理概要】
   * 休憩フェーズを明示的に終了させ、次セットのトレーニングへ復帰する。
   *
   * 【呼び出し元】
   * タイマー完了 or 「休憩終了」ボタン。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * 状態遷移のみ。
   */
  proceedFromRest: () => {
    set(state => resumeTrainingAfterRest({ ...state }));
  },
  /**
   * skipRest
   *
   * 【処理概要】
   * 休憩をスキップして直ちに次セットへ移行する。
   *
   * 【呼び出し元】
   * UI 上のスキップ操作。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * 状態遷移のみ。
   */
  skipRest: () => {
    set(state => resumeTrainingAfterRest({ ...state }));
  },
  /**
   * pause
   *
   * 【処理概要】
   * 現在のフェーズを維持したまま isPaused フラグを立てる。
   *
   * 【呼び出し元】
   * トレーニングタブの一時停止ボタン。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * 状態更新のみ。
   */
  pause: () => {
    set(state => ({ ...state, isPaused: true }));
  },
  /**
   * resume
   *
   * 【処理概要】
   * isPaused フラグを解除し、タイマー進行を再開できる状態に戻す。
   *
   * 【呼び出し元】
   * 再開ボタン。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * 状態更新のみ。
   */
  resume: () => {
    set(state => ({ ...state, isPaused: false }));
  },
  /**
   * resetSession
   *
   * 【処理概要】
   * 進行中 or 完了済みセッションを破棄して Idle 状態へ戻す。
   *
   * 【呼び出し元】
   * UI のリセット操作。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * 状態を初期化する（履歴は保持）。
   */
  resetSession: () => {
    set(state => ({
      ...initialSlice,
      completedSessions: state.completedSessions,
      lastCompletedSession: state.lastCompletedSession,
    }));
  },
  /**
   * tick
   *
   * 【処理概要】
   * 1 秒刻みの時間経過を反映し、残り時間が 0 になった場合は状態を遷移させる。
   *
   * 【呼び出し元】
   * トレーニング画面の useEffect (setInterval)。
   *
   * 【入力 / 出力】
   * seconds / なし。
   *
   * 【副作用】
   * 内部状態更新、完了時はカロリーストア通知。
   */
  tick: (seconds = 1) => {
    set(state => {
      if (state.phase === 'idle' || state.isPaused || state.phase === 'completed') {
        return state;
      }
      const phaseRemainingSeconds = Math.max(state.phaseRemainingSeconds - seconds, 0);
      const totalElapsedSeconds = state.totalElapsedSeconds + seconds;
      if (phaseRemainingSeconds > 0) {
        return { ...state, phaseRemainingSeconds, totalElapsedSeconds };
      }
      if (state.phase === 'training') {
        const advanced = advanceFromTraining({ ...state, phaseRemainingSeconds: 0, totalElapsedSeconds }, triggerAiCalorieEstimation);
        return advanced;
      }
      if (state.phase === 'rest') {
        const resumed = resumeTrainingAfterRest({ ...state });
        return { ...resumed, totalElapsedSeconds };
      }
      return { ...state, totalElapsedSeconds };
    });
  },
  };
});

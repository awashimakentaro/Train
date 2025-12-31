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

import { useCalorieStore } from '@/hooks/useCalorieStore';
import { Exercise, useMenuPresetStore } from '@/hooks/useMenuPresetStore';

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
}

export interface TrainingSessionLog {
  id: string;
  finishedAt: string;
  durationSeconds: number;
  exercises: { id: string; name: string; sets: number; reps: number; weight: number; trainingSeconds: number }[];
  caloriesBurned: number;
}

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
  return `session_${Date.now()}`;
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
  }));
}

/**
 * calculateCalories
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
function calculateCalories(exercises: SessionExerciseSnapshot[]) {
  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets * exercise.reps * Math.max(exercise.weight, 5), 0);
  return Math.round(volume * 0.09);
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
  const exercises = state.exercises.map(exercise => ({
    id: exercise.id,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight,
    trainingSeconds: exercise.trainingSeconds,
  }));
  const caloriesBurned = calculateCalories(state.exercises);

  return {
    id,
    finishedAt,
    durationSeconds,
    exercises,
    caloriesBurned,
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
 * TrainingSessionSlice / TrainingSessionSlice。
 *
 * 【副作用】
 * useCalorieStore.getState().addTrainingEntry を呼び出す。
 */
function finalizeSession(state: TrainingSessionSlice): TrainingSessionSlice {
  const finishedAt = new Date().toISOString();
  const log = createSessionLog(state, finishedAt);
  useCalorieStore.getState().addTrainingEntry({
    sessionId: log.id,
    calories: log.caloriesBurned,
    finishedAt,
    exerciseCount: log.exercises.length,
  });

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
 * TrainingSessionSlice / TrainingSessionSlice。
 *
 * 【副作用】
 * finalizeSession を呼ぶ場合に限り、カロリーストアを更新する。
 */
function advanceFromTraining(state: TrainingSessionSlice): TrainingSessionSlice {
  const currentExercise = state.exercises[state.exerciseIndex];
  if (!currentExercise) {
    return finalizeSession(state);
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

  return finalizeSession(state);
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
export const useTrainingSession = create<TrainingSessionState>((set, get) => ({
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
      const updated = advanceFromTraining({ ...state });
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
        const advanced = advanceFromTraining({ ...state, phaseRemainingSeconds: 0, totalElapsedSeconds });
        return advanced;
      }
      if (state.phase === 'rest') {
        const resumed = resumeTrainingAfterRest({ ...state });
        return { ...resumed, totalElapsedSeconds };
      }
      return { ...state, totalElapsedSeconds };
    });
  },
}));

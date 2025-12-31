/**
 * hooks/useMenuPresetStore.ts
 *
 * 【責務】
 * トレーニングメニュー（プリセット）を管理し、種目の追加・更新・削除・有効/無効切り替えを提供する。
 *
 * 【使用箇所】
 * - メニュータブのカード編集
 * - トレーニングタブでの実行対象抽出
 *
 * 【やらないこと】
 * - 複数ユーザーの管理
 * - 外部永続化
 *
 * 【他ファイルとの関係】
 * - hooks/useTrainingSession.ts が有効な種目リストを参照する。
 */

import { create } from 'zustand';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  trainingSeconds: number;
  note?: string;
  youtubeUrl?: string;
  focusArea: 'push' | 'pull' | 'legs' | 'core';
  enabled: boolean;
}

export interface MenuPreset {
  id: string;
  name: string;
  exercises: Exercise[];
  description?: string;
}

interface MenuPresetState {
  presets: MenuPreset[];
  activePresetId: string;
  getActivePreset: () => MenuPreset;
  setActivePreset: (id: string) => void;
  createPreset: (payload: { name: string; description?: string; exercises?: Omit<Exercise, 'id'>[] }) => string;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  addExercise: (exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  removeExercise: (id: string) => void;
  toggleExercise: (id: string) => void;
  reorderExercise: (sourceIndex: number, targetIndex: number) => void;
}

/**
 * createId
 *
 * 【処理概要】
 * Math.random を利用して短い一意 ID を生成する。
 *
 * 【呼び出し元】
 * addExercise。
 *
 * 【入力 / 出力】
 * なし / string。
 *
 * 【副作用】
 * なし。
 */
function createId() {
  return `ex_${Math.random().toString(36).slice(2, 9)}`;
}

function createPresetId() {
  return `preset_${Math.random().toString(36).slice(2, 9)}`;
}

const EMPTY_PRESET: MenuPreset = {
  id: 'preset_placeholder',
  name: 'メニュー未作成',
  exercises: [],
};

/**
 * useMenuPresetStore
 *
 * 【処理概要】
 * プリセットと種目の CRUD を提供する Zustand ストアを作成する。
 *
 * 【呼び出し元】
 * メニュータブやトレーニングタブ。
 *
 * 【入力 / 出力】
 * なし / Zustand フック。
 *
 * 【副作用】
 * 内部状態を書き換える。
 */
export const useMenuPresetStore = create<MenuPresetState>((set, get) => ({
  presets: [],
  activePresetId: '',
  /**
   * getActivePreset
   *
   * 【処理概要】
   * activePresetId に一致するプリセットを返し、見つからない場合は最初の要素を返却する。
   *
   * 【呼び出し元】
   * メニュー画面やトレーニングセッション開始時。
   *
   * 【入力 / 出力】
   * なし / MenuPreset。
   *
   * 【副作用】
   * なし。
   */
  getActivePreset: () => {
    const { presets, activePresetId } = get();
    return presets.find(preset => preset.id === activePresetId) ?? presets[0] ?? EMPTY_PRESET;
  },
  /**
   * setActivePreset
   *
   * 【処理概要】
   * 表示中のプリセット ID を切り替える。
   */
  setActivePreset: id => {
    set(state => {
      if (state.presets.some(preset => preset.id === id)) {
        return { activePresetId: id };
      }
      const fallback = state.presets[0]?.id ?? '';
      return { activePresetId: fallback };
    });
  },
  /**
   * createPreset
   *
   * 【処理概要】
   * 新しいプリセットを生成し、必要なら初期種目を付与する。
   */
  createPreset: ({ name, description, exercises }) => {
    const newId = createPresetId();
    const generatedExercises = (exercises ?? []).map(exercise => ({
      ...exercise,
      trainingSeconds: exercise.trainingSeconds ?? 60,
      id: createId(),
    }));
    set(state => ({
      presets: [
        {
          id: newId,
          name,
          description,
          exercises: generatedExercises,
        },
        ...state.presets,
      ],
      activePresetId: newId,
    }));
    return newId;
  },
  /**
   * deletePreset
   *
   * 【処理概要】
   * 指定プリセットを一覧から削除し、必要に応じてアクティブ ID を更新する。
   */
  deletePreset: id => {
    set(state => {
      const filtered = state.presets.filter(preset => preset.id !== id);
      const nextActive = state.activePresetId === id ? filtered[0]?.id ?? '' : state.activePresetId;
      return {
        presets: filtered,
        activePresetId: nextActive,
      };
    });
  },
  /**
   * renamePreset
   *
   * 【処理概要】
   * プリセットの名称を変更する。
   */
  renamePreset: (id, name) => {
    set(state => ({
      presets: state.presets.map(preset => (preset.id === id ? { ...preset, name } : preset)),
    }));
  },
  /**
   * addExercise
   *
   * 【処理概要】
   * 現在のアクティブプリセットへ新しい種目を末尾追加する。
   *
   * 【呼び出し元】
   * メニュー画面の新規作成モーダル。
   *
   * 【入力 / 出力】
   * Exercise 情報（id 以外）/ なし。
   *
   * 【副作用】
   * Zustand ストア内のプリセット配列を更新する。
   */
  addExercise: exercise => {
    set(state => {
      const index = state.presets.findIndex(preset => preset.id === state.activePresetId);
      if (index === -1) return state;
      const presets = [...state.presets];
      const target = presets[index];
      const newExercise: Exercise = {
        ...exercise,
        trainingSeconds: exercise.trainingSeconds ?? 60,
        id: createId(),
      };
      presets[index] = { ...target, exercises: [...target.exercises, newExercise] };
      return { presets };
    });
  },
  /**
   * updateExercise
   *
   * 【処理概要】
   * 指定 ID の種目を見つけ、与えられたフィールドで上書きする。
   *
   * 【呼び出し元】
   * メニュー画面のインライン編集。
   *
   * 【入力 / 出力】
   * id, 更新パッチ / なし。
   *
   * 【副作用】
   * presets 内の該当オブジェクトを書き換える。
   */
  updateExercise: (id, updates) => {
    set(state => ({
      presets: state.presets.map(preset => ({
        ...preset,
        exercises: preset.exercises.map(exercise =>
          exercise.id === id ? { ...exercise, ...updates } : exercise,
        ),
      })),
    }));
  },
  /**
   * removeExercise
   *
   * 【処理概要】
   * 指定 ID の種目をプリセットから取り除く。
   *
   * 【呼び出し元】
   * メニュー画面の削除アクション。
   *
   * 【入力 / 出力】
   * id / なし。
   *
   * 【副作用】
   * presets 内配列を再構築する。
   */
  removeExercise: id => {
    set(state => ({
      presets: state.presets.map(preset => ({
        ...preset,
        exercises: preset.exercises.filter(exercise => exercise.id !== id),
      })),
    }));
  },
  /**
   * toggleExercise
   *
   * 【処理概要】
   * 対象種目の enabled フラグを反転させる。
   *
   * 【呼び出し元】
   * メニュー画面のトグルボタン。
   *
   * 【入力 / 出力】
   * id / なし。
   *
   * 【副作用】
   * presets 内の値を変更する。
   */
  toggleExercise: id => {
    set(state => ({
      presets: state.presets.map(preset => {
        if (preset.id !== state.activePresetId) return preset;
        return {
          ...preset,
          exercises: preset.exercises.map(exercise =>
            exercise.id === id ? { ...exercise, enabled: !exercise.enabled } : exercise,
          ),
        };
      }),
    }));
  },
  /**
   * reorderExercise
   *
   * 【処理概要】
   * 種目配列内で指定 index の要素を他の位置へ移動する。
   *
   * 【呼び出し元】
   * 将来のドラッグ操作、および UI ボタン。
   *
   * 【入力 / 出力】
   * sourceIndex, targetIndex / なし。
   *
   * 【副作用】
   * アクティブプリセットの順序を更新する。
   */
  reorderExercise: (sourceIndex, targetIndex) => {
    set(state => ({
      presets: state.presets.map(preset => {
        if (preset.id !== state.activePresetId) return preset;
        const exercises = [...preset.exercises];
        const [moved] = exercises.splice(sourceIndex, 1);
        if (!moved) return preset;
        exercises.splice(targetIndex, 0, moved);
        return { ...preset, exercises };
      }),
    }));
  },
}));

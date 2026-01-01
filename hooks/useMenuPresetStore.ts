/**
 * hooks/useMenuPresetStore.ts
 *
 * 【責務】
 * Supabase 上のトレーニングメニュー/種目テーブルと同期しながら、UI から扱いやすい Zustand ストア API を提供する。
 *
 * 【使用箇所】
 * - app/(tabs)/menu.tsx での CRUD 操作
 * - hooks/useTrainingSession.ts からの種目参照
 *
 * 【やらないこと】
 * - Auth 管理
 * - カロリー計算などドメイン外ロジック
 *
 * 【他ファイルとの関係】
 * - lib/supabaseClient.ts を利用して CRUD を実行する。
 */

import { create } from 'zustand';

import { supabase } from '@/lib/supabaseClient';
import type { ExerciseRow, MenuPresetRow } from '@/types/supabase';

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
  orderIndex: number;
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
  userId: string | null;
  loading: boolean;
  error?: string;
  hasInitialized: boolean;
  initialize: (userId: string) => Promise<void>;
  getActivePreset: () => MenuPreset;
  setActivePreset: (id: string) => void;
  createPreset: (payload: { name: string; description?: string; exercises?: Omit<Exercise, 'id' | 'orderIndex'>[] }) => Promise<string>;
  deletePreset: (id: string) => Promise<void>;
  renamePreset: (id: string, name: string) => Promise<void>;
  addExercise: (exercise: Omit<Exercise, 'id' | 'orderIndex'>) => Promise<void>;
  updateExercise: (id: string, updates: Partial<Exercise>) => Promise<void>;
  removeExercise: (id: string) => Promise<void>;
  toggleExercise: (id: string) => Promise<void>;
  reorderExercise: (sourceIndex: number, targetIndex: number) => Promise<void>;
}

const EMPTY_PRESET: MenuPreset = {
  id: 'preset_placeholder',
  name: 'メニュー未作成',
  exercises: [],
};

function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight,
    restSeconds: row.rest_seconds,
    trainingSeconds: row.training_seconds,
    note: row.note ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    focusArea: row.focus_area,
    enabled: row.enabled,
    orderIndex: row.order_index,
  } satisfies Exercise;
}

function mapPresetRow(row: MenuPresetRow): MenuPreset {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    exercises: (row.exercises ?? []).map(mapExerciseRow).sort((a, b) => a.orderIndex - b.orderIndex),
  } satisfies MenuPreset;
}

export const useMenuPresetStore = create<MenuPresetState>((set, get) => ({
  presets: [],
  activePresetId: '',
  userId: null,
  loading: false,
  error: undefined,
  hasInitialized: false,
  async initialize(userId) {
    if (get().hasInitialized && get().userId === userId) return;
    set({ loading: true, userId });
    const { data, error } = await supabase
      .from('menu_presets')
      .select(
        `id,name,description,created_at,updated_at,
        exercises:exercises(id,name,sets,reps,weight,rest_seconds,training_seconds,note,youtube_url,focus_area,enabled,order_index,created_at,updated_at,preset_id,user_id)`,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('order_index', { ascending: true, referencedTable: 'exercises' });

    if (error) {
      console.error('[supabase] menu_presets fetch failed', error);
      set({ loading: false, error: error.message });
      throw new Error(error.message);
    }

    const mapped = (data ?? []).map(mapPresetRow);
    set({
      presets: mapped,
      activePresetId: mapped[0]?.id ?? '',
      loading: false,
      error: undefined,
      hasInitialized: true,
    });
  },
  getActivePreset: () => {
    const { presets, activePresetId } = get();
    return presets.find(preset => preset.id === activePresetId) ?? presets[0] ?? EMPTY_PRESET;
  },
  setActivePreset: id => {
    set(state => ({
      activePresetId: state.presets.some(preset => preset.id === id) ? id : state.activePresetId,
    }));
  },
  async createPreset({ name, description, exercises }) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const { data, error } = await supabase
      .from('menu_presets')
      .insert({ user_id: userId, name, description: description ?? null })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[supabase] create preset failed', error);
      throw new Error(error?.message ?? 'プリセットの作成に失敗しました');
    }

    let createdExercises: Exercise[] = [];
    if (exercises?.length) {
      const payloads = exercises.map((exercise, index) => ({
        user_id: userId,
        preset_id: data.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        rest_seconds: exercise.restSeconds,
        training_seconds: exercise.trainingSeconds,
        note: exercise.note ?? null,
        youtube_url: exercise.youtubeUrl ?? null,
        focus_area: exercise.focusArea,
        enabled: exercise.enabled,
        order_index: index,
      }));
      const { data: inserted, error: exerciseError } = await supabase.from('exercises').insert(payloads).select('*');
      if (exerciseError) {
        console.error('[supabase] create exercises failed', exerciseError);
        throw new Error(exerciseError.message);
      }
      createdExercises = (inserted ?? []).map(mapExerciseRow);
    }

    const newPreset: MenuPreset = {
      id: data.id,
      name,
      description: description ?? undefined,
      exercises: createdExercises,
    };

    set(state => ({ presets: [newPreset, ...state.presets], activePresetId: data.id }));
    return data.id;
  },
  async deletePreset(id) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const { error } = await supabase
      .from('menu_presets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[supabase] delete preset failed', error);
      throw new Error(error.message);
    }
    set(state => {
      const filtered = state.presets.filter(preset => preset.id !== id);
      const nextActive = state.activePresetId === id ? filtered[0]?.id ?? '' : state.activePresetId;
      return { presets: filtered, activePresetId: nextActive };
    });
  },
  async renamePreset(id, name) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const { error } = await supabase
      .from('menu_presets')
      .update({ name })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[supabase] rename preset failed', error);
      throw new Error(error.message);
    }
    set(state => ({
      presets: state.presets.map(preset => (preset.id === id ? { ...preset, name } : preset)),
    }));
  },
  async addExercise(exercise) {
    const state = get();
    const userId = state.userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const preset = state.presets.find(p => p.id === state.activePresetId);
    if (!preset || preset.id === 'preset_placeholder') throw new Error('プリセットが選択されていません');
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: userId,
        preset_id: preset.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        rest_seconds: exercise.restSeconds,
        training_seconds: exercise.trainingSeconds,
        note: exercise.note ?? null,
        youtube_url: exercise.youtubeUrl ?? null,
        focus_area: exercise.focusArea,
        enabled: exercise.enabled,
        order_index: preset.exercises.length,
      })
      .select('*')
      .single();
    if (error || !data) {
      console.error('[supabase] add exercise failed', error);
      throw new Error(error?.message ?? '種目の追加に失敗しました');
    }
    const mapped = mapExerciseRow(data);
    set(current => ({
      presets: current.presets.map(presetItem =>
        presetItem.id === preset.id ? { ...presetItem, exercises: [...presetItem.exercises, mapped] } : presetItem,
      ),
    }));
  },
  async updateExercise(id, updates) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const payload: Partial<ExerciseRow> = {
      name: updates.name,
      sets: updates.sets,
      reps: updates.reps,
      weight: updates.weight,
      rest_seconds: updates.restSeconds,
      training_seconds: updates.trainingSeconds,
      note: updates.note ?? null,
      youtube_url: updates.youtubeUrl ?? null,
      focus_area: updates.focusArea,
      enabled: updates.enabled,
    };
    const sanitized = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(sanitized).length) {
      const { error } = await supabase
        .from('exercises')
        .update(sanitized)
        .eq('id', id)
        .eq('user_id', userId);
      if (error) {
        console.error('[supabase] update exercise failed', error);
        throw new Error(error.message);
      }
    }
    set(state => ({
      presets: state.presets.map(preset => ({
        ...preset,
        exercises: preset.exercises.map(exercise =>
          exercise.id === id ? { ...exercise, ...updates } : exercise,
        ),
      })),
    }));
  },
  async removeExercise(id) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[supabase] remove exercise failed', error);
      throw new Error(error.message);
    }
    set(state => ({
      presets: state.presets.map(preset => ({
        ...preset,
        exercises: preset.exercises.filter(exercise => exercise.id !== id),
      })),
    }));
  },
  async toggleExercise(id) {
    const state = get();
    const userId = state.userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const preset = state.presets.find(p => p.id === state.activePresetId);
    const target = preset?.exercises.find(exercise => exercise.id === id);
    if (!target) return;
    const nextValue = !target.enabled;
    const { error } = await supabase
      .from('exercises')
      .update({ enabled: nextValue })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[supabase] toggle exercise failed', error);
      throw new Error(error.message);
    }
    set(current => ({
      presets: current.presets.map(presetItem =>
        presetItem.id === preset?.id
          ? {
              ...presetItem,
              exercises: presetItem.exercises.map(exercise =>
                exercise.id === id ? { ...exercise, enabled: nextValue } : exercise,
              ),
            }
          : presetItem,
      ),
    }));
  },
  async reorderExercise(sourceIndex, targetIndex) {
    const state = get();
    const userId = state.userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const preset = state.presets.find(p => p.id === state.activePresetId);
    if (!preset) return;
    const sequence = [...preset.exercises];
    const [moved] = sequence.splice(sourceIndex, 1);
    if (!moved) return;
    sequence.splice(targetIndex, 0, moved);
    const updates = sequence.map((exercise, index) => ({ id: exercise.id, order_index: index }));
    const { error } = await supabase.from('exercises').upsert(updates);
    if (error) {
      console.error('[supabase] reorder exercises failed', error);
      throw new Error(error.message);
    }
    set(current => ({
      presets: current.presets.map(presetItem =>
        presetItem.id === preset.id
          ? {
              ...presetItem,
              exercises: sequence.map((exercise, index) => ({ ...exercise, orderIndex: index })),
            }
          : presetItem,
      ),
    }));
  },
}));

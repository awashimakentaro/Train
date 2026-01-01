/**
 * hooks/useCalorieStore.ts
 *
 * 【責務】
 * Supabase 上のカロリーエントリ/トレーニングログを同期し、サマリー計算用のデータを提供する。
 *
 * 【使用箇所】
 * - カロリータブ画面
 * - hooks/useTrainingSession.ts からのセッション記録
 */

import { create } from 'zustand';

import { supabase } from '@/lib/supabaseClient';
import type { CalorieEntryRow, TrainingSessionRow } from '@/types/supabase';

export type CalorieEntryType = 'intake' | 'burn';

export interface CalorieEntry {
  id: string;
  type: CalorieEntryType;
  amount: number;
  label: string;
  date: string;
  category?: string;
  linkedSessionId?: string;
  durationMinutes?: number;
}

export interface TrainingSummaryPayload {
  sessionId: string;
  calories: number;
  finishedAt: string;
  exerciseCount: number;
  durationSeconds: number;
  label?: string;
}

interface CalorieState {
  entries: CalorieEntry[];
  userId: string | null;
  loading: boolean;
  error?: string;
  hasInitialized: boolean;
  initialize: (userId: string) => Promise<void>;
  addEntry: (entry: Omit<CalorieEntry, 'id'>) => Promise<void>;
  addTrainingEntry: (payload: TrainingSummaryPayload) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  getTodaySummary: () => { intake: number; burn: number; delta: number };
  getDailySeries: (days?: number) => { date: string; intake: number; burn: number }[];
  getWeeklyBalanceSeries: () => { id: string; label: string; balance: number }[];
}

function mapEntry(row: CalorieEntryRow): CalorieEntry {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    label: row.label,
    date: row.entry_date,
    category: row.category ?? undefined,
    linkedSessionId: row.linked_session_id ?? undefined,
    durationMinutes: row.duration_minutes ?? undefined,
  } satisfies CalorieEntry;
}

function groupByDate(entries: CalorieEntry[]) {
  return entries.reduce<Record<string, { intake: number; burn: number }>>((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = { intake: 0, burn: 0 };
    }
    acc[entry.date][entry.type === 'intake' ? 'intake' : 'burn'] += entry.amount;
    return acc;
  }, {});
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

/**
 * startOfWeekMonday
 *
 * 【処理概要】
 * 指定日を週の開始（月曜）へ切り下げ、時刻を 00:00 に揃えた Date を返す。
 *
 * 【呼び出し元】
 * getWeeklyBalanceSeries。
 *
 * 【入力 / 出力】
 * date / Date。
 *
 * 【副作用】
 * なし。
 */
function startOfWeekMonday(date: Date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  const day = clone.getDay();
  const diff = (day + 6) % 7;
  clone.setDate(clone.getDate() - diff);
  return clone;
}

export const useCalorieStore = create<CalorieState>((set, get) => ({
  entries: [],
  userId: null,
  loading: false,
  error: undefined,
  hasInitialized: false,
  async initialize(userId) {
    if (get().hasInitialized && get().userId === userId) return;
    set({ loading: true, userId });
    const { data, error } = await supabase
      .from('calorie_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[supabase] calorie_entries fetch failed', error);
      set({ loading: false, error: error.message });
      throw new Error(error.message);
    }
    const mapped = (data ?? []).map(mapEntry);
    set({ entries: mapped, loading: false, error: undefined, hasInitialized: true });
  },
  async addEntry(entry) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const payload = {
      user_id: userId,
      entry_date: entry.date,
      type: entry.type,
      amount: entry.amount,
      label: entry.label,
      category: entry.category ?? null,
      linked_session_id: entry.linkedSessionId ?? null,
      duration_minutes: entry.durationMinutes ?? null,
    } satisfies Partial<CalorieEntryRow> & { user_id: string; entry_date: string };
    const { data, error } = await supabase.from('calorie_entries').insert(payload).select('*').single();
    if (error || !data) {
      console.error('[supabase] add calorie entry failed', error);
      throw new Error(error?.message ?? 'カロリー登録に失敗しました');
    }
    set(state => ({ entries: [mapEntry(data), ...state.entries] }));
  },
  async addTrainingEntry(payload) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const date = payload.finishedAt.slice(0, 10);
    const label = payload.label ?? `${payload.exerciseCount}種目セッション`;

    const entryInsert = {
      user_id: userId,
      entry_date: date,
      type: 'burn' as const,
      amount: Math.round(payload.calories),
      label,
      category: 'training',
      linked_session_id: payload.sessionId,
      duration_minutes: Math.round(payload.durationSeconds / 60) || 0,
    } satisfies Partial<CalorieEntryRow> & { user_id: string; entry_date: string };

    const { data, error } = await supabase.from('calorie_entries').insert(entryInsert).select('*').single();
    if (error || !data) {
      console.error('[supabase] add training calorie entry failed', error);
      throw new Error(error?.message ?? 'トレーニングの記録に失敗しました');
    }

    const sessionRow: Omit<TrainingSessionRow, 'id' | 'created_at'> = {
      user_id: userId,
      menu_name: label,
      calories: Math.round(payload.calories),
      duration_seconds: payload.durationSeconds,
      finished_at: payload.finishedAt,
      exercise_count: payload.exerciseCount,
    };
    const { error: logError } = await supabase
      .from('training_sessions')
      .insert({ ...sessionRow, id: payload.sessionId });
    if (logError) {
      console.error('[supabase] training session log failed', logError);
    }

    set(state => ({ entries: [mapEntry(data), ...state.entries] }));
  },
  async removeEntry(id) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const { error } = await supabase
      .from('calorie_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('[supabase] delete calorie entry failed', error);
      throw new Error(error.message);
    }
    set(state => ({ entries: state.entries.filter(entry => entry.id !== id) }));
  },
  getTodaySummary: () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayEntries = get().entries.filter(entry => entry.date === today);
    const totals = groupByDate(todayEntries)[today] ?? { intake: 0, burn: 0 };
    return { ...totals, delta: totals.intake - totals.burn };
  },
  getDailySeries: (days = 7) => {
    const grouped = groupByDate(get().entries);
    const today = new Date();
    const dateList = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      return date.toISOString().slice(0, 10);
    });
    return dateList
      .map(date => ({ date, intake: grouped[date]?.intake ?? 0, burn: grouped[date]?.burn ?? 0 }))
      .reverse();
  },
  getWeeklyBalanceSeries: () => {
    const grouped = groupByDate(get().entries);
    const today = new Date();
    const weekStart = startOfWeekMonday(today);
    return DAY_LABELS.map((label, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const iso = date.toISOString().slice(0, 10);
      const totals = grouped[iso] ?? { intake: 0, burn: 0 };
      return { id: iso, label, balance: totals.intake - totals.burn };
    });
  },
}));

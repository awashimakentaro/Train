/**
 * hooks/useBodyDataStore.ts
 *
 * 【責務】
 * Supabase 上の身体データ (body_entries) テーブルと同期し、カード/モーダル UI から利用できる CRUD API を提供する。
 *
 * 【使用箇所】
 * - Body タブ（app/(tabs)/index.tsx）
 * - 他ドメインからの体重参照
 *
 * 【やらないこと】
 * - Supabase Auth
 * - UI 表示
 */

import { create } from 'zustand';

import { supabase } from '@/lib/supabaseClient';
import type { BodyEntryRow } from '@/types/supabase';

export type BodyGender = 'male' | 'female' | 'other';

export type BodyDataField =
  | 'weight'
  | 'heightCm'
  | 'bodyFat'
  | 'muscleMass'
  | 'bmi'
  | 'waterContent'
  | 'visceralFat';

export interface BodyDataRecord {
  date: string; // YYYY-MM-DD
  weight: number;
  heightCm: number;
  gender: BodyGender | null;
  bodyFat: number;
  muscleMass: number;
  bmi: number;
  waterContent: number;
  visceralFat: number;
}

interface BodyDataState {
  history: BodyDataRecord[];
  userId: string | null;
  loading: boolean;
  error?: string;
  hasInitialized: boolean;
  initialize: (userId: string) => Promise<void>;
  latest: () => BodyDataRecord | null;
  addEntry: (entry: Partial<Omit<BodyDataRecord, 'date'>> & { date?: string }) => Promise<void>;
  updateEntry: (date: string, updates: Partial<BodyDataRecord>) => Promise<void>;
  removeEntry: (date: string) => Promise<void>;
  getTrend: (field: BodyDataField) => number;
  getSeries: (field: BodyDataField, length?: number) => number[];
}

const DEFAULT_HEIGHT_CM = 172;
const DEFAULT_HEIGHT_M = DEFAULT_HEIGHT_CM / 100;

function mapRow(row: BodyEntryRow): BodyDataRecord {
  return {
    date: row.entry_date,
    weight: row.weight ?? 0,
    heightCm: row.height_cm ?? 0,
    gender: row.gender ?? null,
    bodyFat: row.body_fat ?? 0,
    muscleMass: row.muscle_mass ?? 0,
    bmi: row.bmi ?? 0,
    waterContent: row.water_content ?? 0,
    visceralFat: row.visceral_fat ?? 0,
  } satisfies BodyDataRecord;
}

function normalizeNumericField(value: number | undefined, digits = 1): number | undefined {
  if (value === undefined) return undefined;
  return Number(value.toFixed(digits));
}

function buildRecord(base: BodyDataRecord, patch: Partial<BodyDataRecord>, date: string): BodyDataRecord {
  const weight = normalizeNumericField(patch.weight ?? base.weight);
  const heightCm = normalizeNumericField(patch.heightCm ?? base.heightCm, 1);
  const heightMeters = heightCm ? heightCm / 100 : DEFAULT_HEIGHT_M;
  const bmi = normalizeNumericField(
    patch.bmi ?? (weight !== undefined && heightMeters ? weight / (heightMeters * heightMeters) : base.bmi),
    1,
  );
  return {
    date,
    weight: weight ?? base.weight,
    heightCm: heightCm ?? base.heightCm,
    gender: patch.gender ?? base.gender ?? null,
    bodyFat: normalizeNumericField(patch.bodyFat ?? base.bodyFat) ?? base.bodyFat,
    muscleMass: normalizeNumericField(patch.muscleMass ?? base.muscleMass) ?? base.muscleMass,
    bmi: bmi ?? base.bmi,
    waterContent: normalizeNumericField(patch.waterContent ?? base.waterContent) ?? base.waterContent,
    visceralFat: normalizeNumericField(patch.visceralFat ?? base.visceralFat, 0) ?? base.visceralFat,
  } satisfies BodyDataRecord;
}

function toRow(userId: string, record: BodyDataRecord) {
  return {
    user_id: userId,
    entry_date: record.date,
    weight: record.weight,
    height_cm: record.heightCm,
    gender: record.gender,
    body_fat: record.bodyFat,
    muscle_mass: record.muscleMass,
    bmi: record.bmi,
    water_content: record.waterContent,
    visceral_fat: record.visceralFat,
  };
}

export const useBodyDataStore = create<BodyDataState>((set, get) => ({
  history: [],
  userId: null,
  loading: false,
  error: undefined,
  hasInitialized: false,
  async initialize(userId) {
    if (get().hasInitialized && get().userId === userId) return;
    set({ loading: true, userId });
    const { data, error } = await supabase
      .from('body_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });
    if (error) {
      console.error('[supabase] body_entries fetch failed', error);
      set({ loading: false, error: error.message });
      throw new Error(error.message);
    }
    const mapped = (data ?? []).map(mapRow);
    set({ history: mapped, loading: false, error: undefined, hasInitialized: true });
  },
  latest: () => get().history[0] ?? null,
  async addEntry(entry) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const date = entry.date ?? new Date().toISOString().slice(0, 10);
    const base =
      get().history.find(record => record.date === date) ?? {
        date,
        weight: entry.weight ?? 0,
        heightCm: entry.heightCm ?? DEFAULT_HEIGHT_CM,
        gender: entry.gender ?? null,
        bodyFat: entry.bodyFat ?? 0,
        muscleMass: entry.muscleMass ?? 0,
        bmi: entry.bmi ?? 0,
        waterContent: entry.waterContent ?? 0,
        visceralFat: entry.visceralFat ?? 0,
      };
    const record = buildRecord(base, entry, date);
    const prevHistory = get().history;
    const nextHistory = [record, ...prevHistory.filter(item => item.date !== date)].sort((a, b) => (a.date < b.date ? 1 : -1));
    set({ history: nextHistory });
    const { error } = await supabase.from('body_entries').upsert(toRow(userId, record), { onConflict: 'user_id,entry_date' }).limit(1);
    if (error) {
      console.error('[supabase] upsert body entry failed', error);
      set({ history: prevHistory });
      throw new Error(error.message);
    }
  },
  async updateEntry(date, updates) {
    await get().addEntry({ ...updates, date });
  },
  async removeEntry(date) {
    const userId = get().userId;
    if (!userId) throw new Error('Supabase ユーザーが未初期化です');
    const { error } = await supabase
      .from('body_entries')
      .delete()
      .eq('user_id', userId)
      .eq('entry_date', date);
    if (error) {
      console.error('[supabase] delete body entry failed', error);
      throw new Error(error.message);
    }
    set(state => ({ history: state.history.filter(record => record.date !== date) }));
  },
  getTrend: field => {
    const history = get().history;
    if (history.length < 2) return 0;
    const latest = history[0];
    const previous = history[1];
    return Number((latest[field] - previous[field]).toFixed(1));
  },
  getSeries: (field, length = 7) => get().history.slice(0, length).map(record => record[field]).reverse(),
}));

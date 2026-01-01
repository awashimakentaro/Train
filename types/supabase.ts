/**
 * types/supabase.ts
 *
 * 【責務】
 * Supabase から取得するテーブル行の型定義をまとめ、マッピング時の安全性を確保する。
 *
 * 【使用箇所】
 * - hooks/useMenuPresetStore.ts
 * - hooks/useBodyDataStore.ts
 * - hooks/useCalorieStore.ts
 */

export interface MenuPresetRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  exercises?: ExerciseRow[];
}

export interface ExerciseRow {
  id: string;
  user_id: string;
  preset_id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  rest_seconds: number;
  training_seconds: number;
  note: string | null;
  youtube_url: string | null;
  focus_area: 'push' | 'pull' | 'legs' | 'core';
  enabled: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface BodyEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  bmi: number | null;
  water_content: number | null;
  visceral_fat: number | null;
  created_at: string;
  updated_at: string;
}

export interface CalorieEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  type: 'intake' | 'burn';
  amount: number;
  label: string;
  category: string | null;
  linked_session_id: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingSessionRow {
  id: string;
  user_id: string;
  menu_name: string;
  calories: number;
  duration_seconds: number;
  finished_at: string;
  exercise_count: number;
  created_at: string;
}

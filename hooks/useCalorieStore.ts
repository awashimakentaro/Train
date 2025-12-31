/**
 * hooks/useCalorieStore.ts
 *
 * 【責務】
 * 摂取/消費カロリー履歴を管理し、日次サマリーや週次チャート用データを提供する。
 *
 * 【使用箇所】
 * - カロリータブ画面
 * - トレーニング完了時の消費カロリー記録
 *
 * 【やらないこと】
 * - Supabase との同期
 * - 栄養計算ロジック
 *
 * 【他ファイルとの関係】
 * - hooks/useTrainingSession.ts からセッション完了時に addTrainingEntry を呼び出す。
 */

import { create } from 'zustand';

export type CalorieEntryType = 'intake' | 'burn';

export interface CalorieEntry {
  id: string;
  type: CalorieEntryType;
  amount: number;
  label: string;
  date: string; // YYYY-MM-DD
  category?: string;
  linkedSessionId?: string;
}

export interface CalorieState {
  entries: CalorieEntry[];
  addEntry: (entry: Omit<CalorieEntry, 'id'>) => void;
  addTrainingEntry: (payload: TrainingSummaryPayload) => void;
  removeEntry: (id: string) => void;
  getTodaySummary: () => { intake: number; burn: number; delta: number };
  getDailySeries: (days?: number) => { date: string; intake: number; burn: number }[];
}

export interface TrainingSummaryPayload {
  sessionId: string;
  calories: number;
  finishedAt: string;
  exerciseCount: number;
}

/**
 * createEntryId
 *
 * 【処理概要】
 * Math.random を利用してエントリー ID を生成する。
 *
 * 【呼び出し元】
 * addEntry / addTrainingEntry。
 *
 * 【入力 / 出力】
 * なし / string。
 *
 * 【副作用】
 * なし。
 */
function createEntryId() {
  return `cal_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * createSeedEntries
 *
 * 【処理概要】
 * 直近 7 日分の摂取/消費データを疑似生成する。
 *
 * 【呼び出し元】
 * ストア初期化。
 *
 * 【入力 / 出力】
 * なし / CalorieEntry[]。
 *
 * 【副作用】
 * なし。
 */
function createSeedEntries(): CalorieEntry[] {
  const today = new Date();
  const entries: CalorieEntry[] = [];

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    entries.push(
      {
        id: createEntryId(),
        type: 'intake',
        amount: 2100 + i * 20,
        label: '食事',
        date: iso,
        category: 'meal',
      },
      {
        id: createEntryId(),
        type: 'burn',
        amount: 450 + i * 10,
        label: 'トレーニング',
        date: iso,
        category: 'training',
      },
    );
  }

  return entries;
}

/**
 * groupByDate
 *
 * 【処理概要】
 * CalorieEntry の配列を日付ごとに intake/burn 集計へ変換する。
 *
 * 【呼び出し元】
 * getTodaySummary, getDailySeries。
 *
 * 【入力 / 出力】
 * entries / 日付キーの集計オブジェクト。
 *
 * 【副作用】
 * なし。
 */
function groupByDate(entries: CalorieEntry[]) {
  return entries.reduce<Record<string, { intake: number; burn: number }>>((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = { intake: 0, burn: 0 };
    }
    acc[entry.date][entry.type === 'intake' ? 'intake' : 'burn'] += entry.amount;
    return acc;
  }, {});
}

/**
 * useCalorieStore
 *
 * 【処理概要】
 * 摂取/消費カロリーの CRUD およびサマリー計算を提供する Zustand フックを生成する。
 *
 * 【呼び出し元】
 * カロリータブやトレーニングストア。
 *
 * 【入力 / 出力】
 * なし / Zustand フック。
 *
 * 【副作用】
 * 内部状態を更新する。
 */
export const useCalorieStore = create<CalorieState>((set, get) => ({
  entries: createSeedEntries(),
  /**
   * addEntry
   *
   * 【処理概要】
   * ユーザー入力から摂取/消費レコードを新規追加する。
   *
   * 【呼び出し元】
   * カロリー入力モーダル。
   *
   * 【入力 / 出力】
   * CalorieEntry (id 以外) / なし。
   *
   * 【副作用】
   * entries ステートを更新する。
   */
  addEntry: entry => {
    set(state => ({ entries: [{ ...entry, id: createEntryId() }, ...state.entries] }));
  },
  /**
   * addTrainingEntry
   *
   * 【処理概要】
   * トレーニングセッション完了通知を消費カロリーとして保存する。
   *
   * 【呼び出し元】
   * hooks/useTrainingSession.ts。
   *
   * 【入力 / 出力】
   * TrainingSummaryPayload / なし。
   *
   * 【副作用】
   * entries に training カテゴリのレコードを追加する。
   */
  addTrainingEntry: payload => {
    set(state => ({
      entries: [
        {
          id: payload.sessionId,
          type: 'burn',
          amount: payload.calories,
          label: `${payload.exerciseCount}種目セッション`,
          date: payload.finishedAt.slice(0, 10),
          category: 'training',
          linkedSessionId: payload.sessionId,
        },
        ...state.entries,
      ],
    }));
  },
  /**
   * removeEntry
   *
   * 【処理概要】
   * 指定 ID のエントリを一覧から削除する。
   *
   * 【呼び出し元】
   * カロリー履歴 UI。
   *
   * 【入力 / 出力】
   * id / なし。
   *
   * 【副作用】
   * entries を再構築する。
   */
  removeEntry: id => {
    set(state => ({ entries: state.entries.filter(entry => entry.id !== id) }));
  },
  /**
   * getTodaySummary
   *
   * 【処理概要】
   * 当日分の摂取/消費を合計し差分を算出する。
   *
   * 【呼び出し元】
   * カロリータブのサマリーカード。
   *
   * 【入力 / 出力】
   * なし / { intake, burn, delta }。
   *
   * 【副作用】
   * なし。
   */
  getTodaySummary: () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayEntries = get().entries.filter(entry => entry.date === today);
    const totals = groupByDate(todayEntries)[today] ?? { intake: 0, burn: 0 };
    return { ...totals, delta: totals.intake - totals.burn };
  },
  /**
   * getDailySeries
   *
   * 【処理概要】
   * 指定日数分のインサイト表示用データを構築する。
   *
   * 【呼び出し元】
   * カロリータブのチャート。
   *
   * 【入力 / 出力】
   * days / {date,intake,burn}[]。
   *
   * 【副作用】
   * なし。
   */
  getDailySeries: (days = 7) => {
    const grouped = groupByDate(get().entries);
    const result: { date: string; intake: number; burn: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const iso = date.toISOString().slice(0, 10);
      result.push({ date: iso, intake: grouped[iso]?.intake ?? 0, burn: grouped[iso]?.burn ?? 0 });
    }
    return result;
  },
}));

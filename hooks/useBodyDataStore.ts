/**
 * hooks/useBodyDataStore.ts
 *
 * 【責務】
 * 身体データの履歴を管理し、追加・更新・削除やトレンド計算といったドメイン操作を提供する Zustand ストア。
 *
 * 【使用箇所】
 * - Body タブ（app/(tabs)/index.tsx）でのカード表示やモーダル入力
 * - 他タブからの身体データ参照
 *
 * 【やらないこと】
 * - 永続化や Supabase 同期
 * - UI イベントの処理
 *
 * 【他ファイルとの関係】
 * - hooks/useCalorieStore.ts 等から将来的に参照され、体重トレンドを利用する想定
 */

import { create } from 'zustand';

export type BodyDataField =
  | 'weight'
  | 'bodyFat'
  | 'muscleMass'
  | 'bmi'
  | 'waterContent'
  | 'visceralFat';

export interface BodyDataRecord {
  date: string; // YYYY-MM-DD
  weight: number;
  bodyFat: number;
  muscleMass: number;
  bmi: number;
  waterContent: number;
  visceralFat: number;
}

interface BodyDataState {
  history: BodyDataRecord[];
  latest: () => BodyDataRecord | null;
  addEntry: (entry: Partial<Omit<BodyDataRecord, 'date'>> & { date?: string }) => void;
  updateEntry: (date: string, updates: Partial<BodyDataRecord>) => void;
  removeEntry: (date: string) => void;
  getTrend: (field: BodyDataField) => number;
  getSeries: (field: BodyDataField, length?: number) => number[];
}

const DEFAULT_HEIGHT_M = 1.72;

/**
 * createSeedHistory
 *
 * 【処理概要】
 * 直近 10 日分の疑似データを生成し、降順ソートした配列を返す。
 *
 * 【呼び出し元】
 * Zustand ストア初期化時。
 *
 * 【入力 / 出力】
 * なし / BodyDataRecord 配列。
 *
 * 【副作用】
 * なし。
 */
function createSeedHistory(): BodyDataRecord[] {
  const base: Omit<BodyDataRecord, 'date'> = {
    weight: 72.4,
    bodyFat: 15.8,
    muscleMass: 55.3,
    bmi: Number((72.4 / (DEFAULT_HEIGHT_M * DEFAULT_HEIGHT_M)).toFixed(1)),
    waterContent: 58.3,
    visceralFat: 9,
  };

  return Array.from({ length: 10 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const fluctuation = (Math.random() - 0.5) * 0.8;
    const weight = Number((base.weight + fluctuation).toFixed(1));
    const bodyFat = Number((base.bodyFat + fluctuation * 0.4).toFixed(1));
    const muscleMass = Number((base.muscleMass + fluctuation * 0.7).toFixed(1));
    const bmi = Number((weight / (DEFAULT_HEIGHT_M * DEFAULT_HEIGHT_M)).toFixed(1));
    const waterContent = Number((base.waterContent + fluctuation * 0.5).toFixed(1));
    const visceralFat = Number((base.visceralFat + fluctuation * 0.6).toFixed(0));

    return {
      date: date.toISOString().slice(0, 10),
      weight,
      bodyFat,
      muscleMass,
      bmi,
      waterContent,
      visceralFat,
    } satisfies BodyDataRecord;
  }).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * normalizeNumericField
 *
 * 【処理概要】
 * undefined の場合は既存値を返し、定義されている場合は Number 化して丸める。
 *
 * 【呼び出し元】
 * addEntry / updateEntry 内。
 *
 * 【入力 / 出力】
 * 値, 小数点以下桁数 / 正規化後の数値。
 *
 * 【副作用】
 * なし。
 */
function normalizeNumericField(value: number | undefined, digits = 1): number | undefined {
  if (value === undefined) return undefined;
  return Number(value.toFixed(digits));
}

/**
 * useBodyDataStore
 *
 * 【処理概要】
 * 身体データ履歴を保持する Zustand ストアを生成し、各種操作関数を公開する。
 *
 * 【呼び出し元】
 * Body タブや他ドメインのロジックから React フックとして利用される。
 *
 * 【入力 / 出力】
 * なし / Zustand フック。
 *
 * 【副作用】
 * 内部的にメモリ上の状態を更新する。
 */
export const useBodyDataStore = create<BodyDataState>((set, get) => ({
  history: createSeedHistory(),
  /**
   * latest
   *
   * 【処理概要】
   * 履歴の先頭要素（最新日）を返し UI へ供給する。
   *
   * 【呼び出し元】
   * Body タブ。
   *
   * 【入力 / 出力】
   * なし / BodyDataRecord | null。
   *
   * 【副作用】
   * なし。
   */
  latest: () => get().history[0] ?? null,
  /**
   * addEntry
   *
   * 【処理概要】
   * 与えられた日付のレコードを新規作成し、存在する場合は上書きする。
   *
   * 【呼び出し元】
   * 身体データ入力モーダル。
   *
   * 【入力 / 出力】
   * 値オブジェクト / なし。
   *
   * 【副作用】
   * history ステートを更新する。
   */
  addEntry: entry => {
    const date = entry.date ?? new Date().toISOString().slice(0, 10);
    set(state => {
      const filtered = state.history.filter(record => record.date !== date);
      const base = filtered[0] ?? createSeedHistory()[0];
      const weight = normalizeNumericField(entry.weight ?? base.weight);
      const bmi = normalizeNumericField(
        entry.bmi ??
          (weight !== undefined ? weight / (DEFAULT_HEIGHT_M * DEFAULT_HEIGHT_M) : base.bmi),
        1,
      );

      const newRecord: BodyDataRecord = {
        date,
        weight: weight ?? base.weight,
        bodyFat: normalizeNumericField(entry.bodyFat ?? base.bodyFat) ?? base.bodyFat,
        muscleMass: normalizeNumericField(entry.muscleMass ?? base.muscleMass) ?? base.muscleMass,
        bmi: bmi ?? base.bmi,
        waterContent: normalizeNumericField(entry.waterContent ?? base.waterContent) ?? base.waterContent,
        visceralFat: normalizeNumericField(entry.visceralFat ?? base.visceralFat, 0) ?? base.visceralFat,
      };

      return {
        history: [newRecord, ...filtered].sort((a, b) => (a.date < b.date ? 1 : -1)),
      };
    });
  },
  /**
   * updateEntry
   *
   * 【処理概要】
   * 指定日付のフィールドを差分更新し、BMI を再計算する。
   *
   * 【呼び出し元】
   * 履歴モーダルでの編集。
   *
   * 【入力 / 出力】
   * date, updates / なし。
   *
   * 【副作用】
   * history の該当要素を書き換える。
   */
  updateEntry: (date, updates) => {
    set(state => ({
      history: state.history
        .map(record => {
          if (record.date !== date) return record;
          const weight = normalizeNumericField(updates.weight ?? record.weight);
          const bmi = normalizeNumericField(
            updates.bmi ?? (weight !== undefined ? weight / (DEFAULT_HEIGHT_M * DEFAULT_HEIGHT_M) : record.bmi),
            1,
          );
          return {
            ...record,
            ...updates,
            weight: weight ?? record.weight,
            bodyFat: normalizeNumericField(updates.bodyFat ?? record.bodyFat) ?? record.bodyFat,
            muscleMass: normalizeNumericField(updates.muscleMass ?? record.muscleMass) ?? record.muscleMass,
            bmi: bmi ?? record.bmi,
            waterContent: normalizeNumericField(updates.waterContent ?? record.waterContent) ?? record.waterContent,
            visceralFat: normalizeNumericField(updates.visceralFat ?? record.visceralFat, 0) ?? record.visceralFat,
          } satisfies BodyDataRecord;
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    }));
  },
  /**
   * removeEntry
   *
   * 【処理概要】
   * 指定日付のレコードを履歴から取り除く。
   *
   * 【呼び出し元】
   * 履歴モーダル。
   *
   * 【入力 / 出力】
   * date / なし。
   *
   * 【副作用】
   * history 配列を更新。
   */
  removeEntry: date => {
    set(state => ({ history: state.history.filter(record => record.date !== date) }));
  },
  /**
   * getTrend
   *
   * 【処理概要】
   * 最新値と前日の差分を計算してトレンド値を返す。
   *
   * 【呼び出し元】
   * BodyDataCard。
   *
   * 【入力 / 出力】
   * field / number。
   *
   * 【副作用】
   * なし。
   */
  getTrend: field => {
    const { history } = get();
    if (history.length < 2) return 0;
    return Number((history[0][field] - history[1][field]).toFixed(1));
  },
  /**
   * getSeries
   *
   * 【処理概要】
   * 指定フィールドの過去 N 日値を古い順に返す。
   *
   * 【呼び出し元】
   * BodyDataCard のチャート描画。
   *
   * 【入力 / 出力】
   * field, length / number[]。
   *
   * 【副作用】
   * なし。
   */
  getSeries: (field, length = 7) => {
    return get()
      .history.slice(0, length)
      .map(record => record[field])
      .reverse();
  },
}));

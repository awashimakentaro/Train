/**
 * lib/ai/calorieEstimationAgent.ts
 *
 * 【責務】
 * OpenAI API を介してトレーニングセッションの消費カロリーを推定し、総量と種目別の内訳を返す。
 *
 * 【使用箇所】
 * - hooks/useTrainingSession.ts からの推定リクエスト
 *
 * 【やらないこと】
 * - Zustand ストア更新
 * - UI レンダリング
 *
 * 【他ファイルとの関係】
 * - .env.example に追加した EXPO_PUBLIC_OPENAI_API_KEY を利用する。
 */

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

/**
 * MissingOpenAIKeyError
 *
 * 【責務】
 * OpenAI API キーが未設定の場合に明示的な例外として利用する。
 */
export class MissingOpenAIKeyError extends Error {
  constructor() {
    super('OpenAI API キーが設定されていません');
    this.name = 'MissingOpenAIKeyError';
  }
}

export interface CalorieEstimationExercisePayload {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  trainingSeconds: number;
}

export interface CalorieEstimationPayload {
  user: {
    weightKg: number;
    heightCm?: number;
    gender?: 'male' | 'female' | 'other';
    bodyFat?: number;
    muscleMass?: number;
  };
  session: {
    durationSeconds: number;
  };
  exercises: CalorieEstimationExercisePayload[];
}

export interface CalorieEstimationResult {
  totalCalories: number;
  perExercise: { id: string; name: string; calories: number; reasoning?: string }[];
  reasoning: string;
  model: string;
  confidence?: number;
}

function getApiKey() {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
}

function buildUserPrompt(payload: CalorieEstimationPayload) {
  return (
    '以下の JSON を参照してトレーニングの消費カロリーを推定してください。' +
    ' 有酸素ではなくレジスタンストレーニングであるため METs と体重を組み合わせ、' +
    '重い重量やセット数が多いほどカロリーが増えるよう考慮します。' +
    ' 応答は必ず次のスキーマの JSON のみ: ' +
    '{"totalCalories":number,"perExercise":[{"id":"string","name":"string","calories":number,"reasoning":"string"}],"reasoning":"string","model":"' +
    OPENAI_MODEL +
    '","confidence":number}。入力: ' +
    JSON.stringify(payload) +
    '。'
  );
}

function stripCodeFences(content: string) {
  const fenceMatch = content.match(/```(?:json)?([\s\S]*?)```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return content.trim();
}

function parseResult(content: string): CalorieEstimationResult {
  const normalized = stripCodeFences(content);
  const firstBrace = normalized.indexOf('{');
  const lastBrace = normalized.lastIndexOf('}');
  const jsonSlice = firstBrace >= 0 && lastBrace >= firstBrace ? normalized.slice(firstBrace, lastBrace + 1) : normalized;
  const parsed = JSON.parse(jsonSlice) as Partial<CalorieEstimationResult>;
  if (typeof parsed.totalCalories !== 'number' || !Array.isArray(parsed.perExercise)) {
    throw new Error('OpenAI 応答の形式が不正です');
  }
  return {
    totalCalories: Math.max(0, Math.round(parsed.totalCalories)),
    perExercise: parsed.perExercise.map(item => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      calories: typeof item.calories === 'number' ? Math.max(0, Math.round(item.calories)) : 0,
      reasoning: item.reasoning ? String(item.reasoning) : undefined,
    })),
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    model: parsed.model ?? OPENAI_MODEL,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
  } satisfies CalorieEstimationResult;
}

/**
 * estimateTrainingCaloriesWithAI
 *
 * 【処理概要】
 * OpenAI へチャット補完リクエストを送り、推定結果を JSON として受け取る。
 *
 * 【呼び出し元】
 * hooks/useTrainingSession.ts 内の AI 推定要求。
 *
 * 【入力 / 出力】
 * CalorieEstimationPayload / CalorieEstimationResult。
 *
 * 【副作用】
 * ネットワークリクエストを発行する。
 */
export async function estimateTrainingCaloriesWithAI(payload: CalorieEstimationPayload): Promise<CalorieEstimationResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new MissingOpenAIKeyError();
  }
  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'あなたはレジスタンストレーニングのエネルギー消費を推定するエージェントです。' +
            ' METs, 推定 VO2, 筋群ごとのエネルギーコストを参考にして定量的な出力を返します。',
        },
        {
          role: 'user',
          content: buildUserPrompt(payload),
        },
      ],
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    const message = json?.error?.message ?? 'OpenAI API リクエストに失敗しました';
    throw new Error(message);
  }
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenAI API からテキスト応答を取得できませんでした');
  }
  return parseResult(content);
}

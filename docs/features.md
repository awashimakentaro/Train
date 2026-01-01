# 筋トレ管理アプリ - 詳細機能仕様書 (features.md)

## 目次
1. [アーキテクチャ概要](#1-アーキテクチャ概要)
2. [データベース設計](#2-データベース設計)
3. [状態管理とデータフロー](#3-状態管理とデータフロー)
4. [機能詳細](#4-機能詳細)
5. [コンポーネント設計](#5-コンポーネント設計)
6. [データ連携フロー](#6-データ連携フロー)
7. [API設計（将来実装）](#7-api設計将来実装)
8. [パフォーマンス最適化](#8-パフォーマンス最適化)

---

## 1. アーキテクチャ概要

### 1.1 システム構成図
```
┌─────────────────────────────────────────────┐
│           User Interface (UI)               │
│  ┌──────────┬──────────┬──────────────┐    │
│  │ Menu Tab │ Body Tab │ Calories Tab │    │
│  └──────────┴──────────┴──────────────┘    │
│              Tab Bar Navigation             │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│        Application State (React State)       │
│  ┌──────────────┬───────────────────────┐   │
│  │ Menu Presets │ Body Data History     │   │
│  │ Exercises    │ Calorie History       │   │
│  │ UI State     │ Training Session Data │   │
│  └──────────────┴───────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│      Data Persistence Layer (Future)         │
│  ┌──────────────┬───────────────────────┐   │
│  │ AsyncStorage │ SQLite / Cloud DB     │   │
│  │ (Local)      │ (Remote Sync)         │   │
│  └──────────────┴───────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 1.2 技術スタック詳細

#### フロントエンド
- **React Native (Expo)**: クロスプラットフォーム開発フレームワーク
- **TypeScript**: 型安全性の確保
- **Tailwind CSS v4.0**: ユーティリティファーストのスタイリング
- **Recharts**: データビジュアライゼーション（グラフ表示）
- **Lucide React**: アイコンライブラリ

#### 状態管理
- **React Hooks (useState)**: ローカル状態管理
- **Props Drilling**: コンポーネント間のデータ受け渡し
- **将来**: Context API / Redux / Zustand の導入検討

#### データ永続化（将来実装）
- **AsyncStorage**: ローカルストレージ（シンプルなKey-Value）
- **SQLite**: リレーショナルDB（複雑なクエリが必要な場合）
- **Supabase / Firebase**: クラウドバックエンド（同期・認証）

---

## 2. データベース設計

### 2.1 現在のデータ構造（メモリ上）

#### 2.1.1 Exercises（トレーニング種目）
```typescript
interface Exercise {
  id: string;              // ユニークID（タイムスタンプベース）
  name: string;            // 種目名（例: ベンチプレス）
  weight: number;          // 使用重量（kg）
  sets: number;            // セット数
  restTime: number;        // 休憩時間（秒）
  trainingTime: number;    // 実施時間（秒）
  enabled: boolean;        // 有効/無効フラグ
  memo?: string;           // メモ（オプション）
  youtubeUrl?: string;     // YouTube参考動画URL（オプション）
}
```

**格納場所**: `MenuPreset.exercises[]`  
**アクセス**: `App.tsx` の `menuPresets` state経由

#### 2.1.2 MenuPresets（メニュープリセット）
```typescript
interface MenuPreset {
  id: string;              // ユニークID（タイムスタンプベース）
  name: string;            // プリセット名（例: 胸・肩の日）
  exercises: Exercise[];   // 種目配列
}
```

**格納場所**: `App.tsx` の `menuPresets` state  
**初期値**: 空配列 `[]`  
**操作**:
- 作成: `handleCreatePreset()`
- 削除: `handleDeletePreset()`
- 選択: `setSelectedPresetId()`

#### 2.1.3 BodyData（身体データ）
```typescript
interface BodyData {
  date: string;              // 日付（YYYY-MM-DD形式）
  weight?: number;           // 体重（kg）
  bodyFat?: number;          // 体脂肪率（%）
  muscleMass?: number;       // 筋肉量（kg）
  bmi?: number;              // BMI
  waterContent?: number;     // 水分量（%）
  visceralFat?: number;      // 内臓脂肪レベル
  basalMetabolism?: number;  // 基礎代謝（kcal）
}
```

**格納場所**: `App.tsx` の `bodyDataHistory` state  
**初期値**: サンプルデータ（過去7日分）  
**ソート**: 日付降順（最新が先頭）  
**操作**:
- 追加: `handleAddBodyData()`（当日データは上書き）
- 更新: `handleUpdateBodyData()`
- 削除: `handleDeleteBodyData()`

#### 2.1.4 CalorieData（カロリーデータ）
```typescript
interface CalorieData {
  date: string;              // 日付（YYYY-MM-DD形式）
  consumed: number;          // 摂取カロリー（kcal）
  burned: number;            // 消費カロリー（kcal）
  trainingSessions: {
    menuName: string;        // トレーニングメニュー名
    calories: number;        // 消費カロリー
    time: number;            // 実施時間（秒）
  }[];
}
```

**格納場所**: `App.tsx` の `calorieHistory` state  
**初期値**: サンプルデータ（過去7日分）  
**ソート**: 日付降順（最新が先頭）  
**操作**:
- 摂取カロリー追加: `handleAddConsumedCalories()`（累積加算）
- 消費カロリー追加: `handleAddBurnedCalories()`（累積加算）
- トレーニング完了時自動記録: `handleFinishTraining()`

### 2.2 将来のデータベース設計（SQLite / Cloud DB）

#### 2.2.1 テーブル設計

**users テーブル**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  weight REAL,  -- デフォルト体重
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**menu_presets テーブル**
```sql
CREATE TABLE menu_presets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**exercises テーブル**
```sql
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  preset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  weight REAL NOT NULL,
  sets INTEGER NOT NULL,
  rest_time INTEGER NOT NULL,
  training_time INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  memo TEXT,
  youtube_url TEXT,
  order_index INTEGER NOT NULL,  -- 表示順序
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (preset_id) REFERENCES menu_presets(id) ON DELETE CASCADE
);
```

**body_data テーブル**
```sql
CREATE TABLE body_data (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  weight REAL,
  body_fat REAL,
  muscle_mass REAL,
  bmi REAL,
  water_content REAL,
  visceral_fat INTEGER,
  basal_metabolism INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)  -- 1日1エントリ
);
```

**calorie_data テーブル**
```sql
CREATE TABLE calorie_data (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  consumed INTEGER DEFAULT 0,
  burned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);
```

**training_sessions テーブル**
```sql
CREATE TABLE training_sessions (
  id TEXT PRIMARY KEY,
  calorie_data_id TEXT NOT NULL,
  menu_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  time INTEGER NOT NULL,  -- 秒
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (calorie_data_id) REFERENCES calorie_data(id) ON DELETE CASCADE
);
```

**training_logs テーブル（将来拡張）**
```sql
CREATE TABLE training_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  total_time INTEGER,
  total_calories INTEGER,
  status TEXT CHECK(status IN ('in_progress', 'completed', 'cancelled')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (preset_id) REFERENCES menu_presets(id) ON DELETE SET NULL
);
```

**exercise_logs テーブル（将来拡張）**
```sql
CREATE TABLE exercise_logs (
  id TEXT PRIMARY KEY,
  training_log_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  weight REAL NOT NULL,
  sets_completed INTEGER NOT NULL,
  total_time INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  FOREIGN KEY (training_log_id) REFERENCES training_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
);
```

#### 2.2.2 インデックス設計
```sql
-- 日付での高速検索
CREATE INDEX idx_body_data_date ON body_data(user_id, date DESC);
CREATE INDEX idx_calorie_data_date ON calorie_data(user_id, date DESC);
CREATE INDEX idx_training_logs_date ON training_logs(user_id, started_at DESC);

-- プリセット・種目の検索
CREATE INDEX idx_exercises_preset ON exercises(preset_id, order_index);
```

---

## 3. 状態管理とデータフロー

### 3.1 App.tsx の状態管理

#### 3.1.1 State変数一覧
```typescript
// UI状態
const [activeTab, setActiveTab] = useState<TabType>('menu');
const [isTraining, setIsTraining] = useState(false);
const [showTrainingResult, setShowTrainingResult] = useState(false);
const [trainingResultData, setTrainingResultData] = useState<...>(null);

// データ状態
const [menuPresets, setMenuPresets] = useState<MenuPreset[]>([]);
const [selectedPresetId, setSelectedPresetId] = useState<string>('');
const [bodyDataHistory, setBodyDataHistory] = useState<BodyData[]>([...]);
const [calorieHistory, setCalorieHistory] = useState<CalorieData[]>([...]);
```

### 3.2 データフロー図

#### 3.2.1 トレーニングメニューのデータフロー
```
┌─────────────────────────────────────────────────────┐
│                    App.tsx                          │
│  menuPresets: MenuPreset[]                          │
│  selectedPresetId: string                           │
└─────────────────────────────────────────────────────┘
                        ↓ Props
┌─────────────────────────────────────────────────────┐
│                  MenuScreen.tsx                     │
│  - プリセット一覧表示                                  │
│  - プリセット選択                                      │
│  - 種目一覧表示（選択したプリセット）                    │
└─────────────────────────────────────────────────────┘
        ↓ onCreatePreset                ↓ onDeletePreset
┌─────────────────────┐      ┌─────────────────────────┐
│ handleCreatePreset  │      │   handleDeletePreset    │
│ - 新規Preset作成    │      │   - Preset削除          │
│ - setMenuPresets    │      │   - setMenuPresets      │
└─────────────────────┘      └─────────────────────────┘
```

#### 3.2.2 種目編集のデータフロー
```
MenuScreen.tsx
    ↓ exercises prop (selectedPreset.exercises)
ExerciseItem.tsx
    ↓ onUpdate callback
MenuScreen.tsx
    ↓ onUpdateExercise callback
App.tsx
    ↓ handleUpdateExercise()
setMenuPresets(prev => prev.map(...))
    ↓
MenuScreen.tsx に新しい exercises が伝播
    ↓
ExerciseItem.tsx が再レンダリング
```

#### 3.2.3 トレーニング実行のデータフロー
```
MenuScreen.tsx
    ↓ 「トレーニング開始」ボタン
App.tsx (handleStartTraining)
    ↓ setIsTraining(true)
TrainingSession.tsx がマウント
    ↓ exercises prop（有効な種目のみ）
    ↓ userWeight prop（最新の体重）
タイマー実行・カロリー計算
    ↓ onComplete callback
App.tsx (handleFinishTraining)
    ↓ setIsTraining(false)
    ↓ setShowTrainingResult(true)
    ↓ setCalorieHistory（自動記録）
TrainingResult.tsx がマウント
    ↓ 結果表示
    ↓ onClose callback
App.tsx
    ↓ setShowTrainingResult(false)
MenuScreen.tsx に戻る
```

#### 3.2.4 身体データのデータフロー
```
BodyDataScreen.tsx
    ↓ 「+データ入力」ボタン
AddBodyDataModal.tsx がオープン
    ↓ ユーザー入力
    ↓ onAddBodyData callback
App.tsx (handleAddBodyData)
    ↓ 当日データ存在チェック
    ↓ 存在する → 上書き
    ↓ 存在しない → 追加
setBodyDataHistory(...)
    ↓
BodyDataScreen.tsx に新しいデータが伝播
    ↓
BodyDataCard.tsx が再レンダリング（最新値・グラフ更新）
```

#### 3.2.5 カロリーデータのデータフロー
```
CaloriesScreen.tsx
    ↓ 「+カロリーを追加」ボタン
カロリー入力モーダルがオープン
    ↓ ユーザー入力（摂取 or 消費）
    ↓ onAddConsumedCalories / onAddBurnedCalories callback
App.tsx (handleAddConsumedCalories / handleAddBurnedCalories)
    ↓ 当日データ存在チェック
    ↓ 存在する → 累積加算
    ↓ 存在しない → 新規作成
setCalorieHistory(...)
    ↓
CaloriesScreen.tsx に新しいデータが伝播
    ↓
サマリーカード・グラフ・カレンダーが再レンダリング
```

### 3.3 Props伝播マップ

#### App.tsx → MenuScreen.tsx
```typescript
<MenuScreen
  exercises={selectedPreset?.exercises || []}
  onStartTraining={() => setIsTraining(true)}
  onUpdateExercise={handleUpdateExercise}
  selectedPresetId={selectedPresetId}
  setSelectedPresetId={setSelectedPresetId}
  menuPresets={menuPresets}
  onCreatePreset={handleCreatePreset}
  onDeletePreset={handleDeletePreset}
  onAddExercise={handleAddExercise}
  onDeleteExercise={handleDeleteExercise}
/>
```

#### App.tsx → BodyDataScreen.tsx
```typescript
<BodyDataScreen
  bodyDataHistory={bodyDataHistory}
  onAddBodyData={handleAddBodyData}
  onUpdateBodyData={handleUpdateBodyData}
  onDeleteBodyData={handleDeleteBodyData}
/>
```

#### App.tsx → CaloriesScreen.tsx
```typescript
<CaloriesScreen
  bodyDataHistory={bodyDataHistory}
  menuPresets={menuPresets}
  calorieHistory={calorieHistory}
  onAddConsumedCalories={handleAddConsumedCalories}
  onAddBurnedCalories={handleAddBurnedCalories}
/>
```

#### App.tsx → TrainingSession.tsx
```typescript
<TrainingSession 
  exercises={enabledExercises}
  userWeight={bodyDataHistory[0]?.weight || 70}
  onExit={() => setIsTraining(false)}
  onComplete={handleFinishTraining}
/>
```

---

## 4. 機能詳細

### 4.1 トレーニングメニュー機能

#### 4.1.1 プリセット管理

**場所**: `MenuScreen.tsx`

**機能一覧**:
1. **プリセット一覧表示**
   - `menuPresets.map()` でループ表示
   - 選択中のプリセットは視覚的にハイライト（グラデーション背景）
   - 各プリセットに名前・種目数・削除ボタンを表示

2. **プリセット選択**
   - クリックで `setSelectedPresetId(preset.id)` を実行
   - App.tsx の `selectedPresetId` が更新される
   - `selectedPreset` が変わり、「今日のメニュー」が更新される

3. **プリセット作成**
   - 「+新しいメニューを作成」ボタン
   - `CreatePresetModal.tsx` が開く
   - モーダル内で名前・種目を入力
   - `onCreatePreset(name, exercises)` コールバック実行
   - App.tsx の `handleCreatePreset()` で新規プリセット作成
   - `setMenuPresets(prev => [...prev, newPreset])`
   - 作成したプリセットを自動選択: `setSelectedPresetId(newPreset.id)`

4. **プリセット削除**
   - 削除ボタンクリックで確認ダイアログ表示
   - 確認後 `onDeletePreset(id)` コールバック実行
   - App.tsx の `handleDeletePreset()` で削除
   - `setMenuPresets(prev => prev.filter(preset => preset.id !== id))`
   - 削除したプリセットが選択中なら `setSelectedPresetId('')` でリセット

**データフロー**:
```
ユーザー操作 → MenuScreen.tsx → Callback → App.tsx
→ setMenuPresets() → State更新 → MenuScreen.tsx 再レンダリング
```

#### 4.1.2 種目管理

**場所**: `MenuScreen.tsx` + `ExerciseItem.tsx`

**機能一覧**:
1. **種目一覧表示**
   - `selectedPreset.exercises.map()` でループ表示
   - 各種目を `ExerciseItem.tsx` コンポーネントで表示
   - ON/OFFトグル、展開/折りたたみ、削除ボタン

2. **種目追加**
   - 「種目追加」ボタンで入力フォームを表示
   - 種目名、重量、セット数、休憩時間、実施時間を入力
   - 「追加」ボタンで `onAddExercise(exercise)` コールバック実行
   - App.tsx の `handleAddExercise()` で種目追加
   - 選択中のプリセットの `exercises` 配列に追加

3. **種目編集**
   - `ExerciseItem.tsx` の展開エリアで編集
   - 各フィールドの変更時に `onUpdate(id, updates)` コールバック実行
   - MenuScreen.tsx → `onUpdateExercise` → App.tsx の `handleUpdateExercise()`
   - 対象プリセットの対象種目を更新

4. **種目削除**
   - 削除ボタンで `onDelete(id)` コールバック実行
   - App.tsx の `handleDeleteExercise()` で削除
   - `exercises.filter(ex => ex.id !== id)` で対象種目を除外

5. **種目の有効/無効切り替え**
   - チェックボックスで `enabled` フラグを切り替え
   - `onUpdate(id, { enabled })` で更新
   - 無効な種目はトレーニング開始時に除外される

**データフロー**:
```
ExerciseItem.tsx (ユーザー入力)
→ onUpdate callback → MenuScreen.tsx
→ onUpdateExercise callback → App.tsx
→ handleUpdateExercise() → setMenuPresets()
→ State更新 → Props更新 → ExerciseItem.tsx 再レンダリング
```

#### 4.1.3 トレーニング開始

**場所**: `MenuScreen.tsx`

**条件**:
- 有効な種目（`enabled: true`）が1つ以上存在する
- 条件を満たさない場合、ボタンは無効化（`disabled: true`）

**実行フロー**:
1. 「🏋️ トレーニング開始」ボタンをクリック
2. `onStartTraining()` コールバック実行
3. App.tsx で `setIsTraining(true)`
4. App.tsx が `TrainingSession.tsx` をレンダリング
5. 有効な種目のみを `enabledExercises` として渡す
6. 最新の体重データを `userWeight` として渡す

### 4.2 トレーニング進行機能

#### 4.2.1 タイマーシステム

**場所**: `TrainingSession.tsx`

**状態管理**:
```typescript
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
const [currentSet, setCurrentSet] = useState(1);
const [phase, setPhase] = useState<'training' | 'rest'>('training');
const [timeRemaining, setTimeRemaining] = useState(0);
const [isPaused, setIsPaused] = useState(false);
const [exerciseTimeTracking, setExerciseTimeTracking] = useState<{[key: number]: number}>({});
```

**タイマーロジック**:
```typescript
useEffect(() => {
  if (isPaused || timeRemaining === 0) return;

  const timer = setInterval(() => {
    // トレーニング時間のみ記録（休憩時間は除外）
    if (phase === 'training') {
      setExerciseTimeTracking(prev => ({
        ...prev,
        [currentExerciseIndex]: (prev[currentExerciseIndex] || 0) + 1
      }));
    }

    setTimeRemaining(prev => {
      if (prev <= 1) {
        handlePhaseComplete();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [isPaused, timeRemaining, phase]);
```

**フェーズ遷移**:
```
トレーニング開始
    ↓
トレーニングフェーズ（trainingTime秒）
    ↓ タイマー完了
休憩フェーズ（restTime秒）
    ↓ タイマー完了
次セットへ（currentSet++）
    ↓ 全セット完了
次種目へ（currentExerciseIndex++）
    ↓ 全種目完了
トレーニング完了（onComplete）
```

#### 4.2.2 カロリー計算システム

**計算方法**: METs法（Metabolic Equivalents）

**強度判定**:
```typescript
const calculateMETs = (exerciseWeight: number, bodyWeight: number): number => {
  const intensity = exerciseWeight / bodyWeight;
  if (intensity >= 0.5) return 8.0; // 高強度
  if (intensity >= 0.3) return 6.0; // 中強度
  return 4.0;                       // 低強度
};
```

**カロリー計算**:
```typescript
const calculateCalories = (weight: number, mets: number, timeInSeconds: number): number => {
  const hours = timeInSeconds / 3600;
  return mets * weight * hours;
};
```

**例**:
- 体重: 70kg
- 使用重量: 40kg（強度 = 40/70 = 0.57 → 高強度 8.0 METs）
- トレーニング時間: 300秒（5分 = 0.083時間）
- 消費カロリー: 8.0 × 70 × 0.083 = 46.48 kcal

**各種目の計算**:
- トレーニング時間のみカウント（休憩時間は除外）
- `exerciseTimeTracking` で各種目の実トレーニング時間を記録
- 完了時に各種目ごとにカロリーを計算
- 合計カロリーを算出

#### 4.2.3 操作機能

**一時停止/再開**:
- `isPaused` state で制御
- `setIsPaused(!isPaused)` でトグル
- タイマーは useEffect の依存配列に `isPaused` を含むため自動で停止/再開

**スキップ**:
- 現在のフェーズを強制完了
- `handlePhaseComplete()` を直接実行
- トレーニング中 → 休憩へ
- 休憩中 → 次セット/次種目へ

**終了**:
- 確認ダイアログ表示
- 確認後 `onExit()` コールバック実行
- App.tsx で `setIsTraining(false)`
- メニュー画面に戻る（データは保存されない）

**YouTube動画表示**:
- 種目に `youtubeUrl` が設定されている場合のみ表示
- YouTubeアイコンをタップで外部ブラウザで開く

#### 4.2.4 完了処理

**実行フロー**:
1. 全種目・全セット完了
2. 各種目の消費カロリーを計算
3. 結果データを構築:
```typescript
{
  totalTime: number,
  totalCalories: number,
  completedExercises: [
    {
      name: string,
      weight: number,
      sets: number,
      totalTime: number,
      calories: number
    }
  ]
}
```
4. `onComplete(result)` コールバック実行
5. App.tsx の `handleFinishTraining()` で処理
6. `setIsTraining(false)`
7. `setShowTrainingResult(true)`
8. `setTrainingResultData(result)`
9. カロリー履歴に自動記録

### 4.3 トレーニング結果機能

**場所**: `TrainingResult.tsx`

**表示内容**:
- メニュー名
- 総消費カロリー（大きく目立つ表示）
- トレーニング時間（分単位）
- 完了種目数
- 各種目の詳細（名前、重量、セット数、時間、カロリー）

**データ保存**:
- 自動でカロリー履歴に記録
- `trainingSession` としてメニュー名・カロリー・時間を保存
- 当日のデータに追加（複数セッション対応）

**操作**:
- 「完了」ボタンで閉じる
- App.tsx で `setShowTrainingResult(false)`
- メニュー画面に戻る

### 4.4 身体データ管理機能

#### 4.4.1 データ入力

**場所**: `AddBodyDataModal.tsx`

**入力項目**:
- 体重（kg）
- 体脂肪率（%）
- 筋肉量（kg）
- BMI
- 水分量（%）
- 内臓脂肪レベル
- 基礎代謝（kcal）

**入力フロー**:
1. 「+データ入力」ボタンでモーダルオープン
2. 各項目を入力（オプショナル）
3. 「保存」ボタンで `onAddBodyData(data)` コールバック実行
4. App.tsx の `handleAddBodyData()` で処理
5. 当日のデータが既に存在する場合は上書き
6. 新規の場合は配列の先頭に追加（日付降順維持）

**上書きロジック**:
```typescript
const today = new Date().toISOString().split('T')[0];
const existingIndex = bodyDataHistory.findIndex(d => d.date === today);

if (existingIndex >= 0) {
  // 上書き
  setBodyDataHistory(prev =>
    prev.map((d, index) =>
      index === existingIndex ? { ...d, ...data } : d
    )
  );
} else {
  // 新規追加
  setBodyDataHistory(prev => [{ date: today, ...data }, ...prev]);
}
```

#### 4.4.2 データ表示（カード）

**場所**: `BodyDataCard.tsx`

**表示内容**:
- 指標名（体重、体脂肪率など）
- 最新値（1小数点表示）
- 単位（kg, %, kcal など）
- トレンド（前日比）
  - 増加: 赤色・上矢印
  - 減少: 緑色・下矢印
  - 変化なし: グレー
- 7日間の推移グラフ（折れ線グラフ）

**グラフデータ生成**:
```typescript
const getChartData = (field: keyof BodyData) => {
  return bodyDataHistory
    .slice(0, 7)      // 最新7日分
    .reverse()        // 古い順に並び替え（グラフ表示用）
    .map(d => ({ value: d[field] || 0 }));
};
```

**トレンド計算**:
```typescript
const getTrend = (field: keyof BodyData) => {
  if (bodyDataHistory.length < 2) return 0;
  const latest = bodyDataHistory[0][field] || 0;
  const previous = bodyDataHistory[1][field] || 0;
  return latest - previous;
};
```

**インタラクション**:
- カードタップで履歴モーダルオープン
- `onHistoryClick()` コールバック実行

#### 4.4.3 履歴モーダル

**場所**: `BodyDataHistoryModal.tsx`

**表示内容**:
- 指標名
- 全履歴データ（日付降順）
- 各エントリの値、日付、編集/削除ボタン

**編集機能**:
1. 編集ボタンクリック
2. インライン入力フォーム表示
3. 値を変更
4. 保存ボタンで `onUpdateBodyData(date, updates)` コールバック実行
5. App.tsx の `handleUpdateBodyData()` で更新
6. `bodyDataHistory.map()` で対象日付のデータを更新

**削除機能**:
1. 削除ボタンクリック
2. 確認ダイアログ表示
3. 確認後 `onDeleteBodyData(date)` コールバック実行
4. App.tsx の `handleDeleteBodyData()` で削除
5. `bodyDataHistory.filter(data => data.date !== date)` で除外

### 4.5 カロリー管理機能

#### 4.5.1 カロリー入力

**場所**: `CaloriesScreen.tsx`（モーダル内）

**入力タイプ**:
1. **摂取カロリー**
   - カロリー値（kcal）を入力
   - `onAddConsumedCalories(calories)` コールバック実行
   - 当日の `consumed` に加算

2. **消費カロリー**
   - カロリー値（kcal）を入力
   - 活動名（オプション）を入力
   - `onAddBurnedCalories(calories, activityName)` コールバック実行
   - 当日の `burned` に加算
   - 活動名があれば `trainingSessions` に記録

**累積加算ロジック**:
```typescript
const handleAddConsumedCalories = (calories: number) => {
  const today = new Date().toISOString().split('T')[0];
  const existingIndex = calorieHistory.findIndex(d => d.date === today);
  
  if (existingIndex >= 0) {
    // 既存データに加算
    setCalorieHistory(prev =>
      prev.map((d, index) =>
        index === existingIndex
          ? { ...d, consumed: d.consumed + calories }
          : d
      )
    );
  } else {
    // 新規作成
    setCalorieHistory(prev => [
      {
        date: today,
        consumed: calories,
        burned: 0,
        trainingSessions: [],
      },
      ...prev,
    ]);
  }
};
```

#### 4.5.2 サマリー表示

**場所**: `CaloriesScreen.tsx`

**表示項目**:
- **摂取カロリー**: 緑系グラデーションカード
- **消費カロリー**: オレンジ系グラデーションカード
- **カロリー収支**: 
  - プラス（摂取 > 消費）→ 赤系カード・上矢印
  - マイナス（摂取 < 消費）→ 青系カード・下矢印

**データ取得**:
```typescript
const today = new Date().toISOString().split('T')[0];
const todayData = calorieHistory.find(d => d.date === today);
const netCalories = (todayData?.consumed || 0) - (todayData?.burned || 0);
```

#### 4.5.3 週間グラフ

**場所**: `CaloriesScreen.tsx`

**グラフライブラリ**: Recharts（LineChart）

**データ生成**:
```typescript
const chartData = calorieHistory
  .slice(0, 7)      // 最新7日分
  .reverse()        // 古い順に並び替え
  .map(data => ({
    date: formatDate(data.date),      // 例: 12/25
    摂取: data.consumed,
    消費: data.burned,
    差分: data.consumed - data.burned,
  }));
```

**表示内容**:
- X軸: 日付（M/D形式）
- Y軸: カロリー（kcal）
- 3本の折れ線:
  - 摂取カロリー（緑）
  - 消費カロリー（オレンジ）
  - 差分（紫）

#### 4.5.4 カレンダー表示

**場所**: `CaloriesScreen.tsx`

**カレンダー生成**:
```typescript
const getCalendarDays = () => {
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // 月初の空白セル
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // 日付セル
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
};
```

**セルの表示**:
- **色分け**:
  - カロリープラス → 赤系グラデーション
  - カロリーマイナス → 青系グラデーション
  - データなし → グレー
- **アイコン**:
  - トレーニング実施日（`trainingSessions.length > 0`）→ 炎アイコン表示
- **タップ**:
  - 日付セルタップで日別詳細モーダルオープン

**前月/次月ナビゲーション**:
```typescript
const previousMonth = () => {
  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
};

const nextMonth = () => {
  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
};
```

#### 4.5.5 日別詳細モーダル

**表示内容**:
- 選択した日付
- 摂取カロリー
- 消費カロリー
- カロリー収支
- トレーニングセッション一覧:
  - メニュー名
  - 消費カロリー
  - 実施時間（分:秒）

**データ取得**:
```typescript
const selectedData = calorieHistory.find(d => d.date === selectedDate);
```

#### 4.5.6 自動記録機能

**トリガー**: トレーニング完了時

**処理**: `App.tsx` の `handleFinishTraining()`

**記録内容**:
```typescript
const newSession = {
  menuName: selectedPreset.name,     // 例: "胸・肩の日"
  calories: result.totalCalories,    // 計算された消費カロリー
  time: result.totalTime,            // トレーニング時間（秒）
};
```

**データ更新**:
```typescript
if (existingIndex >= 0) {
  // 既存の当日データに追加
  setCalorieHistory(prev =>
    prev.map((d, index) =>
      index === existingIndex
        ? {
            ...d,
            burned: d.burned + result.totalCalories,
            trainingSessions: [...d.trainingSessions, newSession],
          }
        : d
    )
  );
} else {
  // 新規作成
  setCalorieHistory(prev => [
    {
      date: today,
      consumed: 0,
      burned: result.totalCalories,
      trainingSessions: [newSession],
    },
    ...prev,
  ]);
}
```

---

## 5. コンポーネント設計

### 5.1 コンポーネントツリー

```
App.tsx (Root)
├── TabBar.tsx
├── MenuScreen.tsx (activeTab === 'menu')
│   ├── CreatePresetModal.tsx
│   └── ExerciseItem.tsx (複数)
├── BodyDataScreen.tsx (activeTab === 'body')
│   ├── BodyDataCard.tsx (複数)
│   ├── AddBodyDataModal.tsx
│   └── BodyDataHistoryModal.tsx
├── CaloriesScreen.tsx (activeTab === 'calories')
├── TrainingSession.tsx (isTraining === true)
└── TrainingResult.tsx (showTrainingResult === true)
```

### 5.2 各コンポーネントの役割

#### 5.2.1 App.tsx
- **役割**: 最上位コンポーネント、状態管理の中心
- **責務**:
  - 全データの状態管理（menuPresets, bodyDataHistory, calorieHistory）
  - タブ切り替え管理
  - トレーニング状態管理（isTraining, showTrainingResult）
  - データ操作ハンドラー（追加・更新・削除）
  - 条件付きレンダリング（タブ、トレーニング、結果）

#### 5.2.2 TabBar.tsx
- **役割**: タブナビゲーション
- **責務**:
  - 3つのタブボタン表示（メニュー、身体データ、カロリー）
  - アクティブタブのハイライト表示
  - タブ切り替え（setActiveTab）

#### 5.2.3 MenuScreen.tsx
- **役割**: トレーニングメニュー管理画面
- **責務**:
  - プリセット一覧表示・選択
  - プリセット作成・削除
  - 種目一覧表示
  - 種目追加フォーム
  - トレーニング開始ボタン
- **子コンポーネント**:
  - `CreatePresetModal.tsx`: プリセット作成モーダル
  - `ExerciseItem.tsx`: 各種目の表示・編集

#### 5.2.4 ExerciseItem.tsx
- **役割**: 単一種目の表示・編集
- **責務**:
  - 種目情報表示（名前、重量、セット数）
  - ON/OFFトグル
  - 展開/折りたたみ
  - インライン編集フォーム
  - 削除ボタン
- **状態**: ローカル（expanded）

#### 5.2.5 CreatePresetModal.tsx
- **役割**: プリセット作成モーダル
- **責務**:
  - プリセット名入力
  - 種目追加（複数）
  - プリセット保存
  - 既存プリセット削除
- **状態**: ローカル（入力値、種目リスト）

#### 5.2.6 BodyDataScreen.tsx
- **役割**: 身体データ管理画面
- **責務**:
  - データカード一覧表示
  - データ入力ボタン
  - 履歴モーダル管理
  - グラフデータ生成
  - トレンド計算
- **子コンポーネント**:
  - `BodyDataCard.tsx`: 各指標カード
  - `AddBodyDataModal.tsx`: データ入力モーダル
  - `BodyDataHistoryModal.tsx`: 履歴表示・編集モーダル

#### 5.2.7 BodyDataCard.tsx
- **役割**: 単一指標のカード表示
- **責務**:
  - 指標名・最新値表示
  - トレンド表示（矢印・色）
  - ミニグラフ表示（7日間）
  - タップで履歴モーダル起動

#### 5.2.8 AddBodyDataModal.tsx
- **役割**: 身体データ入力モーダル
- **責務**:
  - 各項目の入力フォーム
  - 保存・キャンセルボタン
- **状態**: ローカル（入力値）

#### 5.2.9 BodyDataHistoryModal.tsx
- **役割**: 身体データ履歴表示・編集モーダル
- **責務**:
  - 履歴一覧表示
  - インライン編集フォーム
  - 削除機能（確認ダイアログ付き）
- **状態**: ローカル（編集中のエントリID）

#### 5.2.10 CaloriesScreen.tsx
- **役割**: カロリー管理画面
- **責務**:
  - 今日のサマリー表示
  - カロリー入力モーダル管理
  - 週間グラフ表示
  - カレンダー表示・ナビゲーション
  - 日別詳細モーダル管理
- **状態**: ローカル（モーダル表示、入力値、選択日付、表示月）

#### 5.2.11 TrainingSession.tsx
- **役割**: トレーニング進行画面
- **責務**:
  - タイマー表示・制御
  - フェーズ管理（トレーニング/休憩）
  - セット・種目進行管理
  - 一時停止・再開・スキップ
  - 時間記録（カロリー計算用）
  - カロリー計算
  - 完了処理
- **状態**: ローカル（タイマー、フェーズ、進捗、時間記録）

#### 5.2.12 TrainingResult.tsx
- **役割**: トレーニング結果表示画面
- **責務**:
  - 総消費カロリー表示
  - トレーニング時間表示
  - 完了種目数表示
  - 種目別詳細表示
  - 閉じるボタン

### 5.3 コンポーネント間の依存関係

```
App.tsx (Data Layer)
    ↓ props
┌───────────────┬───────────────┬───────────────┐
│ MenuScreen    │ BodyDataScreen│ CaloriesScreen│
│   ↓ props     │   ↓ props     │               │
│ ExerciseItem  │ BodyDataCard  │               │
└───────────────┴───────────────┴───────────────┘
    ↓ conditional rendering
┌───────────────┬───────────────┐
│TrainingSession│ TrainingResult│
└───────────────┴───────────────┘
```

---

## 6. データ連携フロー

### 6.1 トレーニング実行時のデータフロー

```
1. ユーザーがメニュー選択
   MenuScreen.tsx → setSelectedPresetId()
   
2. トレーニング開始
   MenuScreen.tsx → onStartTraining()
   App.tsx → setIsTraining(true)
   
3. TrainingSession.tsx マウント
   App.tsx → props: exercises, userWeight
   
4. タイマー実行
   TrainingSession.tsx
   - 各種目の実施時間を記録
   - exerciseTimeTracking state で管理
   
5. カロリー計算
   TrainingSession.tsx
   - 各種目ごとに METs × 体重 × 時間
   - トレーニング時間のみカウント（休憩除く）
   
6. 完了処理
   TrainingSession.tsx → onComplete(result)
   App.tsx → handleFinishTraining(result)
   
7. データ保存
   App.tsx → setCalorieHistory()
   - 当日データに消費カロリー追加
   - trainingSession として記録
   
8. 結果表示
   App.tsx → setShowTrainingResult(true)
   TrainingResult.tsx マウント
   
9. 結果確認後
   TrainingResult.tsx → onClose()
   App.tsx → setShowTrainingResult(false)
   MenuScreen.tsx に戻る
```

### 6.2 身体データ更新時のデータフロー

```
1. データ入力開始
   BodyDataScreen.tsx → setShowAddModal(true)
   AddBodyDataModal.tsx 表示
   
2. ユーザー入力
   AddBodyDataModal.tsx
   - ローカルstate で入力値管理
   
3. 保存
   AddBodyDataModal.tsx → onAddBodyData(data)
   BodyDataScreen.tsx → onAddBodyData(data) (props経由)
   App.tsx → handleAddBodyData(data)
   
4. データ更新
   App.tsx → setBodyDataHistory()
   - 当日データ存在チェック
   - 存在 → 上書き（map）
   - 非存在 → 追加（配列先頭）
   
5. UI再レンダリング
   BodyDataScreen.tsx が新しい bodyDataHistory を受け取る
   BodyDataCard.tsx が再レンダリング
   - 最新値更新
   - トレンド再計算
   - グラフ再描画
```

### 6.3 プリセット作成時のデータフロー

```
1. プリセット作成開始
   MenuScreen.tsx → setIsCreatePresetModalOpen(true)
   CreatePresetModal.tsx 表示
   
2. プリセット名・種目入力
   CreatePresetModal.tsx
   - ローカルstate で管理
   - 種目追加フォーム
   
3. 保存
   CreatePresetModal.tsx → onCreatePreset(name, exercises)
   MenuScreen.tsx → onCreatePreset(name, exercises) (props経由)
   App.tsx → handleCreatePreset(name, exercises)
   
4. データ追加
   App.tsx
   - 新規 MenuPreset オブジェクト作成
   - setMenuPresets(prev => [...prev, newPreset])
   - setSelectedPresetId(newPreset.id) で自動選択
   
5. UI再レンダリング
   MenuScreen.tsx が新しい menuPresets を受け取る
   - プリセット一覧に新プリセット表示
   - 新プリセットがハイライト表示
   - 「今日のメニュー」に新プリセットの種目表示
```

### 6.4 カロリー手動入力時のデータフロー

```
1. カロリー入力開始
   CaloriesScreen.tsx → setShowAddModal(true)
   カロリ���入力モーダル表示
   
2. タイプ選択・カロリー入力
   CaloriesScreen.tsx
   - setCalorieType('consumed' | 'burned')
   - setCalorieInput(value)
   - setActivityNameInput(value) ※消費の場合
   
3. 保存
   CaloriesScreen.tsx → onAddConsumedCalories(calories)
                       or onAddBurnedCalories(calories, activityName)
   App.tsx → handleAddConsumedCalories(calories)
          or handleAddBurnedCalories(calories, activityName)
   
4. データ更新
   App.tsx → setCalorieHistory()
   - 当日データ存在チェック
   - 存在 → 加算（map）
   - 非存在 → 新規作成（配列先頭）
   
5. UI再レンダリング
   CaloriesScreen.tsx が新しい calorieHistory を受け取る
   - サマリーカード更新
   - グラフ更新
   - カレンダー更新
```

---

## 7. API設計（将来実装）

### 7.1 RESTful API エンドポイント

#### 7.1.1 認証

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

#### 7.1.2 メニュープリセット

```
GET    /api/presets              # 全プリセット取得
GET    /api/presets/:id          # 単一プリセット取得
POST   /api/presets              # プリセット作成
PUT    /api/presets/:id          # プリセット更新
DELETE /api/presets/:id          # プリセット削除
```

**レスポンス例**:
```json
{
  "id": "preset_123",
  "name": "胸・肩の日",
  "exercises": [
    {
      "id": "ex_456",
      "name": "ベンチプレス",
      "weight": 60,
      "sets": 3,
      "restTime": 90,
      "trainingTime": 60,
      "enabled": true,
      "orderIndex": 0
    }
  ],
  "createdAt": "2025-12-31T10:00:00Z",
  "updatedAt": "2025-12-31T10:00:00Z"
}
```

#### 7.1.3 種目

```
POST   /api/presets/:presetId/exercises           # 種目追加
PUT    /api/exercises/:id                         # 種目更新
DELETE /api/exercises/:id                         # 種目削除
PUT    /api/presets/:presetId/exercises/reorder   # 種目順序変更
```

#### 7.1.4 身体データ

```
GET    /api/body-data?from=YYYY-MM-DD&to=YYYY-MM-DD  # 期間指定取得
GET    /api/body-data/:date                          # 特定日取得
POST   /api/body-data                                # データ追加
PUT    /api/body-data/:date                          # データ更新
DELETE /api/body-data/:date                          # データ削除
```

**レスポンス例**:
```json
{
  "date": "2025-12-31",
  "weight": 72.5,
  "bodyFat": 18.5,
  "muscleMass": 56.2,
  "bmi": 23.1,
  "waterContent": 58.5,
  "visceralFat": 8,
  "basalMetabolism": 1680,
  "createdAt": "2025-12-31T09:00:00Z",
  "updatedAt": "2025-12-31T09:00:00Z"
}
```

#### 7.1.5 カロリーデータ

```
GET    /api/calories?from=YYYY-MM-DD&to=YYYY-MM-DD  # 期間指定取得
GET    /api/calories/:date                          # 特定日取得
POST   /api/calories/:date/consumed                 # 摂取カロリー追加
POST   /api/calories/:date/burned                   # 消費カロリー追加
```

**レスポンス例**:
```json
{
  "date": "2025-12-31",
  "consumed": 2200,
  "burned": 450,
  "trainingSessions": [
    {
      "id": "session_789",
      "menuName": "胸・肩の日",
      "calories": 450,
      "time": 3600,
      "completedAt": "2025-12-31T18:00:00Z"
    }
  ],
  "createdAt": "2025-12-31T08:00:00Z",
  "updatedAt": "2025-12-31T18:00:00Z"
}
```

#### 7.1.6 トレーニングログ

```
GET    /api/training-logs?from=YYYY-MM-DD&to=YYYY-MM-DD  # 期間指定取得
GET    /api/training-logs/:id                            # 単一ログ取得
POST   /api/training-logs                                # ログ作成
PUT    /api/training-logs/:id                            # ログ更新
```

**レスポンス例**:
```json
{
  "id": "log_999",
  "presetId": "preset_123",
  "menuName": "胸・肩の日",
  "startedAt": "2025-12-31T17:00:00Z",
  "completedAt": "2025-12-31T18:00:00Z",
  "totalTime": 3600,
  "totalCalories": 450,
  "status": "completed",
  "exercises": [
    {
      "exerciseId": "ex_456",
      "name": "ベンチプレス",
      "weight": 60,
      "setsCompleted": 3,
      "totalTime": 1200,
      "calories": 150
    }
  ]
}
```

### 7.2 GraphQL API（代替案）

#### 7.2.1 スキーマ例

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  weight: Float
  menuPresets: [MenuPreset!]!
  bodyData: [BodyData!]!
  calorieData: [CalorieData!]!
  trainingLogs: [TrainingLog!]!
}

type MenuPreset {
  id: ID!
  name: String!
  exercises: [Exercise!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Exercise {
  id: ID!
  name: String!
  weight: Float!
  sets: Int!
  restTime: Int!
  trainingTime: Int!
  enabled: Boolean!
  memo: String
  youtubeUrl: String
  orderIndex: Int!
}

type BodyData {
  date: Date!
  weight: Float
  bodyFat: Float
  muscleMass: Float
  bmi: Float
  waterContent: Float
  visceralFat: Int
  basalMetabolism: Int
}

type CalorieData {
  date: Date!
  consumed: Int!
  burned: Int!
  trainingSessions: [TrainingSession!]!
}

type TrainingSession {
  id: ID!
  menuName: String!
  calories: Int!
  time: Int!
  completedAt: DateTime!
}

type Query {
  me: User
  menuPreset(id: ID!): MenuPreset
  bodyData(from: Date!, to: Date!): [BodyData!]!
  calorieData(from: Date!, to: Date!): [CalorieData!]!
  trainingLogs(from: Date!, to: Date!): [TrainingLog!]!
}

type Mutation {
  createMenuPreset(input: CreateMenuPresetInput!): MenuPreset!
  updateMenuPreset(id: ID!, input: UpdateMenuPresetInput!): MenuPreset!
  deleteMenuPreset(id: ID!): Boolean!
  
  addBodyData(date: Date!, input: BodyDataInput!): BodyData!
  updateBodyData(date: Date!, input: BodyDataInput!): BodyData!
  deleteBodyData(date: Date!): Boolean!
  
  addConsumedCalories(date: Date!, calories: Int!): CalorieData!
  addBurnedCalories(date: Date!, calories: Int!, activityName: String): CalorieData!
  
  createTrainingLog(input: CreateTrainingLogInput!): TrainingLog!
  completeTrainingLog(id: ID!, input: CompleteTrainingLogInput!): TrainingLog!
}
```

### 7.3 データ同期戦略

#### 7.3.1 オフライン対応

**ローカルファースト設計**:
1. すべてのデータをローカルDB（SQLite）に保存
2. オンライン時にバックエンドと同期
3. オフライン時もアプリは完全動作

**同期フロー**:
```
アプリ起動
    ↓
ローカルDBからデータ読み込み
    ↓ （即座に表示）
バックグラウンドで同期開始
    ↓
サーバーから最新データ取得
    ↓
ローカルDBと比較（タイムスタンプベース）
    ↓
競合解決（Last-Write-Wins or Manual）
    ↓
ローカルDB更新
    ↓
UIに反映
```

#### 7.3.2 競合解決

**戦略1: Last-Write-Wins**
- `updatedAt` タイムスタンプで判定
- 最後に更新された方を採用
- シンプルだが、データロスの可能性あり

**戦略2: Manual Resolution**
- 競合検知時にユーザーに選択させる
- より確実だが、UX が悪化

**推奨**: 身体データ・カロリーデータは Last-Write-Wins、メニュープリセットは Manual Resolution

#### 7.3.3 同期タイミング

- アプリ起動時
- アプリがフォアグラウンドに戻ったとき
- データ変更後（デバウンス: 5秒）
- 手動同期ボタン

---

## 8. パフォーマンス最適化

### 8.1 レンダリング最適化

#### 8.1.1 React.memo の活用

**最適化対象コンポーネント**:
```typescript
export const ExerciseItem = React.memo(({ exercise, onUpdate, onDelete }: ExerciseItemProps) => {
  // ...
});

export const BodyDataCard = React.memo(({ title, value, unit, ... }: BodyDataCardProps) => {
  // ...
});
```

**メリット**:
- Props が変わらない限り再レンダリングしない
- リスト表示時のパフォーマンス向上

#### 8.1.2 useCallback / useMemo の活用

```typescript
// App.tsx
const handleUpdateExercise = useCallback((id: string, updates: Partial<Exercise>) => {
  if (!selectedPreset) return;
  
  setMenuPresets(prev =>
    prev.map(preset =>
      preset.id === selectedPresetId
        ? {
            ...preset,
            exercises: preset.exercises.map(ex =>
              ex.id === id ? { ...ex, ...updates } : ex
            ),
          }
        : preset
    )
  );
}, [selectedPresetId, selectedPreset]);

// BodyDataScreen.tsx
const chartData = useMemo(() => {
  return bodyDataHistory
    .slice(0, 7)
    .reverse()
    .map(d => ({ value: d.weight || 0 }));
}, [bodyDataHistory]);
```

#### 8.1.3 仮想化（将来）

長いリストには `react-window` や `react-virtualized` を使用:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={bodyDataHistory.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <BodyDataCard data={bodyDataHistory[index]} />
    </div>
  )}
</FixedSizeList>
```

### 8.2 データロード最適化

#### 8.2.1 遅延ロード

```typescript
// モーダルコンポーネントを遅延ロード
const AddBodyDataModal = lazy(() => import('./AddBodyDataModal'));

<Suspense fallback={<LoadingSpinner />}>
  {showAddModal && <AddBodyDataModal ... />}
</Suspense>
```

#### 8.2.2 ページネーション

```typescript
// 将来実装
const [page, setPage] = useState(0);
const pageSize = 30;

const paginatedData = bodyDataHistory.slice(page * pageSize, (page + 1) * pageSize);
```

#### 8.2.3 キャッシング

```typescript
// React Query を使用（将来）
import { useQuery } from 'react-query';

const { data, isLoading } = useQuery(
  ['bodyData', from, to],
  () => fetchBodyData(from, to),
  {
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    cacheTime: 30 * 60 * 1000, // 30分間保持
  }
);
```

### 8.3 アニメーション最適化

#### 8.3.1 CSS Transform の使用

```css
/* パフォーマンスの良い方法 */
.button {
  transition: transform 0.2s;
}
.button:active {
  transform: scale(0.95);
}

/* 避けるべき方法 */
.button:active {
  width: 95%;
  height: 95%;
}
```

#### 8.3.2 will-change の活用

```css
.modal {
  will-change: opacity, transform;
}
```

### 8.4 メモリ管理

#### 8.4.1 タイマーのクリーンアップ

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    // ...
  }, 1000);

  return () => clearInterval(timer); // クリーンアップ
}, [dependencies]);
```

#### 8.4.2 イベントリスナーのクリーンアップ

```typescript
useEffect(() => {
  const handleResize = () => {
    // ...
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## 9. セキュリティ考慮事項（将来実装）

### 9.1 認証・認可

- JWT トークンベースの認証
- Refresh Token による自動更新
- Role-Based Access Control (RBAC)

### 9.2 データ暗号化

- 通信: HTTPS/TLS
- ローカルDB: SQLCipher（暗号化SQLite）
- 機密情報: Keychain (iOS) / Keystore (Android)

### 9.3 入力検証

- クライアント側: フォーム検証
- サーバー側: スキーマ検証（Joi, Yup など）
- SQLインジェクション対策: パラメータ化クエリ

---

## 10. テスト戦略

### 10.1 ユニットテスト

```typescript
// カロリー計算のテスト
describe('calculateCalories', () => {
  it('高強度（0.5以上）の場合、8.0 METs で計算', () => {
    const calories = calculateCalories(70, 8.0, 300);
    expect(calories).toBeCloseTo(46.67, 2);
  });
});
```

### 10.2 統合テスト

```typescript
// データフローのテスト
describe('Training Flow', () => {
  it('トレーニング完了後、カロリーが自動記録される', async () => {
    const { getByText } = render(<App />);
    
    // トレーニング開始
    fireEvent.click(getByText('トレーニング開始'));
    
    // 完了まで進める（mock）
    await waitFor(() => {
      expect(getByText('お疲れ様でした')).toBeInTheDocument();
    });
    
    // カロリーが記録されているか確認
    fireEvent.click(getByText('完了'));
    fireEvent.click(getByText('カロリー'));
    
    expect(getByText(/消費カロリー/)).toBeInTheDocument();
  });
});
```

### 10.3 E2Eテスト

```typescript
// Detox を使用（React Native）
describe('App E2E', () => {
  it('新しいプリセットを作成してトレーニングを実行できる', async () => {
    await element(by.text('新しいメニューを作成')).tap();
    await element(by.id('preset-name-input')).typeText('テストメニュー');
    // ... 種目追加
    await element(by.text('保存')).tap();
    await element(by.text('トレーニング開始')).tap();
    // ... トレーニング進行
    await expect(element(by.text('お疲れ様でした'))).toBeVisible();
  });
});
```

---

## 11. まとめ

このアプリは、以下の特徴を持つ筋トレ管理アプリです：

**データ管理**:
- メモリ上の状態管理（React Hooks）
- 将来的にローカルDB・クラウドDB連携

**機能**:
- プリセットベースのメニュー管理
- タイマー・自動進行のトレーニング実行
- METs法による消費カロリー計算
- 身体データの記録・履歴・グラフ表示
- カロリーの手動入力・自動記録・カレンダー表示

**データフロー**:
- App.tsx を中心とした状態管理
- Props Drilling によるデータ伝播
- Callback関数によるデータ更新

**将来拡張**:
- データベース連携（SQLite / Cloud DB）
- RESTful or GraphQL API
- オフライン対応・同期機能
- 高度な統計・レポート機能

このアプリは、シンプルな設計でありながら、拡張性を考慮した構造になっています。

---

**文書作成日**: 2025年12月31日  
**最終更新日**: 2025年12月31日  
**作成者**: AI Assistant  
**バージョン**: 1.0.0

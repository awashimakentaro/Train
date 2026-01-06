# 筋トレ管理アプリ (Train)

React Native (Expo) + Supabase で構築した自分専用のトレーニング管理アプリです。メニュー作成、身体データの記録、カロリー集計、タイマー計測を 1 つのモバイル UI にまとめ、トレーニング完了時には OpenAI API を使って消費カロリーを推定します。設計背景や機能仕様は `docs/` 配下に詳細を残しています。

## 主な機能
- **メニュータブ**: 種目をプリセット化し、セット数 / 休憩時間 / メモ / YouTube リンクを管理。順番の編集も可能。
- **身体データタブ**: 体重・体脂肪・身長などを日次で記録し、Trend Chart で推移を確認。履歴編集にも対応。
- **カロリータブ**: 摂取 / 消費の履歴を Supabase と同期し、トレーニング完了ログと紐付け。
- **タイマー画面**: Training / Rest を自動で切り替え、フェーズごとに効果音を再生。完了時に AI が消費カロリーを再計算。
- **AI 連携**: `lib/ai/calorieEstimationAgent.ts` から OpenAI Chat Completions API を呼び出し、身体データと種目内容を元に総消費量・内訳を推定。

より詳しい設計は `docs/features.md` と `docs/workflow.md` にまとめています。

## 技術スタック
- Expo SDK 54 / React Native / TypeScript / Expo Router
- UI: React Native 純正コンポーネント + LinearGradient, SVG など
- 状態管理: Zustand (`hooks/use*Store.ts`)
- Backend: Supabase (Auth + PostgREST + Storage)
- AI: OpenAI API

## フォルダ構成（一部）
```
app/                Expo Router の画面（tabs, modals など）
components/        画面分割された UI コンポーネント
hooks/             Zustand ストアや副作用フック
lib/               Supabase / AI / ユーティリティ
assets/sounds/     タイマー用サウンド
supabase/schema.sql  DB スキーマ定義
_docs/              設計メモ・セットアップ手順
```

## セットアップ
1. リポジトリを取得します。
   ```bash
   git clone <repo>
   cd Train
   npm install
   ```
2. 環境変数を設定します。
   ```bash
   cp .env.example .env
   # Supabase / OpenAI の値を実環境で上書き
   ```
3. Supabase を準備します。
   - ダッシュボードで新規プロジェクトを作成。
   - SQL Editor で `supabase/schema.sql` を貼り付けて実行（`docs/setup-supabase.md` に詳細あり）。
   - Authentication で Email or Anonymous を有効化し、`.env` の URL/Keys と一致させる。
4. Expo の開発サーバーを起動します。
   ```bash
   npx expo start --dev-client
   ```
   - iOS シミュレータ: `i` を押す / Android エミュレータ: `a` を押す
   - 実機 (Dev Client): `eas build --platform ios --profile development` などで作成した開発ビルドに接続

## スクリプト
| コマンド | 概要 |
| --- | --- |
| `npm run start` | Expo を通常モードで起動 |
| `npx expo start --dev-client` | Dev Client 向けに Metro を起動 |
| `npm run lint` | ESLint 実行 |
| `eas build --platform ios --profile development` | iOS 開発ビルドを生成（自分の端末用） |

## 環境変数
`.env` で管理し、Expo から参照する値には `EXPO_PUBLIC_` 接頭辞が必要です。
```
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb-...
SUPABASE_SERVICE_ROLE_KEY=（必要なら）
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=training-assets
```
OpenAI キーは現在クライアントで直接呼び出しています。公開アプリとして配布する場合はサーバー経由に差し替えてください。

## ビルド / 配布メモ
- **自分の端末のみ**: `eas build --platform ios --profile development` で `.ipa` を生成し、`eas device:install` でインストール。Apple Developer Program への登録と UDID 設定が必要です。
- **ストア不要で安定運用したい**: `--profile production` で Release ビルドを作成すると JS バンドル込みのスタンドアロンになります。
- Android も同様に `eas build --platform android --profile preview` で APK を作成可能。

## 開発ワークフロー
- `docs/workflow.md` にある Vibe Coding の手順に沿って、設計→実装→実機検証を小さく回します。
- 実装ルールや責務分割は `AGENTS.md` を最上位規約として確認してください。
- 新機能を追加する場合は `docs/features.md` でデータモデルと状態フローを先に整理しておくとスムーズです。

## 参考ドキュメント
| ファイル | 内容 |
| --- | --- |
| `docs/features.md` | アーキテクチャ／機能仕様の詳細 |
| `docs/setup-supabase.md` | Supabase の SQL & Auth 設定手順 |
| `docs/requirements/supabase.md` | 環境変数・RLS・ストレージ等の要件メモ |
| `docs/workflow.md` | バイブコーディング開発プロセスのメモ |

必要に応じて `docs/` を更新しながら、アプリの成長ログを残していきます。

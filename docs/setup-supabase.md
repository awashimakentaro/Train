# Supabase セットアップ手順

以下では、今回の筋トレ管理アプリを Supabase + メール認証で動かすための手順をまとめます。

## 1. 前提
- Supabase プロジェクトが作成済みであること
- ダッシュボードにアクセスできること
- `.env` に `EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_ANON_KEY` を設定済みであること

## 2. SQL スキーマの適用
Supabase ダッシュボード → **SQL Editor** → **New Query** で以下を実行します。

1. 既存のトリガー/関数を削除（すでに存在するとエラーになるため）
   ```sql
   drop trigger if exists trg_menu_presets_updated on public.menu_presets;
   drop trigger if exists trg_exercises_updated on public.exercises;
   drop trigger if exists trg_body_entries_updated on public.body_entries;
   drop trigger if exists trg_calorie_entries_updated on public.calorie_entries;
   drop function if exists public.touch_updated_at;
   ```
2. `supabase/schema.sql` の内容をすべてコピーして貼り付け、「Run」ボタンで実行
   - `menu_presets` / `exercises` / `body_entries` / `calorie_entries` / `training_sessions` / `profiles` が作成されます
   - RLS ポリシーも併せて作成されるので、これ以降は Auth ユーザーごとにデータが分離されます

## 3. Authentication の設定
ダッシュボード → **Authentication** → **Providers** で以下を ON にします。
- Email (メール + パスワード)
- ※Magic Link など他方式を使いたい場合は追加で有効化

SMTP 設定が未入力の場合は Supabase のデフォルト送信が使われます（Free プランでは 1000 通/月が上限）。

## 4. ローカルの環境変数
`.env` に以下を設定済みか確認し、Expo を再起動します。
```
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...(サーバー用途で必要なら)
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=training-assets
```
`npm start -c` でキャッシュをクリアして Expo を起動すると、最新の env が反映されます。

## 5. アプリ側の流れ
1. 起動すると AuthGate が表示されるので、メール/パスワードでサインアップ
   - 初回は確認メールが送信されるため、メール内リンクをクリックして認証
2. サインインすると Supabase の各テーブルからデータを同期
3. UI で行う全操作（メニュー追加、身体データ入力、カロリー記録、トレーニング完了など）が即 Supabase に保存される
4. ハンバーガー → メニュー画面右上の「ログアウト」で `supabase.auth.signOut()` が実行される

## 6. よくあるエラー
| 症状 | 原因 | 対応 |
| --- | --- | --- |
| `touch_updated_at already exists` | 同名関数を再作成しようとした | 本手順の 2-1 で `drop function` してから実行 |
| `Failed to sign in` | メール/パスワードが未登録、またはメール認証が未完了 | Auth > Users でステータス確認。未認証ならメール認証を再送 |
| `Row level security` エラー | RLS で `auth.uid()` と `user_id` が一致していない | auth でログインしているか確認、`.env` の URL/Key が正しいか確認 |

## 7. 追加メモ
- Supabase CLI を使う場合は `supabase db push --file supabase/schema.sql` で同じスキーマを適用できます
- `training_sessions` テーブルはメタ情報のみを保存しています。詳細ログを取りたい場合は `exercise_logs` テーブルを追加し、hooks/useTrainingSession.ts 内で書き込みます
- ストレージ (storage bucket) を使う場合は `training-assets` バケットを作成し、RLS を設定してください

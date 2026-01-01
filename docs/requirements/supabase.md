# Supabase 要件メモ (docs/requirements/supabase.md)

## 1. 環境変数
- `EXPO_PUBLIC_SUPABASE_URL`: プロジェクト URL。
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Anonymous Key。
- `SUPABASE_SERVICE_ROLE_KEY`: サーバーサイドで管理用に利用。クライアントでは使用しない。
- `EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET`: 画像や動画をアップロードする場合に利用予定。

`cp .env.example .env` ののち、上記値を実際のプロジェクト設定で埋める。Expo では `EXPO_PUBLIC_` 接頭辞付きの変数のみクライアントバンドルへ露出する点に注意する。

## 2. テーブル構成
`supabase/schema.sql` に全 DDL を定義した。主要テーブル:

| テーブル | 用途 |
| --- | --- |
| `profiles` | Auth ユーザーのメタ情報。匿名ログイン時にも自動生成される。|
| `menu_presets` | メニューのヘッダー。`user_id` による RLS で保護。|
| `exercises` | プリセットに紐づく種目。`order_index` で並び順を保持。|
| `body_entries` | 日次の身体データ (1日1行)。|
| `calorie_entries` | 摂取/消費のログ。UI は 1 レコード = 1 エントリで表示。|
| `training_sessions` | タイマー完了時に記録するメタ情報 (カロリー、所要時間など)。|

全テーブルで Row Level Security を有効化し、`auth.uid()` に一致する `user_id` の行のみ CRUD できるようにしている。

## 3. 認証方針
- アプリ起動時に `supabase.auth.signInAnonymously()` を呼び出し、そのユーザー ID を全ストアで共有。
- 匿名ユーザーで十分にアプリを試せるように設計しているため、メール/パスワード認証は未実装。
- 別端末に同期したい場合は、supabase ダッシュボードで匿名ユーザーを固定する or 近日実装予定のメール認証に切り替える。

## 4. シード / マイグレーション
1. Supabase CLI を使用する場合は `supabase db push --file supabase/schema.sql` を実行。
2. ダッシュボードから貼り付ける場合は、`schema.sql` 全体を SQL Editor へ投入するだけで OK。
3. Auth の匿名ログインを有効化 (`Authentication > Providers > Anonymous`) する。

## 5. フロントエンドとの結線
- `lib/supabaseClient.ts` が `@supabase/supabase-js` v2 を初期化。
- `providers/SupabaseProvider.tsx` が匿名サインインと session 監視を行い、`useSupabase()` で参照可能。
- `hooks/useSupabaseBootstrap.ts` が Zustand ストアを初期化するため、UI は Supabase 同期完了まで待機する構造になっている。
- 各ストア (`useMenuPresetStore` / `useBodyDataStore` / `useCalorieStore`) は Supabase CRUD を内包し、UI 側は `await` するだけで永続化できる。

## 6. 今後の拡張メモ
- メニューの共有機能を実装する際は `menu_presets` に `is_public` 等のカラムを追加し、別ポリシーを定義する。
- `training_sessions` に詳細な exercise ログを持たせたい場合は `exercise_logs` テーブルを別途追加する。
- Auth をメールログインへ切り替える場合は `SupabaseProvider` 内で `signInWithPassword` などを呼び出す。

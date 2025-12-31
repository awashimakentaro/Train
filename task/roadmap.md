<!--
task/roadmap.md

【責務】
- 筋トレ管理アプリv1のタスク分解と進捗共有の単一情報源を保持する。
- マイルストーンとチェックボックス形式で作業優先度を示す。
- ブロッカーや運用ルールを記録し、次の作業者への引き継ぎを容易にする。
【使用箇所】
- 開発開始前の計画レビュー
- デイリースタンドアップ/ふりかえり
- リリース前確認
【やらないこと】
- 詳細仕様や画面デザインそのものの記述
- 実装ステップの逐語録
【他ファイルとの関係】
- agents.md で定義された規約を前提とし、docs/ 配下の仕様書やfiguma/ のUI参照にリンクする
-->
# 筋トレ管理アプリ v1 タスクボード

更新日: 2026-01-01

## 使い方
- 各行は `マイルストーンID-番号` で管理する。チェックボックス `[ ] / [x]` を更新する際は同じIDを維持する。
- 追加タスクは該当マイルストーン配下に追記し、必要なら新規マイルストーン (Mx) を増やす。
- 状況メモやブロッカーは下部「ブロッカー・メモ」に箇条書きで残す。
- 実装完了後は関連ドキュメント（例: docs/requirements/*.md）を更新し、進捗の証跡をリンクする。

## 進捗スナップショット
- 完了 5 / 52 （9.6%）
- 完了済み: 規約ドキュメント (M0-1)、ワークフロー叩き台 (M0-2)、figuma アセット (M0-3)、Expo ひな形 (M0-4)、本タスクボード (M0-5)。
- 次に着手すべき優先タスク: M0-6（コード全体の規約ヘッダ）、M1-1（Figmaベースの機能サマリ）、M2-1（デザイントークン設計）。

## ブロッカー・メモ
- チャート描画ライブラリ（Victory, react-native-svg-charts など）をどれに寄せるか未決定。M2-6で比較資料を作り意思決定が必要。
- Supabase プロジェクトのURL / anon key 未払い出し。M7-1で人間が作成するまで以降のデータ永続化がブロックされる。
- figuma は Web 実装のため間接的な参照のみ許可。px 指定をそのまま移植しないこと（agents.md参照）。

## マイルストーン別タスク

### M0. プロジェクト基盤・ガバナンス
- [x] (M0-1) agents.md v1 を作成し、最上位規約として配置する。
- [x] (M0-2) docs/workflow.md に開発ワークフローのメモを置く。
- [x] (M0-3) figuma/ 配下に Figma 参照用コードをエクスポートする。
- [x] (M0-4) Expo Router ベースの初期アプリを create-expo-app で生成する。
- [x] (M0-5) 本ファイル（task/roadmap.md）でタスクボード v1 を作成する。
- [ ] (M0-6) 全ファイルへ規約ヘッダ + 関数コメントを付与し、違反を残さない（app/, components/, hooks/, scripts/ 等）。
- [ ] (M0-7) agents.md 順守を自動検出する ESLint ルール or スクリプトを追加し CI に組み込む。

### M1. 要件・情報整理
- [ ] (M1-1) Figma (figuma/src) を読み解き、画面ごとの目的と主要コンポーネントを docs/requirements/screens.md にまとめる。
- [ ] (M1-2) ユーザーフロー（例: 身体データ入力 → トレーニング開始 → 結果 → カロリー反映）をシーケンス図で docs/requirements/flows.md に記述。
- [ ] (M1-3) ドメインモデル（BodyData, Exercise, MenuPreset, TrainingSession, CalorieEntry, UserProfile）を ER 図付きで docs/requirements/data-model.md に記す。
- [ ] (M1-4) オフライン時やデータ欠損時の振る舞い・エラーメッセージ方針を docs/requirements/states.md へ整理。
- [ ] (M1-5) Supabase のテーブル・RPC 設計と API 契約 (入力/出力/制約) を docs/requirements/supabase.md に定義。

### M2. UX / 技術基盤
- [ ] (M2-1) フォント・カラー・余白スケール等のデザイントークンを constants/design-tokens.ts へ定義。
- [ ] (M2-2) app/_layout.tsx を差し替え、SafeArea + 背景グラデーション + ステータスバー制御を行うアプリシェルを実装。
- [ ] (M2-3) figuma の TabBar を再現したカスタムタブコンポーネントを app/(tabs)/_layout.tsx + components/ に実装。
- [ ] (M2-4) 共通 UI コンポーネント（カード、モーダル、チャートラッパー）を components/ui/ に整理し、SRP を維持。
- [ ] (M2-5) Zustand などの軽量状態管理を hooks/ へ導入し、各ドメイン（身体データ/メニュー/カロリー）で共有。
- [ ] (M2-6) チャート用ライブラリと描画戦略の PoC を experiments/ 配下で比較し、選定結果を docs/decisions/チャート選定.md に残す。

### M3. 身体データ管理
- [ ] (M3-1) BodyData ストア（追加・更新・削除・最新値/トレンド selector）を hooks/useBodyDataStore.ts に実装。
- [ ] (M3-2) figuma のヘッダー/カード配置を再現した BodyDataScreen を app/(tabs)/body.tsx（仮）に構築。
- [ ] (M3-3) スパークライン入り BodyDataCard コンポーネントを components/body-data/Card.tsx に作成（チャートラッパー利用）。
- [ ] (M3-4) AddBodyDataModal を React Native 用に再実装し、数値バリデーションと既存データの当日上書きを実装。
- [ ] (M3-5) BodyDataHistoryModal で日付毎の一覧・編集・削除・空状態を網羅。
- [ ] (M3-6) 初期データなしの場合のプレースホルダ表示とローディング骨組みを用意。

### M4. メニュー / プリセット管理
- [ ] (M4-1) Exercise/MenuPreset ストアを hooks/useMenuPresetStore.ts に実装（作成・更新・削除・選択）。
- [ ] (M4-2) プリセット選択カード UI と削除確認ダイアログを figuma に合わせて実装。
- [ ] (M4-3) CreatePresetModal（名称 + 初期種目入力 + バリデーション）を components/menu/CreatePresetModal.tsx に構築。
- [ ] (M4-4) ExerciseItem コンポーネントを React Native で再現し、重量/セット/休憩時間編集や有効/無効切り替えを実装。
- [ ] (M4-5) インラインの種目追加フォーム（新規 exercise 作成）をメニュー画面下部に配置。
- [ ] (M4-6) メモ・YouTube URL・並び替え等の拡張フィールドを保持する UI/ストアを用意。

### M5. トレーニング進行・結果
- [ ] (M5-1) TrainingSession 画面のタイマー状態マシン（training/rest/skip/pause）を hooks/useTrainingSession.ts で実装。
- [ ] (M5-2) 円形プログレス・制御ボタン・セット表示を figuma のデザインで再現し、Haptics を連動。
- [ ] (M5-3) バックグラウンド遷移時のタイマー持続とフェイルセーフ（AppState 監視）を実装。
- [ ] (M5-4) TrainingResult 画面を React Native で再構築し、完了種目一覧/総カロリー/時間表示を含める。
- [ ] (M5-5) セッション終了時に calorieHistory と trainingSessions ログへ書き込み、Calories タブへ反映。

### M6. カロリー管理・分析
- [ ] (M6-1) CalorieHistory ストアを hooks/useCalorieStore.ts に作成（摂取/消費/トレーニング紐付け）。
- [ ] (M6-2) 今日のサマリーカード（摂取/消費/差分）と CTA を figuma の配置で実装。
- [ ] (M6-3) 摂取/消費入力用モーダルを 2 種類実装し、数値 + 活動名入力 + バリデーションを行う。
- [ ] (M6-4) 過去7日チャート（ライン + 凡例）をチャートラッパー経由で描画。
- [ ] (M6-5) カレンダービューで月次の摂取/消費ハイライトとタップ時の詳細表示を再現。
- [ ] (M6-6) TrainingSession から渡される消費カロリーをまとめ、日毎の trainingSessions リスト表示を行う。

### M7. Supabase 連携・データ永続化
- [ ] (M7-1) Supabase プロジェクトの作成と `.env` 取り込み、lib/supabaseClient.ts を用意。
- [ ] (M7-2) メールリンク or OTP ベースの Auth 画面を実装し、セッション管理を hooks/useAuthStore.ts で行う。
- [ ] (M7-3) BodyData テーブル CRUD を API 経由で実装し、ローカルストアと同期。
- [ ] (M7-4) MenuPreset/Exercise テーブル CRUD + 並び順同期を実装。
- [ ] (M7-5) TrainingSessions / CalorieEntries テーブルへ結果を書き込み、Calories タブで履歴を取得。
- [ ] (M7-6) オフラインキャッシュ（AsyncStorage or MMKV）と再送キューを実装し、ネットワーク切断時も入力できるようにする。

### M8. QA・リリース準備
- [ ] (M8-1) 主要ストアとユーティリティのユニットテストを追加（vitest/Jest など）。
- [ ] (M8-2) Detox などによる主要フロー（身体データ入力 → トレーニング完了 → カロリー反映）の E2E テストを作成。
- [ ] (M8-3) 実機でのパフォーマンス/発熱/バッテリー確認をチェックリスト化。
- [ ] (M8-4) Expo EAS ビルド手順・リリースノート雛形を docs/release/eas.md に作成。
- [ ] (M8-5) 例外ログ/Sentry 等の監視を導入し、重大イベントを Supabase Functions へ送る仕組みを整備。

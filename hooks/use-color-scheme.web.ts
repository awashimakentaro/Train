/**
 * hooks/use-color-scheme.web.ts
 *
 * 【責務】
 * Web 環境で useColorScheme を定義し、React Native 同等の API を提供する。
 *
 * 【使用箇所】
 * - カラースキーム判定を行うコンポーネント
 *
 * 【やらないこと】
 * - ブラウザの prefers-color-scheme 取得（現状は light 固定）
 *
 * 【他ファイルとの関係】
 * - hooks/use-color-scheme.ts の Web 版として解決される。
 */

/**
 * useColorScheme (web)
 *
 * 【処理概要】
 * Expo Router の Web 環境で常に 'light' を返し、API 互換を維持する。
 *
 * 【呼び出し元】
 * app/_layout.tsx など。
 *
 * 【入力 / 出力】
 * なし / 'light'。
 *
 * 【副作用】
 * なし。
 */
export function useColorScheme() {
  return 'light';
}

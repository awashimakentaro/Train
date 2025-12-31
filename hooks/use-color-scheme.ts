/**
 * hooks/use-color-scheme.ts
 *
 * 【責務】
 * React Native の useColorScheme をラップし、null 発生時に 'light' を返す。
 *
 * 【使用箇所】
 * - app/_layout.tsx などのテーマ分岐
 *
 * 【やらないこと】
 * - 永続的なテーマ設定
 *
 * 【他ファイルとの関係】
 * - constants/design-tokens.ts を利用する各コンポーネントが参照
 */

import { useColorScheme as rnUseColorScheme } from 'react-native';

/**
 * useColorScheme
 *
 * 【処理概要】
 * ネイティブのカラースキームを取得し、null 時は 'light' をフォールバックする。
 *
 * 【呼び出し元】
 * レイアウトやタブバー。
 *
 * 【入力 / 出力】
 * なし / 'light' | 'dark'。
 *
 * 【副作用】
 * なし。
 */
export function useColorScheme() {
  return rnUseColorScheme() ?? 'light';
}

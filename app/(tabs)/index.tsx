/**
 * app/(tabs)/index.tsx
 *
 * 【責務】
 * Body タブ画面を構築し、身体データのカード一覧・入力モーダル・履歴モーダルを束ねる。
 *
 * 【使用箇所】
 * - app/(tabs)/_layout.tsx からタブとして表示
 *
 * 【やらないこと】
 * - ストア定義（hooks/useBodyDataStore.ts が担当）
 *
 * 【他ファイルとの関係】
 * - components/body-data/ 配下の UI コンポーネントを利用
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BodyDataCard } from '@/components/body-data/BodyDataCard';
import { AddBodyDataModal, BodyDataFormPayload } from '@/components/body-data/AddBodyDataModal';
import { BodyDataHistoryModal } from '@/components/body-data/BodyDataHistoryModal';
import { tokens } from '@/constants/design-tokens';
import { BodyDataField, useBodyDataStore } from '@/hooks/useBodyDataStore';

interface CardMeta {
  field: BodyDataField;
  title: string;
  unit: string;
  accentColor: string;
}

const CARD_CONFIG: CardMeta[] = [
  { field: 'weight', title: '体重', unit: 'kg', accentColor: tokens.palette.accentPurple },
  { field: 'bodyFat', title: '体脂肪率', unit: '%', accentColor: tokens.palette.accentPink },
  { field: 'muscleMass', title: '筋肉量', unit: 'kg', accentColor: tokens.palette.accentBlue },
  { field: 'bmi', title: 'BMI', unit: '', accentColor: tokens.palette.accentOrange },
  { field: 'waterContent', title: '水分量', unit: '%', accentColor: tokens.palette.accentGreen },
  { field: 'visceralFat', title: '内臓脂肪', unit: '', accentColor: tokens.palette.accentRed },
];

/**
 * BodyScreen
 *
 * 【処理概要】
 * ストアから履歴とトレンド値を取得し、カード/モーダルを組み合わせて表示する。
 *
 * 【呼び出し元】
 * Expo Router タブ。
 *
 * 【入力 / 出力】
 * なし / JSX.Element。
 *
 * 【副作用】
 * ストア操作（addEntry / updateEntry / removeEntry）。
 */
export default function BodyScreen() {
  const { history, latest, addEntry, updateEntry, removeEntry, getTrend, getSeries } = useBodyDataStore();
  const latestData = latest();
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [historyField, setHistoryField] = useState<BodyDataField | null>(null);
  const insets = useSafeAreaInsets();

  const cards = useMemo(() => CARD_CONFIG, []);

  /**
   * handleSubmit
   *
   * 【処理概要】
   * モーダルから受け取った値で addEntry を呼び出す。
   *
   * 【呼び出し元】
   * AddBodyDataModal。
   *
   * 【入力 / 出力】
   * payload / なし。
   *
   * 【副作用】
   * ストア状態の更新。
   */
  const handleSubmit = (payload: BodyDataFormPayload) => {
    addEntry(payload);
    setAddModalVisible(false);
  };

  /**
   * handleHistoryUpdate
   *
   * 【処理概要】
   * 履歴モーダルからの編集内容を該当レコードへ反映する。
   *
   * 【呼び出し元】
   * BodyDataHistoryModal。
   *
   * 【入力 / 出力】
   * date, value / なし。
   *
   * 【副作用】
   * updateEntry を実行。
   */
  const handleHistoryUpdate = (date: string, value: number) => {
    if (!historyField) return;
    updateEntry(date, { [historyField]: value } as Partial<Record<BodyDataField, number>>);
  };

  /**
   * handleHistoryDelete
   *
   * 【処理概要】
   * 指定日付のレコードを削除する。
   *
   * 【呼び出し元】
   * BodyDataHistoryModal。
   *
   * 【入力 / 出力】
   * date / なし。
   *
   * 【副作用】
   * removeEntry を実行。
   */
  const handleHistoryDelete = (date: string) => {
    removeEntry(date);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + tokens.spacing.md }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>記録を習慣化しよう</Text>
            <Text style={styles.headerTitle}>身体データ</Text>
          </View>
          <Pressable
            onPress={() => setAddModalVisible(true)}
            style={styles.addButton}
            accessibilityRole="button">
            <Text style={styles.addText}>＋ データ入力</Text>
          </Pressable>
        </View>
        <View style={styles.cardList}>
          {cards.map(card => (
            <BodyDataCard
              key={card.field}
              title={card.title}
              value={latestData ? latestData[card.field] : undefined}
              unit={card.unit}
              trend={getTrend(card.field)}
              series={getSeries(card.field)}
              accentColor={card.accentColor}
              onHistoryPress={() => setHistoryField(card.field)}
            />
          ))}
        </View>
      </ScrollView>
      <AddBodyDataModal
        visible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleSubmit}
      />
      {historyField ? (
        <BodyDataHistoryModal
          visible={Boolean(historyField)}
          field={historyField}
          history={history}
          onClose={() => setHistoryField(null)}
          onUpdate={handleHistoryUpdate}
          onDelete={handleHistoryDelete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.mega,
  },
  header: {
    backgroundColor: tokens.palette.backgroundElevated,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  headerLabel: {
    color: tokens.palette.textTertiary,
    fontSize: tokens.typography.caption,
    marginBottom: tokens.spacing.xs,
  },
  headerTitle: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.title,
    fontWeight: tokens.typography.weightBold,
  },
  addButton: {
    backgroundColor: tokens.palette.accentPurple,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.full,
  },
  addText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
  cardList: {
    marginTop: tokens.spacing.lg,
  },
});

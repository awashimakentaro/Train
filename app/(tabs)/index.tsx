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
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { BodyDataCard } from '@/components/body-data/BodyDataCard';
import { BodyTrendChart } from '@/components/body-data/BodyTrendChart';
import { AddBodyDataModal, BodyDataFormPayload } from '@/components/body-data/AddBodyDataModal';
import { BodyDataHistoryModal } from '@/components/body-data/BodyDataHistoryModal';
import { tokens } from '@/constants/design-tokens';
import { BodyDataField, BodyDataRecord, useBodyDataStore } from '@/hooks/useBodyDataStore';

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
  const trendConfigs = useMemo(
    () => [
      { key: 'weight', title: '体重の推移', unit: 'kg', color: tokens.palette.accentPurple },
      { key: 'bodyFat', title: '体脂肪率の推移', unit: '%', color: tokens.palette.accentPink },
      { key: 'muscleMass', title: '筋肉量の推移', unit: 'kg', color: tokens.palette.accentBlue },
    ] as const,
    [],
  );
  const trendSeries = useMemo(
    () =>
      trendConfigs.map(config => ({
        ...config,
        data: history
          .slice()
          .reverse()
          .map(record => ({ dateLabel: record.date.slice(5), value: record[config.key as keyof BodyDataRecord] as number }))
          .slice(-14),
      })),
    [history, trendConfigs],
  );
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
  const handleSubmit = async (payload: BodyDataFormPayload) => {
    try {
      await addEntry(payload);
      setAddModalVisible(false);
    } catch (error) {
      Alert.alert('登録に失敗しました', error instanceof Error ? error.message : '不明なエラー');
    }
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
  const handleHistoryUpdate = async (date: string, value: number) => {
    if (!historyField) return;
    try {
      await updateEntry(date, { [historyField]: value } as Partial<Record<BodyDataField, number>>);
    } catch (error) {
      Alert.alert('更新に失敗しました', error instanceof Error ? error.message : '不明なエラー');
    }
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
  const handleHistoryDelete = async (date: string) => {
    try {
      await removeEntry(date);
    } catch (error) {
      Alert.alert('削除に失敗しました', error instanceof Error ? error.message : '不明なエラー');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + tokens.spacing.md }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#3b82f6', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Feather name="activity" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.heroEyebrow}>身体データ</Text>
              <Text style={styles.heroTitle}>あなたの成長を記録</Text>
              <Text style={styles.heroSubtitle}>毎日の小さな変化を見逃さない</Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionLabel}>データ一覧</Text>
            <Text style={styles.sectionHint}>最新の身体データカード</Text>
          </View>
          <Pressable
            onPress={() => setAddModalVisible(true)}
            style={styles.sectionButton}
            accessibilityRole="button">
            <Feather name="plus" size={18} color="#7c3aed" />
            <Text style={styles.sectionButtonText}>データ入力</Text>
          </Pressable>
        </View>
        <View style={styles.trendSection}>
          {trendSeries.map(trend => (
            <BodyTrendChart key={trend.key} title={trend.title} unit={trend.unit} color={trend.color} data={trend.data} />
          ))}
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
    backgroundColor: '#fdf4ff',
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.mega,
  },
  heroCard: {
    borderRadius: 32,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    shadowColor: '#1e1b4b',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: tokens.typography.caption,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: tokens.typography.weightSemiBold,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionLabel: {
    color: '#6d28d9',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  sectionHint: {
    color: '#a78bfa',
    fontSize: tokens.typography.caption,
    marginTop: 2,
  },
  sectionButton: {
    backgroundColor: '#fff',
    borderRadius: tokens.radii.full,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionButtonText: {
    color: '#7c3aed',
    fontWeight: tokens.typography.weightSemiBold,
  },
  cardList: {
    marginTop: tokens.spacing.lg,
  },
  trendSection: {
    marginTop: tokens.spacing.md,
  },
});

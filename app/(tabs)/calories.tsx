/**
 * app/(tabs)/calories.tsx
 *
 * 【責務】
 * カロリータブのサマリー・チャート・履歴・入力モーダルを統合して表示する。
 *
 * 【使用箇所】
 * - Expo Router のタブ
 *
 * 【やらないこと】
 * - ストア定義
 *
 * 【他ファイルとの関係】
 * - hooks/useCalorieStore.ts から状態を取得
 * - components/charts/WeeklyLineChart.tsx で週次チャートを描画
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CalorieEntryModal } from '@/components/calories/CalorieEntryModal';
import { WeeklyLineChart } from '@/components/charts/WeeklyLineChart';
import { tokens } from '@/constants/design-tokens';
import { CalorieEntryType, useCalorieStore } from '@/hooks/useCalorieStore';

/**
 * CaloriesScreen
 *
 * 【処理概要】
 * 今日のサマリー/チャート/履歴と入力モーダルをまとめて描画する。
 *
 * 【呼び出し元】
 * Expo Router。
 *
 * 【入力 / 出力】
 * なし / JSX.Element。
 *
 * 【副作用】
 * ストアアクションを呼び出す。
 */
export default function CaloriesScreen() {
  const { entries, addEntry, removeEntry, getTodaySummary, getDailySeries } = useCalorieStore();
  const [modalType, setModalType] = useState<CalorieEntryType | null>(null);
  const todaySummary = getTodaySummary();
  const weeklyData = getDailySeries(7);
  const today = new Date().toISOString().slice(0, 10);

  /**
   * handleSubmit
   *
   * 【処理概要】
   * モーダル入力を受け取り addEntry を実行、モーダルを閉じる。
   *
   * 【呼び出し元】
   * CalorieEntryModal。
   *
   * 【入力 / 出力】
   * payload / なし。
   *
   * 【副作用】
   * ストア更新。
   */
  const handleSubmit = (payload: { amount: number; label: string }) => {
    if (!modalType) return;
    addEntry({
      ...payload,
      type: modalType,
      date: today,
      category: modalType === 'intake' ? 'meal' : 'activity',
    });
    setModalType(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>摂取</Text>
            <Text style={styles.summaryValue}>{todaySummary.intake} kcal</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>消費</Text>
            <Text style={styles.summaryValue}>{todaySummary.burn} kcal</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>差分</Text>
            <Text style={styles.summaryValue}>{todaySummary.delta} kcal</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, styles.intakeButton]} onPress={() => setModalType('intake')}>
            <Text style={styles.actionText}>摂取を追加</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.burnButton]} onPress={() => setModalType('burn')}>
            <Text style={styles.actionText}>消費を追加</Text>
          </Pressable>
        </View>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>過去7日</Text>
          <WeeklyLineChart data={weeklyData} />
        </View>
        <View style={styles.listCard}>
          <Text style={styles.chartTitle}>履歴</Text>
          {entries.slice(0, 12).map(entry => (
            <View key={entry.id} style={styles.entryRow}>
              <View>
                <Text style={styles.entryLabel}>{entry.label}</Text>
                <Text style={styles.entryMeta}>{entry.date}</Text>
              </View>
              <View style={styles.entryActions}>
                <Text style={entry.type === 'intake' ? styles.intakeValue : styles.burnValue}>
                  {entry.type === 'intake' ? '+' : '-'}{entry.amount} kcal
                </Text>
                <Pressable onPress={() => removeEntry(entry.id)}>
                  <Text style={styles.deleteText}>削除</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      {modalType ? (
        <CalorieEntryModal
          visible={Boolean(modalType)}
          type={modalType}
          onClose={() => setModalType(null)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.mega,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: tokens.palette.backgroundCard,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  summaryLabel: {
    color: tokens.palette.textSecondary,
  },
  summaryValue: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightBold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.full,
    alignItems: 'center',
  },
  intakeButton: {
    backgroundColor: tokens.palette.accentBlue,
  },
  burnButton: {
    backgroundColor: tokens.palette.accentOrange,
  },
  actionText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
  chartCard: {
    backgroundColor: tokens.palette.backgroundElevated,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    marginBottom: tokens.spacing.lg,
  },
  chartTitle: {
    color: tokens.palette.textPrimary,
    fontWeight: tokens.typography.weightSemiBold,
    marginBottom: tokens.spacing.sm,
  },
  listCard: {
    backgroundColor: tokens.palette.backgroundCard,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.palette.borderMuted,
    paddingVertical: tokens.spacing.sm,
  },
  entryLabel: {
    color: tokens.palette.textPrimary,
  },
  entryMeta: {
    color: tokens.palette.textTertiary,
    fontSize: tokens.typography.caption,
  },
  entryActions: {
    alignItems: 'flex-end',
  },
  intakeValue: {
    color: tokens.palette.accentBlue,
    fontWeight: tokens.typography.weightMedium,
  },
  burnValue: {
    color: tokens.palette.accentOrange,
    fontWeight: tokens.typography.weightMedium,
  },
  deleteText: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.caption,
  },
});

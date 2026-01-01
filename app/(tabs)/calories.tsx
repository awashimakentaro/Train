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

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

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
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const todaySummary = getTodaySummary();
  const weeklyData = getDailySeries(7);
  const insets = useSafeAreaInsets();
  const calendarMatrix = useMemo(() => buildMonthMatrix(viewDate), [viewDate]);
  const selectedEntries = useMemo(
    () => entries.filter(entry => entry.date === selectedDate),
    [entries, selectedDate],
  );
  const todayTrainingEntries = useMemo(
    () => entries.filter(entry => entry.date === todayIso && entry.type === 'burn'),
    [entries, todayIso],
  );

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
  const handleSubmit = (payload: { amount: number; label: string; durationMinutes?: number }) => {
    if (!modalType) return;
    addEntry({
      ...payload,
      type: modalType,
      date: todayIso,
      category: modalType === 'intake' ? 'meal' : 'activity',
    });
    setModalType(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + tokens.spacing.md }] }>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#f97316', '#ec4899']} style={styles.heroCard}>
          <View>
            <Text style={styles.heroTitle}>カロリー管理</Text>
            <Text style={styles.heroDate}>{formatDateLabel(todayIso)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>今日の摂取・消費</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryBox, styles.intakeBox]}>
              <Text style={styles.summaryLabel}>摂取カロリー</Text>
              <Text style={styles.summaryValueGreen}>{todaySummary.intake}</Text>
              <Text style={styles.summaryUnit}>kcal</Text>
            </View>
            <View style={[styles.summaryBox, styles.burnBox]}>
              <Text style={styles.summaryLabel}>消費カロリー</Text>
              <Text style={styles.summaryValueOrange}>{todaySummary.burn}</Text>
              <Text style={styles.summaryUnit}>kcal</Text>
            </View>
          </View>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>カロリー収支</Text>
            <Text style={styles.balanceValue}>{todaySummary.delta} kcal</Text>
          </View>
          <View style={styles.ctaRow}>
            <Pressable style={[styles.ctaButton, styles.ctaIntake]} onPress={() => setModalType('intake')}>
              <Text style={styles.ctaText}>＋ 摂取を記録</Text>
            </Pressable>
            <Pressable style={[styles.ctaButton, styles.ctaBurn]} onPress={() => setModalType('burn')}>
              <Text style={styles.ctaText}>🔥 消費を記録</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>7日間の推移</Text>
          <WeeklyLineChart data={weeklyData} />
        </View>

        <View style={styles.trainingCard}>
          <Text style={styles.sectionTitle}>今日のトレーニング</Text>
          {todayTrainingEntries.length === 0 ? (
            <Text style={styles.emptyText}>まだ記録がありません</Text>
          ) : (
            todayTrainingEntries.map(entry => (
              <View key={entry.id} style={styles.trainingRow}>
                <View>
                  <Text style={styles.trainingValue}>{entry.amount} kcal</Text>
                  <Text style={styles.trainingLabel}>{entry.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {entry.durationMinutes ? (
                    <Text style={styles.trainingDuration}>{entry.durationMinutes} 分</Text>
                  ) : null}
                  <Pressable onPress={() => removeEntry(entry.id)}>
                    <Text style={styles.deleteText}>削除</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>カレンダー</Text>
            <View style={styles.monthNavigation}>
              <Pressable onPress={() => setViewDate(moveMonth(viewDate, -1))}>
                <Feather name="chevron-left" size={20} color="#1f2937" />
              </Pressable>
              <Text style={styles.monthLabel}>{formatMonthLabel(viewDate)}</Text>
              <Pressable onPress={() => setViewDate(moveMonth(viewDate, 1))}>
                <Feather name="chevron-right" size={20} color="#1f2937" />
              </Pressable>
            </View>
          </View>
          <View style={styles.weekHeader}>
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <Text key={day} style={styles.weekLabel}>{day}</Text>
            ))}
          </View>
          {calendarMatrix.map((week, index) => (
            <View key={`week-${index}`} style={styles.weekRow}>
              {week.map(dateCell => {
                const isActive = selectedDate === dateCell.iso;
                const hasData = entries.some(entry => entry.date === dateCell.iso);
                return (
                  <Pressable
                    key={dateCell.iso}
                    disabled={!dateCell.inCurrentMonth}
                    onPress={() => setSelectedDate(dateCell.iso)}
                    style={[
                      styles.calendarCell,
                      !dateCell.inCurrentMonth && styles.calendarCellInactive,
                      isActive && styles.calendarCellActive,
                    ]}>
                    <Text
                      style={[
                        styles.calendarCellText,
                        !dateCell.inCurrentMonth && styles.calendarCellTextInactive,
                        isActive && styles.calendarCellTextActive,
                      ]}>
                      {dateCell.day}
                    </Text>
                    {hasData ? <Text style={styles.calendarDot}>🔥</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View style={styles.selectedPanel}>
            <Text style={styles.sectionLabel}>選択日</Text>
            <Text style={styles.selectedDate}>{formatDateLabel(selectedDate)}</Text>
            {selectedEntries.length === 0 ? (
              <Text style={styles.emptyText}>この日の記録はありません</Text>
            ) : (
              selectedEntries.map(entry => (
                <View key={entry.id} style={styles.entryRow}>
                  <View>
                    <Text style={styles.entryLabel}>{entry.label}</Text>
                    <Text style={styles.entryMeta}>{entry.type === 'intake' ? '摂取' : '消費'}</Text>
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
              ))
            )}
          </View>
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
    backgroundColor: '#fdf4ff',
  },
  scroll: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.mega,
    gap: tokens.spacing.lg,
  },
  heroCard: {
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
  },
  heroTitle: {
    color: '#fff',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: tokens.spacing.xs,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: tokens.spacing.lg,
    borderRadius: 24,
    gap: tokens.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  summaryBox: {
    flex: 1,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
  },
  intakeBox: {
    backgroundColor: '#dcfce7',
  },
  burnBox: {
    backgroundColor: '#fee2e2',
  },
  summaryLabel: {
    color: '#475569',
  },
  summaryValueGreen: {
    color: '#15803d',
    fontSize: 32,
    fontWeight: '700',
  },
  summaryValueOrange: {
    color: '#c2410c',
    fontSize: 32,
    fontWeight: '700',
  },
  summaryUnit: {
    color: '#475569',
  },
  sectionTitle: {
    color: '#1f2937',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
    marginBottom: tokens.spacing.sm,
  },
  balanceBox: {
    borderRadius: tokens.radii.lg,
    backgroundColor: '#e0f2fe',
    padding: tokens.spacing.lg,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#0f172a',
    marginBottom: tokens.spacing.xs,
  },
  balanceValue: {
    color: '#0ea5e9',
    fontSize: 28,
    fontWeight: '700',
  },
  ctaRow: {
    gap: tokens.spacing.md,
  },
  ctaButton: {
    borderRadius: tokens.radii.full,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
  },
  ctaIntake: {
    backgroundColor: '#22c55e',
  },
  ctaBurn: {
    backgroundColor: '#f97316',
  },
  ctaText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: tokens.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  trainingCard: {
    backgroundColor: '#fff1e6',
    borderRadius: 24,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  trainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(249,115,22,0.3)',
    paddingVertical: tokens.spacing.sm,
  },
  trainingValue: {
    color: '#c2410c',
    fontSize: 24,
    fontWeight: '700',
  },
  trainingLabel: {
    color: '#7c2d12',
  },
  trainingDuration: {
    color: '#fb923c',
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  monthLabel: {
    color: '#0f172a',
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    color: '#94a3b8',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    marginVertical: 4,
  },
  calendarCellInactive: {
    opacity: 0.3,
  },
  calendarCellActive: {
    backgroundColor: '#a855f7',
  },
  calendarCellText: {
    color: '#1f2937',
  },
  calendarCellTextInactive: {
    color: '#94a3b8',
  },
  calendarCellTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarDot: {
    fontSize: 12,
  },
  selectedPanel: {
    backgroundColor: '#f8fafc',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  sectionLabel: {
    color: '#6366f1',
  },
  selectedDate: {
    color: '#1f2937',
    fontWeight: '600',
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
  emptyText: {
    color: tokens.palette.textSecondary,
    textAlign: 'center',
    marginTop: tokens.spacing.lg,
  },
});

function buildMonthMatrix(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  const matrix: { iso: string; day: number; inCurrentMonth: boolean }[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      const iso = startDate.toISOString().slice(0, 10);
      days.push({ iso, day: startDate.getDate(), inCurrentMonth: startDate.getMonth() === date.getMonth() });
      startDate.setDate(startDate.getDate() + 1);
    }
    matrix.push(days);
  }
  return matrix;
}

function moveMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

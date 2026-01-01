/**
 * components/body-data/BodyDataHistoryModal.tsx
 *
 * 【責務】
 * フィールド単位の身体データ履歴を一覧表示し、値編集や削除アクションを提供するモーダルを実装する。
 *
 * 【使用箇所】
 * - Body タブのカード「履歴」ボタン
 *
 * 【やらないこと】
 * - ストア内の履歴を直接保持
 * - 入力検証の詳細
 *
 * 【他ファイルとの関係】
 * - hooks/useBodyDataStore.ts の updateEntry / removeEntry と連携する。
 */

import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/constants/design-tokens';
import { BodyDataField, BodyDataRecord } from '@/hooks/useBodyDataStore';

interface BodyDataHistoryModalProps {
  visible: boolean;
  field: BodyDataField;
  history: BodyDataRecord[];
  onClose: () => void;
  onUpdate: (date: string, value: number) => Promise<void>;
  onDelete: (date: string) => Promise<void>;
}

const FIELD_LABEL: Record<BodyDataField, string> = {
  weight: '体重',
  bodyFat: '体脂肪率',
  muscleMass: '筋肉量',
  bmi: 'BMI',
  waterContent: '水分量',
  visceralFat: '内臓脂肪',
};

/**
 * BodyDataHistoryModal
 *
 * 【処理概要】
 * フィールドの履歴値を編集可能なリストとして表示し、保存/削除イベントを親に通知する。
 *
 * 【呼び出し元】
 * BodyScreen。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * Alert で削除確認を表示。
 */
export function BodyDataHistoryModal({ visible, field, history, onClose, onUpdate, onDelete }: BodyDataHistoryModalProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    history.forEach(record => {
      nextDrafts[record.date] = String(record[field] ?? '');
    });
    setDrafts(nextDrafts);
  }, [history, field]);

  const unit = useMemo(() => {
    if (field === 'weight' || field === 'muscleMass') return 'kg';
    if (field === 'visceralFat') return '';
    if (field === 'bmi') return '';
    return '%';
  }, [field]);

  /**
   * handleSave
   *
   * 【処理概要】
   * 編集中文字列を数値に変換し、onUpdate を発火させる。
   *
   * 【呼び出し元】
   * 各行の「保存」ボタン。
   *
   * 【入力 / 出力】
   * date / なし。
   *
   * 【副作用】
   * なし。
   */
  const handleSave = (date: string) => {
    const value = parseFloat(drafts[date] ?? '');
    if (Number.isNaN(value)) return;
    onUpdate(date, value).catch(err => {
      Alert.alert('更新に失敗しました', err instanceof Error ? err.message : '不明なエラー');
    });
  };

  /**
   * confirmDelete
   *
   * 【処理概要】
   * Alert を表示し、ユーザーが承認した場合に onDelete を呼び出す。
   *
   * 【呼び出し元】
   * 行ヘッダーの削除ボタン。
   *
   * 【入力 / 出力】
   * date / なし。
   *
   * 【副作用】
   * Alert の表示。
   */
  const confirmDelete = (date: string) => {
    Alert.alert('削除確認', `${date} の記録を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () =>
          onDelete(date).catch(err =>
            Alert.alert('削除に失敗しました', err instanceof Error ? err.message : '不明なエラー'),
          ),
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>{FIELD_LABEL[field]}の履歴</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {history.map(record => (
              <View key={record.date} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.date}>{record.date}</Text>
                  <Pressable onPress={() => confirmDelete(record.date)} accessibilityRole="button">
                    <Text style={styles.deleteText}>削除</Text>
                  </Pressable>
                </View>
                <View style={styles.rowBody}>
                  <TextInput
                    value={drafts[record.date]}
                    onChangeText={text => setDrafts(prev => ({ ...prev, [record.date]: text }))}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                  <Text style={styles.unit}>{unit}</Text>
                  <Pressable onPress={() => handleSave(record.date)} style={styles.saveButton} accessibilityRole="button">
                    <Text style={styles.saveText}>保存</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: tokens.spacing.lg,
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: tokens.spacing.lg,
    maxHeight: '90%',
    gap: tokens.spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  title: {
    color: '#7c3aed',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
  },
  closeText: {
    color: '#475569',
    fontSize: tokens.typography.subtitle,
  },
  content: {
    gap: tokens.spacing.sm,
  },
  row: {
    borderRadius: tokens.radii.lg,
    backgroundColor: '#f8fafc',
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  date: {
    color: '#0f172a',
    fontWeight: tokens.typography.weightMedium,
  },
  deleteText: {
    color: '#ef4444',
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  unit: {
    color: '#475569',
  },
  saveButton: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: '#a855f7',
    borderRadius: tokens.radii.sm,
  },
  saveText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

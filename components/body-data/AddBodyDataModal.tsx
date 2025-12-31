/**
 * components/body-data/AddBodyDataModal.tsx
 *
 * 【責務】
 * 身体データの新規入力フォームをモーダルで表示し、入力値を親へ返却する。
 *
 * 【使用箇所】
 * - Body タブの「データ入力」ボタン
 *
 * 【やらないこと】
 * - ストア更新（親から渡される onSubmit が担当）
 * - バリデーションメッセージの詳細表示
 *
 * 【他ファイルとの関係】
 * - hooks/useBodyDataStore.ts の addEntry と連携
 */

import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/constants/design-tokens';

interface AddBodyDataModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: BodyDataFormPayload) => void;
}

export interface BodyDataFormPayload {
  date?: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  waterContent?: number;
  visceralFat?: number;
}

const FIELD_DEFS = [
  { key: 'weight', label: '体重 (kg)', placeholder: '72.0' },
  { key: 'bodyFat', label: '体脂肪率 (%)', placeholder: '15.2' },
  { key: 'muscleMass', label: '筋肉量 (kg)', placeholder: '55.0' },
  { key: 'bmi', label: 'BMI', placeholder: '23.4' },
  { key: 'waterContent', label: '水分量 (%)', placeholder: '57.8' },
  { key: 'visceralFat', label: '内臓脂肪レベル', placeholder: '9' },
] as const;

type FieldKey = (typeof FIELD_DEFS)[number]['key'];

/**
 * createInitialForm
 *
 * 【処理概要】
 * 入力フォームの初期状態を生成する。
 *
 * 【呼び出し元】
 * コンポーネント初期化および onClose。
 *
 * 【入力 / 出力】
 * なし / Record<FieldKey, string>。
 *
 * 【副作用】
 * なし。
 */
function createInitialForm(): Record<FieldKey, string> {
  return FIELD_DEFS.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {} as Record<FieldKey, string>);
}

/**
 * AddBodyDataModal
 *
 * 【処理概要】
 * モーダル UI を描画し、入力値を数値へ変換した上で onSubmit に渡す。
 *
 * 【呼び出し元】
 * BodyScreen。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * なし。送信時のみ親ハンドラが呼ばれる。
 */
export function AddBodyDataModal({ visible, onClose, onSubmit }: AddBodyDataModalProps) {
  const [form, setForm] = useState<Record<FieldKey, string>>(createInitialForm());
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const isDisabled = useMemo(() => {
    return !Object.values(form).some(value => value.trim().length > 0);
  }, [form]);

  /**
   * handleSubmit
   *
   * 【処理概要】
   * 入力欄を数値へ変換し payload を作成したうえで onSubmit を呼び出す。
   *
   * 【呼び出し元】
   * 保存ボタン。
   *
   * 【入力 / 出力】
   * なし / なし。
   *
   * 【副作用】
   * フォーム状態のリセット。
   */
  const handleSubmit = () => {
    const payload: BodyDataFormPayload = { date };
    FIELD_DEFS.forEach(def => {
      const value = parseFloat(form[def.key] ?? '');
      if (!Number.isNaN(value)) {
        payload[def.key] = value;
      }
    });
    onSubmit(payload);
    setForm(createInitialForm());
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>身体データ入力</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={tokens.palette.textTertiary}
            style={styles.dateInput}
          />
          <ScrollView style={styles.formArea} contentContainerStyle={{ paddingBottom: tokens.spacing.lg }}>
            {FIELD_DEFS.map(field => (
              <View key={field.key} style={styles.fieldRow}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  value={form[field.key]}
                  onChangeText={text => setForm(prev => ({ ...prev, [field.key]: text }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={tokens.palette.textTertiary}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.button, styles.secondaryButton]} accessibilityRole="button">
              <Text style={styles.secondaryText}>閉じる</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isDisabled}
              style={[styles.button, isDisabled ? styles.buttonDisabled : styles.primaryButton]}
              accessibilityRole="button">
              <Text style={styles.primaryText}>保存</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  sheet: {
    backgroundColor: tokens.palette.backgroundElevated,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    maxHeight: '90%',
  },
  title: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
    marginBottom: tokens.spacing.md,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: tokens.palette.textPrimary,
    marginBottom: tokens.spacing.md,
  },
  formArea: {
    maxHeight: 320,
  },
  fieldRow: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    color: tokens.palette.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: tokens.palette.textPrimary,
    backgroundColor: tokens.palette.backgroundCard,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  secondaryText: {
    color: tokens.palette.textSecondary,
  },
  primaryButton: {
    backgroundColor: tokens.palette.accentPurple,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  primaryText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

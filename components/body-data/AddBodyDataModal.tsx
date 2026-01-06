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

import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';

import { tokens } from '@/constants/design-tokens';
import { BodyGender } from '@/hooks/useBodyDataStore';

interface AddBodyDataModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: BodyDataFormPayload) => Promise<void>;
  defaultGender?: BodyGender | null;
}

export interface BodyDataFormPayload {
  date?: string;
  weight?: number;
  heightCm?: number;
  gender?: BodyGender;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  waterContent?: number;
  visceralFat?: number;
}

const FIELD_DEFS = [
  { key: 'weight', label: '体重 (kg)', placeholder: '72.0' },
  { key: 'heightCm', label: '身長 (cm)', placeholder: '172.0' },
  { key: 'bodyFat', label: '体脂肪率 (%)', placeholder: '15.2' },
  { key: 'muscleMass', label: '筋肉量 (kg)', placeholder: '55.0' },
  { key: 'bmi', label: 'BMI', placeholder: '23.4' },
  { key: 'waterContent', label: '水分量 (%)', placeholder: '57.8' },
  { key: 'visceralFat', label: '内臓脂肪レベル', placeholder: '9' },
] as const;

type FieldKey = (typeof FIELD_DEFS)[number]['key'];

const GENDER_OPTIONS: { value: BodyGender; label: string }[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
];

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
export function AddBodyDataModal({ visible, onClose, onSubmit, defaultGender = null }: AddBodyDataModalProps) {
  const [form, setForm] = useState<Record<FieldKey, string>>(createInitialForm());
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [gender, setGender] = useState<BodyGender | null>(defaultGender);

  const isDisabled = useMemo(() => {
    return !Object.values(form).some(value => value.trim().length > 0);
  }, [form]);

  useEffect(() => {
    if (visible) {
      setGender(defaultGender ?? null);
    }
  }, [visible, defaultGender]);

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
  const handleSubmit = async () => {
    const payload: BodyDataFormPayload = { date };
    FIELD_DEFS.forEach(def => {
      const value = parseFloat(form[def.key] ?? '');
      if (!Number.isNaN(value)) {
        payload[def.key] = value;
      }
    });
    if (gender) {
      payload.gender = gender;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(payload);
      setForm(createInitialForm());
      setDate(new Date().toISOString().slice(0, 10));
      setGender(defaultGender ?? null);
    } catch (error) {
      Alert.alert('保存に失敗しました', error instanceof Error ? error.message : '不明なエラー');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>身体データ入力</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#cbd5f5"
              style={styles.dateInput}
            />
            <View style={styles.genderSection}>
              <Text style={styles.label}>性別</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map(option => (
                  <Pressable
                    key={option.value}
                    onPress={() => setGender(option.value)}
                    style={[styles.genderChip, gender === option.value && styles.genderChipActive]}
                    accessibilityRole="button">
                    <Text style={[styles.genderChipText, gender === option.value && styles.genderChipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {FIELD_DEFS.map(field => (
              <View key={field.key} style={styles.fieldRow}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  value={form[field.key]}
                  onChangeText={text => setForm(prev => ({ ...prev, [field.key]: text }))}
                  placeholder={field.placeholder}
                  placeholderTextColor="#cbd5f5"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
            ))}
            <View style={styles.buttonRow}>
              <Pressable onPress={onClose} style={[styles.button, styles.secondaryButton]} accessibilityRole="button">
                <Text style={styles.secondaryText}>閉じる</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={isDisabled || submitting}
                style={[styles.button, isDisabled || submitting ? styles.buttonDisabled : styles.primaryButton]}
                accessibilityRole="button">
                <Text style={styles.primaryText}>{submitting ? '保存中...' : '保存'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: '90%',
  },
  content: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  title: {
    color: '#7c3aed',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
    marginBottom: tokens.spacing.sm,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: '#0f172a',
    marginBottom: tokens.spacing.md,
    backgroundColor: '#f8fafc',
  },
  fieldRow: {
    marginBottom: tokens.spacing.md,
  },
  genderSection: {
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  genderChip: {
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
  },
  genderChipActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#7c3aed',
  },
  genderChipText: {
    color: '#475569',
  },
  genderChipTextActive: {
    color: '#6d28d9',
    fontWeight: tokens.typography.weightMedium,
  },
  label: {
    color: '#475569',
    marginBottom: tokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
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
    borderColor: '#e2e8f0',
  },
  secondaryText: {
    color: '#475569',
  },
  primaryButton: {
    backgroundColor: '#a855f7',
  },
  buttonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  primaryText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

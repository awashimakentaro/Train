/**
 * components/calories/CalorieEntryModal.tsx
 *
 * 【責務】
 * 摂取/消費カロリーの入力モーダルを表示し、入力値を親へ返却する。
 *
 * 【使用箇所】
 * - app/(tabs)/calories.tsx の CTA
 *
 * 【やらないこと】
 * - ストア更新
 *
 * 【他ファイルとの関係】
 * - hooks/useCalorieStore.ts へ渡すパラメータを構築する。
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { tokens } from '@/constants/design-tokens';
import { CalorieEntryType } from '@/hooks/useCalorieStore';

interface CalorieEntryModalProps {
  visible: boolean;
  type: CalorieEntryType;
  onClose: () => void;
  onSubmit: (payload: { amount: number; label: string; durationMinutes?: number }) => void;
}

const placeholderColor = '#94a3b8';

/**
 * CalorieEntryModal
 *
 * 【処理概要】
 * 摂取/消費のカロリー値とメモを入力させ、保存時に親へ渡す。
 *
 * 【呼び出し元】
 * カロリータブ。
 *
 * 【入力 / 出力】
 * props / JSX.Element。
 *
 * 【副作用】
 * なし（親がストアを更新）。
 */
export function CalorieEntryModal({ visible, type, onClose, onSubmit }: CalorieEntryModalProps) {
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [duration, setDuration] = useState('');

  /**
   * handleSave
   *
   * 【処理概要】
   * 入力値を数値へ変換し、onSubmit を呼び出してモーダルを閉じる。
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
  const handleSave = () => {
    const parsed = Number(amount);
    if (!parsed || !label.trim()) return;
    onSubmit({
      amount: parsed,
      label: label.trim(),
      durationMinutes: type === 'burn' ? Number(duration) || undefined : undefined,
    });
    setAmount('');
    setLabel('');
    setDuration('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{type === 'intake' ? '摂取カロリー' : '消費カロリー'}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="300"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={placeholderColor}
          />
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder={type === 'intake' ? '食事' : 'ランニング'}
            style={styles.input}
            placeholderTextColor={placeholderColor}
          />
          {type === 'burn' ? (
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="トレーニング時間 (分)"
              keyboardType="number-pad"
              style={styles.input}
              placeholderTextColor={placeholderColor}
            />
          ) : null}
          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={[styles.button, styles.secondary]}>
              <Text style={styles.secondaryText}>閉じる</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={[styles.button, styles.primary]}>
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
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    color: '#0f172a',
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
    marginBottom: tokens.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: tokens.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: '#f1f5f9',
  },
  secondaryText: {
    color: '#475569',
  },
  primary: {
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

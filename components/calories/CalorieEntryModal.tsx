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
            placeholderTextColor={tokens.palette.textTertiary}
          />
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder={type === 'intake' ? '食事' : 'ランニング'}
            style={styles.input}
            placeholderTextColor={tokens.palette.textTertiary}
          />
          {type === 'burn' ? (
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="トレーニング時間 (分)"
              keyboardType="number-pad"
              style={styles.input}
              placeholderTextColor={tokens.palette.textTertiary}
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: tokens.spacing.lg,
  },
  sheet: {
    backgroundColor: tokens.palette.backgroundElevated,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  title: {
    color: tokens.palette.textPrimary,
    fontSize: tokens.typography.subtitle,
    fontWeight: tokens.typography.weightSemiBold,
    marginBottom: tokens.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    color: tokens.palette.textPrimary,
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
    borderWidth: 1,
    borderColor: tokens.palette.borderMuted,
  },
  secondaryText: {
    color: tokens.palette.textSecondary,
  },
  primary: {
    backgroundColor: tokens.palette.accentPink,
  },
  primaryText: {
    color: '#fff',
    fontWeight: tokens.typography.weightSemiBold,
  },
});

/**
 * hooks/useTimerSoundAgent.ts
 *
 * 【責務】
 * トレーニングセッションのフェーズ遷移およびカウントダウン残秒を監視し、適切な効果音を再生する。
 *
 * 【使用箇所】
 * - app/(tabs)/training-session.tsx
 *
 * 【やらないこと】
 * - タイマー値の計算
 * - UI 表示
 *
 * 【他ファイルとの関係】
 * - hooks/useTrainingSession.ts の状態を参照して効果音を決定する。
 */

import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

import { SessionPhase } from '@/hooks/useTrainingSession';

type TimerCue = 'trainingStart' | 'restStart' | 'sessionComplete' | 'countdown';

type LoadedSoundMap = Partial<Record<TimerCue, Audio.Sound>>;

const CUE_ASSETS: Record<TimerCue, number> = {
  trainingStart: require('@/assets/sounds/training-start.wav'),
  restStart: require('@/assets/sounds/rest-start.wav'),
  sessionComplete: require('@/assets/sounds/session-complete.wav'),
  countdown: require('@/assets/sounds/countdown-beep.wav'),
};

export interface TimerSoundAgentOptions {
  phase: SessionPhase;
  phaseRemainingSeconds: number;
  isPaused: boolean;
}

/**
 * loadSoundForCue
 *
 * 【処理概要】
 * 指定されたキュー用の Audio.Sound インスタンスを生成する。
 *
 * 【呼び出し元】
 * useTimerSoundAgent 内部。
 *
 * 【入力 / 出力】
 * cue / Audio.Sound | null。
 *
 * 【副作用】
 * Audio.Sound.createAsync を呼び出し、サウンドリソースをメモリに展開する。
 */
async function loadSoundForCue(cue: TimerCue): Promise<Audio.Sound | null> {
  try {
    const { sound } = await Audio.Sound.createAsync(CUE_ASSETS[cue], { volume: 1 });
    return sound;
  } catch (error) {
    console.warn('[timer-sound] failed to load sound', cue, error);
    return null;
  }
}

/**
 * unloadAllSounds
 *
 * 【処理概要】
 * ロード済みの全効果音を解放してメモリリークを防ぐ。
 *
 * 【呼び出し元】
 * useTimerSoundAgent のクリーンアップ。
 *
 * 【入力 / 出力】
 * soundMap / Promise<void>。
 *
 * 【副作用】
 * Audio.Sound.unloadAsync を呼び出す。
 */
async function unloadAllSounds(soundMap: LoadedSoundMap) {
  const unloads = Object.values(soundMap)
    .filter((sound): sound is Audio.Sound => !!sound)
    .map(sound => sound.unloadAsync().catch(() => {}));
  await Promise.all(unloads);
}

/**
 * replaySoundFromStart
 *
 * 【処理概要】
 * 渡されたサウンドの再生位置を先頭に戻して再生する。
 *
 * 【呼び出し元】
 * useTimerSoundAgent 内。
 *
 * 【入力 / 出力】
 * sound / Promise<void>。
 *
 * 【副作用】
 * サウンドを再生する。
 */
async function replaySoundFromStart(sound: Audio.Sound) {
  await sound.setPositionAsync(0);
  await sound.playAsync();
}

/**
 * useTimerSoundAgent
 *
 * 【処理概要】
 * トレーニングの phase / 残秒 / 一時停止状態を監視し、遷移音とカウントダウン音を鳴らす副作用を提供する。
 *
 * 【呼び出し元】
 * TrainingScreen。
 *
 * 【入力 / 出力】
 * TimerSoundAgentOptions / なし。
 *
 * 【副作用】
 * Audio.Sound を再生する。
 */
export function useTimerSoundAgent({ phase, phaseRemainingSeconds, isPaused }: TimerSoundAgentOptions) {
  const soundsRef = useRef<LoadedSoundMap>({});
  const readyRef = useRef(false);
  const previousPhaseRef = useRef<SessionPhase>('idle');
  const countdownSecondRef = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    const prepare = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.warn('[timer-sound] failed to set audio mode', error);
      }
      const cueOrder: TimerCue[] = ['trainingStart', 'restStart', 'sessionComplete', 'countdown'];
      for (const cue of cueOrder) {
        if (disposed) break;
        const sound = await loadSoundForCue(cue);
        if (disposed) {
          if (sound) {
            await sound.unloadAsync().catch(() => {});
          }
          break;
        }
        if (sound) {
          soundsRef.current[cue] = sound;
        }
      }
      if (!disposed) {
        readyRef.current = true;
      }
    };

    prepare();
    return () => {
      disposed = true;
      const sounds = soundsRef.current;
      soundsRef.current = {};
      readyRef.current = false;
      countdownSecondRef.current = null;
      unloadAllSounds(sounds).catch(() => {});
    };
  }, []);

  const playCue = useCallback((cue: TimerCue) => {
    if (!readyRef.current) return;
    const sound = soundsRef.current[cue];
    if (!sound) return;
    replaySoundFromStart(sound).catch(() => {});
  }, []);

  useEffect(() => {
    const previous = previousPhaseRef.current;
    if (!readyRef.current) {
      previousPhaseRef.current = phase;
      return;
    }
    if (phase !== previous) {
      if (phase === 'training') {
        playCue('trainingStart');
      } else if (phase === 'rest') {
        playCue('restStart');
      } else if (phase === 'completed') {
        playCue('sessionComplete');
      }
      if (phase === 'idle') {
        countdownSecondRef.current = null;
      }
    }
    previousPhaseRef.current = phase;
  }, [phase, playCue]);

  useEffect(() => {
    if (!readyRef.current) return;
    if (phase !== 'training' && phase !== 'rest') {
      countdownSecondRef.current = null;
      return;
    }
    if (isPaused) {
      return;
    }
    const secondsLeft = Math.ceil(phaseRemainingSeconds);
    if (secondsLeft > 3) {
      countdownSecondRef.current = null;
      return;
    }
    if (secondsLeft <= 0) {
      return;
    }
    if (countdownSecondRef.current === secondsLeft) {
      return;
    }
    countdownSecondRef.current = secondsLeft;
    playCue('countdown');
  }, [phaseRemainingSeconds, phase, isPaused, playCue]);
}

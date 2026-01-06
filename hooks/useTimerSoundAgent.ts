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

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { SessionPhase } from '@/hooks/useTrainingSession';

type TimerCue = 'trainingStart' | 'restStart' | 'sessionComplete' | 'countdown';

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
  const previousPhaseRef = useRef<SessionPhase>('idle');
  const countdownSecondRef = useRef<number | null>(null);
  const trainingPlayer = useAudioPlayer(CUE_ASSETS.trainingStart);
  const restPlayer = useAudioPlayer(CUE_ASSETS.restStart);
  const completePlayer = useAudioPlayer(CUE_ASSETS.sessionComplete);
  const countdownPlayer = useAudioPlayer(CUE_ASSETS.countdown);

  const trainingStatus = useAudioPlayerStatus(trainingPlayer);
  const restStatus = useAudioPlayerStatus(restPlayer);
  const completeStatus = useAudioPlayerStatus(completePlayer);
  const countdownStatus = useAudioPlayerStatus(countdownPlayer);

  const cuePlayers = useMemo(
    () => ({
      trainingStart: trainingPlayer,
      restStart: restPlayer,
      sessionComplete: completePlayer,
      countdown: countdownPlayer,
    }),
    [trainingPlayer, restPlayer, completePlayer, countdownPlayer],
  );

  const playersReady = useMemo(() => {
    return (
      Boolean(trainingStatus?.isLoaded) &&
      Boolean(restStatus?.isLoaded) &&
      Boolean(completeStatus?.isLoaded) &&
      Boolean(countdownStatus?.isLoaded)
    );
  }, [trainingStatus?.isLoaded, restStatus?.isLoaded, completeStatus?.isLoaded, countdownStatus?.isLoaded]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    }).catch(error => {
      console.warn('[timer-sound] failed to set audio mode', error);
    });
  }, []);

  const playCue = useCallback(
    (cue: TimerCue) => {
      if (!playersReady) return;
      const player = cuePlayers[cue];
      if (!player) return;
      try {
        player.seekTo(0).catch(() => {});
        player.play();
      } catch (error) {
        console.warn('[timer-sound] failed to play cue', cue, error);
      }
    },
    [cuePlayers, playersReady],
  );

  useEffect(() => {
    const previous = previousPhaseRef.current;
    if (!playersReady) {
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
    if (!playersReady) return;
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
  }, [phaseRemainingSeconds, phase, isPaused, playCue, playersReady]);
}

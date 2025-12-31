import { useState, useEffect } from 'react';
import { Pause, Play, SkipForward, Youtube, X } from 'lucide-react';
import { Exercise } from '../App';

interface TrainingSessionProps {
  exercises: Exercise[];
  userWeight?: number;
  onExit: () => void;
  onComplete: (data: {
    totalTime: number;
    totalCalories: number;
    completedExercises: {
      name: string;
      weight: number;
      sets: number;
      totalTime: number;
      calories: number;
    }[];
  }) => void;
}

type TimerPhase = 'training' | 'rest';

export function TrainingSession({ exercises, userWeight = 70, onExit, onComplete }: TrainingSessionProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<TimerPhase>('training');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());
  const [exerciseTimeTracking, setExerciseTimeTracking] = useState<{[key: number]: number}>({});

  const currentExercise = exercises[currentExerciseIndex];

  // Calculate METs based on weight intensity
  const calculateMETs = (exerciseWeight: number, bodyWeight: number): number => {
    const intensity = exerciseWeight / bodyWeight;
    if (intensity >= 0.5) return 8.0; // High intensity
    if (intensity >= 0.3) return 6.0; // Medium intensity
    return 4.0; // Light intensity
  };

  // Calculate calories for an exercise
  const calculateCalories = (weight: number, mets: number, timeInSeconds: number): number => {
    const hours = timeInSeconds / 3600;
    return mets * weight * hours;
  };

  useEffect(() => {
    if (!currentExercise) return;
    setTimeRemaining(currentExercise.trainingTime);
  }, [currentExercise]);

  useEffect(() => {
    if (isPaused || timeRemaining === 0) return;

    const timer = setInterval(() => {
      // Track training time (not rest time)
      if (phase === 'training') {
        setExerciseTimeTracking(prev => ({
          ...prev,
          [currentExerciseIndex]: (prev[currentExerciseIndex] || 0) + 1
        }));
      }

      setTimeRemaining(prev => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeRemaining, phase, currentExerciseIndex]);

  const handlePhaseComplete = () => {
    if (phase === 'training') {
      // トレーニング終了 → 休憩開始
      setPhase('rest');
      setTimeRemaining(currentExercise.restTime);
    } else {
      // 休憩終了 → 次セットへ
      if (currentSet < currentExercise.sets) {
        setCurrentSet(prev => prev + 1);
        setPhase('training');
        setTimeRemaining(currentExercise.trainingTime);
      } else {
        // 種目完了 → 次種目へ
        handleNextExercise();
      }
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setPhase('training');
      setIsPaused(false);
    } else {
      // 全種目完了 - calculate results and call onComplete
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      
      let totalCalories = 0;
      const completedExercises = exercises.map((exercise, index) => {
        const time = exerciseTimeTracking[index] || 0;
        const mets = calculateMETs(exercise.weight, userWeight);
        const calories = calculateCalories(userWeight, mets, time);
        totalCalories += calories;
        
        return {
          name: exercise.name,
          weight: exercise.weight,
          sets: exercise.sets,
          totalTime: time,
          calories: calories,
        };
      });
      
      onComplete({ 
        totalTime, 
        totalCalories, 
        completedExercises 
      });
    }
  };

  const handleSkip = () => {
    if (phase === 'training') {
      // トレーニング中スキップ → 休憩へ
      setPhase('rest');
      setTimeRemaining(currentExercise.restTime);
    } else {
      // 休憩中スキップ → 次セット or 次種目
      if (currentSet < currentExercise.sets) {
        setCurrentSet(prev => prev + 1);
        setPhase('training');
        setTimeRemaining(currentExercise.trainingTime);
      } else {
        handleNextExercise();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = phase === 'training'
    ? ((currentExercise.trainingTime - timeRemaining) / currentExercise.trainingTime) * 100
    : ((currentExercise.restTime - timeRemaining) / currentExercise.restTime) * 100;

  if (!currentExercise) {
    return null;
  }

  const phaseColor = phase === 'training'
    ? 'from-green-500 to-emerald-600'
    : 'from-blue-500 to-cyan-600';
  
  const phaseText = phase === 'training' ? 'トレーニング中' : '休憩中';
  const phaseEmoji = phase === 'training' ? '💪' : '😌';

  return (
    <div className={`min-h-screen bg-gradient-to-b ${phaseColor} flex flex-col`}>
      {/* Header */}
      <div className="p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-white/80 mb-1">
              種目 {currentExerciseIndex + 1} / {exercises.length}
            </p>
            <h1>{currentExercise.name}</h1>
          </div>
          <button
            onClick={onExit}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-center text-2xl mb-2">
            {phaseEmoji} {phaseText}
          </p>
          <p className="text-center text-white/90">
            セット {currentSet} / {currentExercise.sets}
          </p>
        </div>
      </div>

      {/* Timer */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-80 h-80 mb-8">
          {/* Progress Ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="20"
            />
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="white"
              strokeWidth="20"
              strokeDasharray={`${2 * Math.PI * 140}`}
              strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-7xl mb-2 tabular-nums">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-white/80 text-xl">残り時間</p>
            </div>
          </div>
        </div>

        {/* Exercise Info */}
        <div className="w-full max-w-md bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-white/80">重量</p>
              <p className="text-white text-3xl">{currentExercise.weight} kg</p>
            </div>
            {currentExercise.youtubeUrl && (
              <a
                href={currentExercise.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition active:scale-95"
              >
                <Youtube className="w-8 h-8 text-white" />
              </a>
            )}
          </div>
          {currentExercise.memo && (
            <div className="pt-4 border-t border-white/20">
              <p className="text-white/80 mb-1">メモ</p>
              <p className="text-white">{currentExercise.memo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-sm py-6 rounded-2xl active:scale-95 transition"
          >
            {isPaused ? (
              <Play className="w-10 h-10 text-white" />
            ) : (
              <Pause className="w-10 h-10 text-white" />
            )}
            <span className="text-white">
              {isPaused ? '再開' : '一時停止'}
            </span>
          </button>
          
          <button
            onClick={handleSkip}
            className="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-sm py-6 rounded-2xl active:scale-95 transition"
          >
            <SkipForward className="w-10 h-10 text-white" />
            <span className="text-white">スキップ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
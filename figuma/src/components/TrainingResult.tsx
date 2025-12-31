import { Trophy, Flame, Clock, Dumbbell, X } from 'lucide-react';
import { Exercise } from '../App';

interface CompletedExercise {
  name: string;
  weight: number;
  sets: number;
  totalTime: number;
  calories: number;
}

interface TrainingResultProps {
  menuName: string;
  exercises: Exercise[];
  totalTime: number;
  totalCalories: number;
  completedExercises: CompletedExercise[];
  onClose: () => void;
}

export function TrainingResult({
  menuName,
  exercises,
  totalTime,
  totalCalories,
  completedExercises,
  onClose,
}: TrainingResultProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <Trophy className="w-20 h-20 mx-auto mb-4" />
            <h1 className="mb-2">お疲れ様でした！</h1>
            <p className="text-white/90 text-xl">{menuName}</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6">
          {/* Total Calories - Large Display */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-6 mb-6 text-center border-2 border-orange-200">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Flame className="w-10 h-10 text-orange-600" />
              <h2 className="text-orange-900">総消費カロリー</h2>
            </div>
            <p className="text-6xl text-orange-900 mb-2">{Math.round(totalCalories)}</p>
            <p className="text-2xl text-orange-700">kcal</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <p className="text-blue-900">トレーニング時間</p>
              </div>
              <p className="text-3xl text-blue-900">{Math.floor(totalTime / 60)}</p>
              <p className="text-blue-700">分</p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-6 h-6 text-purple-600" />
                <p className="text-purple-900">完了種目</p>
              </div>
              <p className="text-3xl text-purple-900">{completedExercises.length}</p>
              <p className="text-purple-700">種目</p>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="mb-6">
            <h2 className="text-purple-900 mb-3 flex items-center gap-2">
              <Dumbbell className="w-6 h-6" />
              種目別詳細
            </h2>
            <div className="space-y-3">
              {completedExercises.map((exercise, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-purple-900">{exercise.name}</h3>
                    <span className="text-orange-600 font-semibold">
                      {Math.round(exercise.calories)} kcal
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">重量</p>
                      <p className="text-gray-900">{exercise.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-500">セット数</p>
                      <p className="text-gray-900">{exercise.sets}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">時間</p>
                      <p className="text-gray-900">{formatTime(exercise.totalTime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl active:scale-95 transition shadow-lg"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
}
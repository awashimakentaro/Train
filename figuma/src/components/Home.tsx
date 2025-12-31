import { useState } from 'react';
import { Activity, Plus } from 'lucide-react';
import { Exercise, BodyData } from '../App';
import { BodyDataCard } from './BodyDataCard';
import { ExerciseItem } from './ExerciseItem';
import { AddBodyDataModal } from './AddBodyDataModal';
import { BodyDataHistoryModal } from './BodyDataHistoryModal';

interface HomeProps {
  exercises: Exercise[];
  bodyDataHistory: BodyData[];
  onStartTraining: () => void;
  onUpdateExercise: (id: string, updates: Partial<Exercise>) => void;
  onAddBodyData: (data: Omit<BodyData, 'date'>) => void;
  onUpdateBodyData: (date: string, updates: Partial<BodyData>) => void;
  onDeleteBodyData: (date: string) => void;
}

export function Home({
  exercises,
  bodyDataHistory,
  onStartTraining,
  onUpdateExercise,
  onAddBodyData,
  onUpdateBodyData,
  onDeleteBodyData,
}: HomeProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [historyModalField, setHistoryModalField] = useState<keyof BodyData | null>(null);

  const latestData = bodyDataHistory[0] || {};

  const getChartData = (field: keyof BodyData) => {
    return bodyDataHistory
      .slice(0, 7)
      .reverse()
      .map(d => ({ value: d[field] || 0 }));
  };

  const getTrend = (field: keyof BodyData) => {
    if (bodyDataHistory.length < 2) return 0;
    const latest = bodyDataHistory[0][field] || 0;
    const previous = bodyDataHistory[1][field] || 0;
    return latest - previous;
  };

  const enabledCount = exercises.filter(ex => ex.enabled).length;

  return (
    <div className="max-w-md mx-auto pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8" />
          <h1>筋トレ管理</h1>
        </div>
      </div>

      {/* Body Data Section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-purple-900">身体データ</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full shadow-md active:scale-95 transition"
          >
            <Plus className="w-5 h-5" />
            データ入力
          </button>
        </div>

        <div className="space-y-3">
          <BodyDataCard
            title="体重"
            value={latestData.weight}
            unit="kg"
            trend={getTrend('weight')}
            chartData={getChartData('weight')}
            color="#8b5cf6"
            onHistoryClick={() => setHistoryModalField('weight')}
          />
          <BodyDataCard
            title="体脂肪率"
            value={latestData.bodyFat}
            unit="%"
            trend={getTrend('bodyFat')}
            chartData={getChartData('bodyFat')}
            color="#ec4899"
            onHistoryClick={() => setHistoryModalField('bodyFat')}
          />
          <BodyDataCard
            title="筋肉量"
            value={latestData.muscleMass}
            unit="kg"
            trend={getTrend('muscleMass')}
            chartData={getChartData('muscleMass')}
            color="#06b6d4"
            onHistoryClick={() => setHistoryModalField('muscleMass')}
          />
          <BodyDataCard
            title="BMI"
            value={latestData.bmi}
            unit=""
            trend={getTrend('bmi')}
            chartData={getChartData('bmi')}
            color="#f59e0b"
            onHistoryClick={() => setHistoryModalField('bmi')}
          />
          <BodyDataCard
            title="水分量"
            value={latestData.waterContent}
            unit="%"
            trend={getTrend('waterContent')}
            chartData={getChartData('waterContent')}
            color="#3b82f6"
            onHistoryClick={() => setHistoryModalField('waterContent')}
          />
          <BodyDataCard
            title="内臓脂肪レベル"
            value={latestData.visceralFat}
            unit=""
            trend={getTrend('visceralFat')}
            chartData={getChartData('visceralFat')}
            color="#ef4444"
            onHistoryClick={() => setHistoryModalField('visceralFat')}
          />
        </div>
      </div>

      {/* Training Menu Section */}
      <div className="p-4 pt-8">
        <h2 className="text-purple-900 mb-4">今日のトレーニングメニュー</h2>
        <div className="space-y-3">
          {exercises.map(exercise => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onUpdate={onUpdateExercise}
            />
          ))}
        </div>
      </div>

      {/* Start Training Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={onStartTraining}
            disabled={enabledCount === 0}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-6 rounded-2xl shadow-2xl active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">🏋️ トレーニング開始</span>
              <span className="text-green-100">
                {enabledCount}種目を実施
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Add Body Data Modal */}
      {showAddModal && (
        <AddBodyDataModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddBodyData}
        />
      )}

      {/* Body Data History Modal */}
      {historyModalField && (
        <BodyDataHistoryModal
          field={historyModalField}
          bodyDataHistory={bodyDataHistory}
          onClose={() => setHistoryModalField(null)}
          onUpdate={onUpdateBodyData}
          onDelete={onDeleteBodyData}
        />
      )}
    </div>
  );
}
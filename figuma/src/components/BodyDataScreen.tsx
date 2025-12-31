import { useState } from 'react';
import { Plus, Activity, TrendingUp } from 'lucide-react';
import { BodyData } from '../App';
import { BodyDataCard } from './BodyDataCard';
import { AddBodyDataModal } from './AddBodyDataModal';
import { BodyDataHistoryModal } from './BodyDataHistoryModal';

interface BodyDataScreenProps {
  bodyDataHistory: BodyData[];
  onAddBodyData: (data: Omit<BodyData, 'date'>) => void;
  onUpdateBodyData: (date: string, updates: Partial<BodyData>) => void;
  onDeleteBodyData: (date: string) => void;
}

export function BodyDataScreen({
  bodyDataHistory,
  onAddBodyData,
  onUpdateBodyData,
  onDeleteBodyData,
}: BodyDataScreenProps) {
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

  return (
    <div className="max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1>身体データ</h1>
              <TrendingUp className="w-5 h-5 text-green-300" />
            </div>
            <p className="text-white/70 text-sm mt-1">あなたの成長を記録</p>
          </div>
        </div>
      </div>

      {/* Body Data Section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-purple-900">データ一覧</h2>
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
            title="基礎代謝"
            value={latestData.basalMetabolism}
            unit="kcal"
            trend={getTrend('basalMetabolism')}
            chartData={getChartData('basalMetabolism')}
            color="#10b981"
            onHistoryClick={() => setHistoryModalField('basalMetabolism')}
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

      {/* Add Body Data Modal */}
      {showAddModal && (
        <AddBodyDataModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddBodyData}
        />
      )}

      {/* History Modal */}
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
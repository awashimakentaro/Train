import { Exercise } from '../App';
import { ExerciseItem } from './ExerciseItem';
import { Plus, Trash2, Dumbbell, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { CreatePresetModal } from './CreatePresetModal';

interface MenuScreenProps {
  exercises: Exercise[];
  onStartTraining: () => void;
  onUpdateExercise: (id: string, updates: Partial<Exercise>) => void;
  onAddExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  selectedPresetId: string;
  setSelectedPresetId: (id: string) => void;
  menuPresets: { id: string; name: string; exercises: Exercise[] }[];
  onCreatePreset: (name: string, exercises: Exercise[]) => void;
  onDeletePreset: (id: string) => void;
}

export function MenuScreen({
  exercises,
  onStartTraining,
  onUpdateExercise,
  onAddExercise,
  onDeleteExercise,
  selectedPresetId,
  setSelectedPresetId,
  menuPresets,
  onCreatePreset,
  onDeletePreset,
}: MenuScreenProps) {
  const enabledCount = exercises.filter(ex => ex.enabled).length;

  const [isCreatePresetModalOpen, setIsCreatePresetModalOpen] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [deleteConfirmPresetId, setDeleteConfirmPresetId] = useState<string | null>(null);
  const [newExercise, setNewExercise] = useState({
    name: '',
    weight: 0,
    sets: 3,
    restTime: 90,
    trainingTime: 60,
  });

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      weight: newExercise.weight,
      sets: newExercise.sets,
      restTime: newExercise.restTime,
      trainingTime: newExercise.trainingTime,
      enabled: true,
    };

    onAddExercise(exercise);
    setNewExercise({
      name: '',
      weight: 0,
      sets: 3,
      restTime: 90,
      trainingTime: 60,
    });
    setIsAddingExercise(false);
  };

  const handleDeletePreset = (presetId: string) => {
    onDeletePreset(presetId);
    setDeleteConfirmPresetId(null);
  };

  const presetToDelete = menuPresets.find(p => p.id === deleteConfirmPresetId);

  return (
    <div className="max-w-md mx-auto pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1>トレーニングメニュー</h1>
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-white/70 text-sm mt-1">今日も頑張りましょう！</p>
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="p-4 pt-6">
        <h2 className="text-purple-900 mb-3">メニュー選択</h2>
        <div className="space-y-3">
          {menuPresets.map(preset => (
            <div
              key={preset.id}
              className={`flex items-center gap-3 p-4 rounded-xl transition ${
                selectedPresetId === preset.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200'
              }`}
            >
              <button
                onClick={() => setSelectedPresetId(preset.id)}
                className="flex-1 text-left"
              >
                <p className={selectedPresetId === preset.id ? 'text-white' : 'text-gray-900'}>
                  {preset.name}
                </p>
                <p className={`text-sm ${selectedPresetId === preset.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {preset.exercises.length}種目
                </p>
              </button>
              <button
                onClick={() => setDeleteConfirmPresetId(preset.id)}
                className={`p-3 rounded-xl transition active:scale-90 ${
                  selectedPresetId === preset.id
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'bg-red-50 hover:bg-red-100'
                }`}
              >
                <Trash2 className={`w-5 h-5 ${selectedPresetId === preset.id ? 'text-white' : 'text-red-600'}`} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setIsCreatePresetModalOpen(true)}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>新しいメニューを作成</span>
          </button>
        </div>
      </div>

      {/* Training Menu Section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-purple-900">今日のメニュー</h2>
          {exercises.length > 0 && (
            <button
              onClick={() => setIsAddingExercise(true)}
              className="flex items-center gap-1 text-purple-600 text-sm px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition"
            >
              <Plus className="w-4 h-4" />
              種目追加
            </button>
          )}
        </div>
        {exercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">メニューを選択または作成してください</p>
            <p className="text-sm">「+」ボタンから新しいメニューを作成できます</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {exercises.map(exercise => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  onUpdate={onUpdateExercise}
                  onDelete={onDeleteExercise}
                />
              ))}
            </div>

            {/* Add Exercise Form */}
            {isAddingExercise && (
              <div className="bg-purple-50 p-4 rounded-lg mt-3 space-y-3">
                <div>
                  <label className="block text-gray-700 text-sm mb-1">種目名</label>
                  <input
                    type="text"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    placeholder="例: ベンチプレス"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">重量 (kg)</label>
                    <input
                      type="number"
                      value={newExercise.weight}
                      onChange={(e) => setNewExercise({ ...newExercise, weight: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">セット数</label>
                    <input
                      type="number"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise({ ...newExercise, sets: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">休憩時間 (秒)</label>
                    <input
                      type="number"
                      value={newExercise.restTime}
                      onChange={(e) => setNewExercise({ ...newExercise, restTime: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1">実施時間 (秒)</label>
                    <input
                      type="number"
                      value={newExercise.trainingTime}
                      onChange={(e) => setNewExercise({ ...newExercise, trainingTime: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddExercise}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg active:scale-95 transition"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingExercise(false);
                      setNewExercise({
                        name: '',
                        weight: 0,
                        sets: 3,
                        restTime: 90,
                        trainingTime: 60,
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg active:scale-95 transition"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Start Training Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={onStartTraining}
            disabled={enabledCount === 0}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-2">
              <span>🏋️ トレーニング開始</span>
              <span className="text-green-100 text-sm">
                ({enabledCount}種目)
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Create Preset Modal */}
      <CreatePresetModal
        isOpen={isCreatePresetModalOpen}
        onClose={() => setIsCreatePresetModalOpen(false)}
        onCreatePreset={onCreatePreset}
        onDeletePreset={handleDeletePreset}
        menuPresets={menuPresets}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmPresetId && presetToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-gray-900 mb-2">メニューを削除しますか？</h2>
              <p className="text-gray-600">
                「{presetToDelete.name}」を削除します。この操作は取り消せません。
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmPresetId(null)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl active:scale-95 transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDeletePreset(deleteConfirmPresetId)}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl active:scale-95 transition"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
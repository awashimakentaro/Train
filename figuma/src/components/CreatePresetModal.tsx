import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Exercise } from '../App';

interface CreatePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePreset: (name: string, exercises: Exercise[]) => void;
  onDeletePreset: (id: string) => void;
  menuPresets: { id: string; name: string; exercises: Exercise[] }[];
}

export function CreatePresetModal({
  isOpen,
  onClose,
  onCreatePreset,
  onDeletePreset,
  menuPresets,
}: CreatePresetModalProps) {
  const [presetName, setPresetName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
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

    setExercises([...exercises, exercise]);
    setNewExercise({
      name: '',
      weight: 0,
      sets: 3,
      restTime: 90,
      trainingTime: 60,
    });
    setIsAddingExercise(false);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleCreatePreset = () => {
    if (!presetName.trim() || exercises.length === 0) return;

    onCreatePreset(presetName, exercises);
    setPresetName('');
    setExercises([]);
    setIsAddingExercise(false);
    onClose();
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('このメニューを削除しますか？')) {
      onDeletePreset(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h2>メニュー管理</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Preset Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">メニュー名</label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="例: 胸・肩の日"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Exercise List */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-gray-700">種目リスト</label>
              <button
                onClick={() => setIsAddingExercise(true)}
                className="flex items-center gap-1 text-purple-600 text-sm"
              >
                <Plus className="w-4 h-4" />
                種目追加
              </button>
            </div>

            {exercises.length === 0 ? (
              <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                種目を追加してください
              </p>
            ) : (
              <div className="space-y-2">
                {exercises.map(exercise => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div>
                      <div>{exercise.name}</div>
                      <div className="text-gray-500 text-sm">
                        {exercise.weight}kg × {exercise.sets}セット
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(exercise.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Exercise Form */}
          {isAddingExercise && (
            <div className="bg-purple-50 p-4 rounded-lg mb-4 space-y-3">
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

          {/* Create Button */}
          <button
            onClick={handleCreatePreset}
            disabled={!presetName.trim() || exercises.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            メニューを作成
          </button>
        </div>
      </div>
    </div>
  );
}
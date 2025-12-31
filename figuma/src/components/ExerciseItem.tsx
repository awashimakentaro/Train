import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Exercise } from '../App';

interface ExerciseItemProps {
  exercise: Exercise;
  onUpdate: (id: string, updates: Partial<Exercise>) => void;
  onDelete?: (id: string) => void;
}

export function ExerciseItem({ exercise, onUpdate, onDelete }: ExerciseItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-md transition ${exercise.enabled ? 'ring-2 ring-purple-400' : 'opacity-60'}`}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={exercise.enabled}
            onChange={e => onUpdate(exercise.id, { enabled: e.target.checked })}
            className="w-6 h-6 rounded accent-purple-600 cursor-pointer"
          />
          <div className="flex-1">
            <h3 className="text-purple-900">{exercise.name}</h3>
            <p className="text-gray-600">
              {exercise.weight}kg × {exercise.sets}セット
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(exercise.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <Trash2 className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">重量 (kg)</label>
                <input
                  type="number"
                  value={exercise.weight}
                  onChange={e =>
                    onUpdate(exercise.id, { weight: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">セット数</label>
                <input
                  type="number"
                  value={exercise.sets}
                  onChange={e =>
                    onUpdate(exercise.id, { sets: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">実施時間 (秒)</label>
                <input
                  type="number"
                  value={exercise.trainingTime}
                  onChange={e =>
                    onUpdate(exercise.id, { trainingTime: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">休憩時間 (秒)</label>
                <input
                  type="number"
                  value={exercise.restTime}
                  onChange={e =>
                    onUpdate(exercise.id, { restTime: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {exercise.memo && (
              <div>
                <label className="block text-gray-600 mb-1">メモ</label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{exercise.memo}</p>
              </div>
            )}
            
            {exercise.youtubeUrl && (
              <div>
                <label className="block text-gray-600 mb-1">YouTube URL</label>
                <a 
                  href={exercise.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline text-sm break-all"
                >
                  {exercise.youtubeUrl}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
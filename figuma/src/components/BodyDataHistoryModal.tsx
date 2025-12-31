import { useState } from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';
import { BodyData } from '../App';

interface BodyDataHistoryModalProps {
  field: keyof BodyData;
  bodyDataHistory: BodyData[];
  onClose: () => void;
  onUpdate: (date: string, updates: Partial<BodyData>) => void;
  onDelete: (date: string) => void;
}

const fieldLabels: Record<string, { title: string; unit: string }> = {
  weight: { title: '体重', unit: 'kg' },
  bodyFat: { title: '体脂肪率', unit: '%' },
  muscleMass: { title: '筋肉量', unit: 'kg' },
  bmi: { title: 'BMI', unit: '' },
  basalMetabolism: { title: '基礎代謝', unit: 'kcal' },
  waterContent: { title: '水分量', unit: '%' },
  visceralFat: { title: '内臓脂肪レベル', unit: '' },
};

export function BodyDataHistoryModal({
  field,
  bodyDataHistory,
  onClose,
  onUpdate,
  onDelete,
}: BodyDataHistoryModalProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { title, unit } = fieldLabels[field] || { title: '', unit: '' };

  const filteredHistory = bodyDataHistory.filter(data => data[field] !== undefined);

  const handleEdit = (date: string, value: number) => {
    setEditingDate(date);
    setEditValue(value.toString());
  };

  const handleSave = () => {
    if (editingDate && editValue) {
      onUpdate(editingDate, { [field]: Number(editValue) });
      setEditingDate(null);
      setEditValue('');
    }
  };

  const handleDelete = (date: string) => {
    if (confirm('このデータを削除しますか？')) {
      onDelete(date);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} (${weekday})`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-purple-900">{title}の履歴</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {filteredHistory.length === 0 ? (
            <p className="text-center text-gray-400 py-8">データがありません</p>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(data => (
                <div
                  key={data.date}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-gray-600 mb-1">
                        {formatDate(data.date)}
                      </p>
                      {editingDate === data.date ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-24 px-3 py-2 border border-purple-400 rounded-lg"
                            autoFocus
                          />
                          <span className="text-gray-600">{unit}</span>
                        </div>
                      ) : (
                        <p className="text-2xl text-purple-900">
                          {data[field]?.toFixed(1)} {unit}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingDate === data.date ? (
                        <>
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg active:scale-95 transition"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingDate(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg active:scale-95 transition"
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(data.date, data[field]!)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                          >
                            <Edit2 className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(data.date)}
                            className="p-2 hover:bg-red-100 rounded-lg transition"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
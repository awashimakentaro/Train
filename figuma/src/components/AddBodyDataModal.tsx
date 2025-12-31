import { useState } from 'react';
import { X } from 'lucide-react';
import { BodyData } from '../App';

interface AddBodyDataModalProps {
  onClose: () => void;
  onAdd: (data: Omit<BodyData, 'date'>) => void;
}

export function AddBodyDataModal({ onClose, onAdd }: AddBodyDataModalProps) {
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    bmi: '',
    basalMetabolism: '',
    waterContent: '',
    visceralFat: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Omit<BodyData, 'date'> = {
      weight: formData.weight ? Number(formData.weight) : undefined,
      bodyFat: formData.bodyFat ? Number(formData.bodyFat) : undefined,
      muscleMass: formData.muscleMass ? Number(formData.muscleMass) : undefined,
      bmi: formData.bmi ? Number(formData.bmi) : undefined,
      basalMetabolism: formData.basalMetabolism
        ? Number(formData.basalMetabolism)
        : undefined,
      waterContent: formData.waterContent ? Number(formData.waterContent) : undefined,
      visceralFat: formData.visceralFat ? Number(formData.visceralFat) : undefined,
    };
    onAdd(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-purple-900">身体データ入力</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">体重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              placeholder="72.5"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">体脂肪率 (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.bodyFat}
              onChange={e => setFormData({ ...formData, bodyFat: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              placeholder="18.5"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">筋肉量 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={formData.muscleMass}
              onChange={e => setFormData({ ...formData, muscleMass: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              placeholder="56.2"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">BMI</label>
            <input
              type="number"
              step="0.1"
              value={formData.bmi}
              onChange={e => setFormData({ ...formData, bmi: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              placeholder="23.1"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">基礎代謝量 (kcal)</label>
            <input
              type="number"
              step="1"
              value={formData.basalMetabolism}
              onChange={e =>
                setFormData({ ...formData, basalMetabolism: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              placeholder="1500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">水分量 (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.waterContent}
              onChange={e =>
                setFormData({ ...formData, waterContent: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              placeholder="58.5"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">内臓脂肪レベル</label>
            <input
              type="number"
              step="1"
              value={formData.visceralFat}
              onChange={e =>
                setFormData({ ...formData, visceralFat: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              placeholder="8"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl active:scale-95 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl active:scale-95 transition shadow-lg"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
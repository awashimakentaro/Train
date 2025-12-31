import { useState } from 'react';
import { Flame, TrendingUp, TrendingDown, Plus, Calendar, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { BodyData, CalorieData } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CaloriesScreenProps {
  bodyDataHistory: BodyData[];
  menuPresets: any[];
  calorieHistory: CalorieData[];
  onAddConsumedCalories: (calories: number) => void;
  onAddBurnedCalories: (calories: number, activityName?: string) => void;
}

export function CaloriesScreen({
  bodyDataHistory,
  menuPresets,
  calorieHistory,
  onAddConsumedCalories,
  onAddBurnedCalories,
}: CaloriesScreenProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [calorieType, setCalorieType] = useState<'consumed' | 'burned'>('consumed');
  const [calorieInput, setCalorieInput] = useState('');
  const [activityNameInput, setActivityNameInput] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayData = calorieHistory.find(d => d.date === today);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // Prepare chart data (last 7 days)
  const chartData = calorieHistory
    .slice(0, 7)
    .reverse()
    .map(data => ({
      date: formatDate(data.date),
      摂取: data.consumed,
      消費: data.burned,
      差分: data.consumed - data.burned,
    }));

  const netCalories = (todayData?.consumed || 0) - (todayData?.burned || 0);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getDateString = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getDataForDate = (day: number) => {
    const dateStr = getDateString(day);
    return calorieHistory.find(d => d.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="max-w-md mx-auto pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white p-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Flame className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1>カロリー管理</h1>
              <Target className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-white/70 text-sm mt-1">
              {new Date().toLocaleDateString('ja-JP', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="p-4 pt-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h2 className="text-purple-900">今日の摂取・消費</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
              <p className="text-green-700 text-sm mb-1">摂取カロリー</p>
              <p className="text-3xl text-green-900">{todayData?.consumed || 0}</p>
              <p className="text-green-600 text-sm">kcal</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center">
              <p className="text-orange-700 text-sm mb-1">消費カロリー</p>
              <p className="text-3xl text-orange-900">{todayData?.burned || 0}</p>
              <p className="text-orange-600 text-sm">kcal</p>
            </div>
          </div>

          <div className={`rounded-2xl p-4 text-center ${
            netCalories > 0 
              ? 'bg-gradient-to-br from-red-50 to-red-100' 
              : 'bg-gradient-to-br from-blue-50 to-blue-100'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {netCalories > 0 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  <p className="text-red-700">カロリー収支</p>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-700">カロリー収支</p>
                </>
              )}
            </div>
            <p className={`text-3xl ${netCalories > 0 ? 'text-red-900' : 'text-blue-900'}`}>
              {netCalories > 0 ? '+' : ''}{netCalories}
            </p>
            <p className={`text-sm ${netCalories > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              kcal
            </p>
          </div>

          <button
            onClick={() => {
              setCalorieType('consumed');
              setShowAddModal(true);
            }}
            className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            摂取を記録
          </button>

          <button
            onClick={() => {
              setCalorieType('burned');
              setShowAddModal(true);
            }}
            className="w-full mt-3 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center gap-2 active:scale-95 transition shadow-md"
          >
            <Flame className="w-5 h-5" />
            消費を記録
          </button>
        </div>

        {/* Training Sessions Today */}
        {todayData && todayData.trainingSessions.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <h3 className="text-purple-900 mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-600" />
              今日のトレーニング
            </h3>
            <div className="space-y-3">
              {todayData.trainingSessions.map((session, index) => (
                <div
                  key={index}
                  className="bg-orange-50 rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="text-gray-900">{session.menuName}</p>
                    <p className="text-sm text-gray-500">
                      {Math.floor(session.time / 60)}分
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-600">-{Math.round(session.calories)}</p>
                    <p className="text-xs text-orange-500">kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-Day Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <h3 className="text-purple-900 mb-4">7日間の推移</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#999"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#999"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="摂取" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="消費" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* History */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-purple-900">カレンダー</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg active:scale-95 transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <p className="text-gray-900 min-w-[120px] text-center">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </p>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg active:scale-95 transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
              <div
                key={index}
                className="text-center py-2 text-xs text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {getCalendarDays().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = getDateString(day);
              const data = getDataForDate(day);
              const net = data ? data.consumed - data.burned : 0;
              const isToday = dateStr === today;
              const hasData = data && (data.consumed > 0 || data.burned > 0);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square p-1 rounded-lg text-xs transition ${
                    isToday
                      ? 'bg-purple-600 text-white'
                      : hasData
                      ? net > 0
                        ? 'bg-red-50 hover:bg-red-100'
                        : 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className={`text-sm ${isToday ? 'text-white' : 'text-gray-900'}`}>
                      {day}
                    </div>
                    {hasData && data.trainingSessions.length > 0 && (
                      <Flame className={`w-3 h-3 mt-0.5 ${isToday ? 'text-orange-200' : 'text-orange-500'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Consumed Calories Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-gray-900 mb-4">カロリーを記録</h2>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm mb-2">
                カロリー (kcal)
              </label>
              <input
                type="number"
                value={calorieInput}
                onChange={(e) => setCalorieInput(e.target.value)}
                placeholder="例: 500"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
            {calorieType === 'burned' && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm mb-2">
                  アクティビティ名
                </label>
                <input
                  type="text"
                  value={activityNameInput}
                  onChange={(e) => setActivityNameInput(e.target.value)}
                  placeholder="例: 走行"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCalorieInput('');
                  setActivityNameInput('');
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl active:scale-95 transition"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  // Handle adding consumed calories here
                  const calories = parseFloat(calorieInput);
                  if (!isNaN(calories)) {
                    if (calorieType === 'consumed') {
                      onAddConsumedCalories(calories);
                    } else if (calorieType === 'burned') {
                      onAddBurnedCalories(calories, activityNameInput);
                    }
                  }
                  setShowAddModal(false);
                  setCalorieInput('');
                  setActivityNameInput('');
                }}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl active:scale-95 transition"
              >
                記録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Detail Modal */}
      {selectedDate && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDate(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-gray-900 mb-4">
              {new Date(selectedDate).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
            
            {(() => {
              const data = calorieHistory.find(d => d.date === selectedDate);
              if (!data || (data.consumed === 0 && data.burned === 0)) {
                return (
                  <p className="text-gray-500 text-center py-8">
                    この日のデータがありません
                  </p>
                );
              }

              const net = data.consumed - data.burned;

              return (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-green-700 text-sm mb-1">摂取</p>
                      <p className="text-2xl text-green-900">{data.consumed}</p>
                      <p className="text-green-600 text-xs">kcal</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 text-center">
                      <p className="text-orange-700 text-sm mb-1">消費</p>
                      <p className="text-2xl text-orange-900">{data.burned}</p>
                      <p className="text-orange-600 text-xs">kcal</p>
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 text-center mb-4 ${
                    net > 0 ? 'bg-red-50' : 'bg-blue-50'
                  }`}>
                    <p className={`text-sm ${net > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                      収支
                    </p>
                    <p className={`text-2xl ${net > 0 ? 'text-red-900' : 'text-blue-900'}`}>
                      {net > 0 ? '+' : ''}{net} kcal
                    </p>
                  </div>

                  {data.trainingSessions.length > 0 && (
                    <>
                      <h3 className="text-gray-900 mb-2 flex items-center gap-2 text-sm">
                        <Flame className="w-4 h-4 text-orange-600" />
                        トレーニング
                      </h3>
                      <div className="space-y-2 mb-4">
                        {data.trainingSessions.map((session, index) => (
                          <div
                            key={index}
                            className="bg-orange-50 rounded-lg p-3 flex justify-between items-center text-sm"
                          >
                            <div>
                              <p className="text-gray-900">{session.menuName}</p>
                              <p className="text-xs text-gray-500">
                                {Math.floor(session.time / 60)}分
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-orange-600">-{Math.round(session.calories)}</p>
                              <p className="text-xs text-orange-500">kcal</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              );
            })()}

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl active:scale-95 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
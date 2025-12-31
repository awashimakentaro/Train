import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface BodyDataCardProps {
  title: string;
  value?: number;
  unit: string;
  trend: number;
  chartData: { value: number }[];
  color: string;
  onHistoryClick: () => void;
}

export function BodyDataCard({
  title,
  value,
  unit,
  trend,
  chartData,
  color,
  onHistoryClick,
}: BodyDataCardProps) {
  const hasValue = value !== undefined && value !== null;
  const trendColor = trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-400';

  return (
    <button
      onClick={onHistoryClick}
      className="w-full bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition text-left"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            {hasValue ? (
              <>
                <span className="text-3xl" style={{ color }}>
                  {value.toFixed(1)}
                </span>
                <span className="text-gray-500">{unit}</span>
              </>
            ) : (
              <span className="text-gray-400">データなし</span>
            )}
          </div>
          {hasValue && trend !== 0 && (
            <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {trend > 0 ? '+' : ''}
                {trend.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div className="w-24 h-16">
          {chartData.length > 1 && (
            <ResponsiveContainer width={96} height={64}>
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </button>
  );
}
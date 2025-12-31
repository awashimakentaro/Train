import { Activity, Dumbbell, Flame } from 'lucide-react';
import { TabType } from '../App';

interface TabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-md mx-auto flex">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition ${
            activeTab === 'menu'
              ? 'text-purple-600'
              : 'text-gray-400'
          }`}
        >
          <Dumbbell className="w-6 h-6" />
          <span className="text-xs">メニュー</span>
        </button>
        
        <button
          onClick={() => setActiveTab('body')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition ${
            activeTab === 'body'
              ? 'text-purple-600'
              : 'text-gray-400'
          }`}
        >
          <Activity className="w-6 h-6" />
          <span className="text-xs">身体データ</span>
        </button>

        <button
          onClick={() => setActiveTab('calories')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition ${
            activeTab === 'calories'
              ? 'text-purple-600'
              : 'text-gray-400'
          }`}
        >
          <Flame className="w-6 h-6" />
          <span className="text-xs">カロリー</span>
        </button>
      </div>
    </div>
  );
}
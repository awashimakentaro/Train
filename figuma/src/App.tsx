import { useState } from 'react';
import { BodyDataScreen } from './components/BodyDataScreen';
import { MenuScreen } from './components/MenuScreen';
import { TrainingSession } from './components/TrainingSession';
import { TrainingResult } from './components/TrainingResult';
import { CaloriesScreen } from './components/CaloriesScreen';
import { TabBar } from './components/TabBar';

export interface Exercise {
  id: string;
  name: string;
  weight: number;
  sets: number;
  restTime: number;
  trainingTime: number;
  enabled: boolean;
  memo?: string;
  youtubeUrl?: string;
}

export interface MenuPreset {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface BodyData {
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  waterContent?: number;
  visceralFat?: number;
  basalMetabolism?: number;
}

export interface CalorieData {
  date: string;
  consumed: number;
  burned: number;
  trainingSessions: {
    menuName: string;
    calories: number;
    time: number;
  }[];
}

export type TabType = 'body' | 'menu' | 'calories';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [isTraining, setIsTraining] = useState(false);
  const [showTrainingResult, setShowTrainingResult] = useState(false);
  const [trainingResultData, setTrainingResultData] = useState<{
    totalTime: number;
    totalCalories: number;
    completedExercises: {
      name: string;
      weight: number;
      sets: number;
      totalTime: number;
      calories: number;
    }[];
  } | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const [menuPresets, setMenuPresets] = useState<MenuPreset[]>([]);

  const [calorieHistory, setCalorieHistory] = useState<CalorieData[]>([
    { 
      date: '2025-12-31', 
      consumed: 2200, 
      burned: 450,
      trainingSessions: [
        { menuName: '胸・肩の日', calories: 450, time: 3600 }
      ]
    },
    { 
      date: '2025-12-30', 
      consumed: 2100, 
      burned: 380,
      trainingSessions: [
        { menuName: '脚の日', calories: 380, time: 3200 }
      ]
    },
    { 
      date: '2025-12-29', 
      consumed: 2300, 
      burned: 0,
      trainingSessions: []
    },
    { 
      date: '2025-12-28', 
      consumed: 2400, 
      burned: 420,
      trainingSessions: [
        { menuName: '背中の日', calories: 420, time: 3400 }
      ]
    },
    { 
      date: '2025-12-27', 
      consumed: 2000, 
      burned: 0,
      trainingSessions: []
    },
    { 
      date: '2025-12-26', 
      consumed: 2250, 
      burned: 460,
      trainingSessions: [
        { menuName: '胸・肩の日', calories: 460, time: 3700 }
      ]
    },
    { 
      date: '2025-12-25', 
      consumed: 2150, 
      burned: 390,
      trainingSessions: [
        { menuName: '脚の日', calories: 390, time: 3300 }
      ]
    },
  ]);

  const [bodyDataHistory, setBodyDataHistory] = useState<BodyData[]>([
    { date: '2025-12-31', weight: 72.5, bodyFat: 18.5, muscleMass: 56.2, bmi: 23.1, waterContent: 58.5, visceralFat: 8, basalMetabolism: 1680 },
    { date: '2025-12-30', weight: 72.8, bodyFat: 18.8, muscleMass: 56.0, bmi: 23.2, waterContent: 58.2, visceralFat: 8, basalMetabolism: 1675 },
    { date: '2025-12-29', weight: 73.0, bodyFat: 19.0, muscleMass: 55.8, bmi: 23.3, waterContent: 58.0, visceralFat: 9, basalMetabolism: 1670 },
    { date: '2025-12-28', weight: 73.2, bodyFat: 19.2, muscleMass: 55.5, bmi: 23.4, waterContent: 57.8, visceralFat: 9, basalMetabolism: 1665 },
    { date: '2025-12-27', weight: 73.5, bodyFat: 19.5, muscleMass: 55.3, bmi: 23.5, waterContent: 57.5, visceralFat: 9, basalMetabolism: 1660 },
    { date: '2025-12-26', weight: 73.8, bodyFat: 19.8, muscleMass: 55.0, bmi: 23.6, waterContent: 57.2, visceralFat: 10, basalMetabolism: 1655 },
    { date: '2025-12-25', weight: 74.0, bodyFat: 20.0, muscleMass: 54.8, bmi: 23.7, waterContent: 57.0, visceralFat: 10, basalMetabolism: 1650 },
  ]);

  const handleStartTraining = () => {
    setIsTraining(true);
  };

  const handleFinishTraining = (result: {
    totalTime: number;
    totalCalories: number;
    completedExercises: {
      name: string;
      weight: number;
      sets: number;
      totalTime: number;
      calories: number;
    }[];
  }) => {
    setIsTraining(false);
    setShowTrainingResult(true);
    setTrainingResultData(result);
    
    // Save calories to history
    if (selectedPreset) {
      const today = new Date().toISOString().split('T')[0];
      const existingIndex = calorieHistory.findIndex(d => d.date === today);
      
      const newSession = {
        menuName: selectedPreset.name,
        calories: result.totalCalories,
        time: result.totalTime,
      };
      
      if (existingIndex >= 0) {
        // Update existing entry for today
        setCalorieHistory(prev =>
          prev.map((d, index) =>
            index === existingIndex
              ? {
                  ...d,
                  burned: d.burned + result.totalCalories,
                  trainingSessions: [...d.trainingSessions, newSession],
                }
              : d
          )
        );
      } else {
        // Add new entry
        setCalorieHistory(prev => [
          {
            date: today,
            consumed: 0,
            burned: result.totalCalories,
            trainingSessions: [newSession],
          },
          ...prev,
        ]);
      }
    }
  };

  const handleAddBodyData = (data: Omit<BodyData, 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newData: BodyData = {
      date: today,
      ...data,
    };
    
    // Check if data for today already exists
    const existingIndex = bodyDataHistory.findIndex(d => d.date === today);
    
    if (existingIndex >= 0) {
      // Update existing entry for today
      setBodyDataHistory(prev =>
        prev.map((d, index) =>
          index === existingIndex ? { ...d, ...data } : d
        )
      );
    } else {
      // Add new entry
      setBodyDataHistory(prev => [newData, ...prev]);
    }
  };

  const handleUpdateBodyData = (date: string, updates: Partial<BodyData>) => {
    setBodyDataHistory(prev =>
      prev.map(data =>
        data.date === date ? { ...data, ...updates } : data
      )
    );
  };

  const handleDeleteBodyData = (date: string) => {
    setBodyDataHistory(prev => prev.filter(data => data.date !== date));
  };

  const handleCreatePreset = (name: string, exercises: Exercise[]) => {
    const newPreset: MenuPreset = {
      id: Date.now().toString(),
      name,
      exercises,
    };
    setMenuPresets(prev => [...prev, newPreset]);
    setSelectedPresetId(newPreset.id);
  };

  const handleDeletePreset = (id: string) => {
    setMenuPresets(prev => prev.filter(preset => preset.id !== id));
    if (selectedPresetId === id) {
      setSelectedPresetId('');
    }
  };

  const selectedPreset = menuPresets.find(preset => preset.id === selectedPresetId);

  const handleUpdateExercise = (id: string, updates: Partial<Exercise>) => {
    if (!selectedPreset) return;
    
    setMenuPresets(prev =>
      prev.map(preset =>
        preset.id === selectedPresetId
          ? {
              ...preset,
              exercises: preset.exercises.map(ex =>
                ex.id === id ? { ...ex, ...updates } : ex
              ),
            }
          : preset
      )
    );
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!selectedPreset) return;
    
    setMenuPresets(prev =>
      prev.map(preset =>
        preset.id === selectedPresetId
          ? {
              ...preset,
              exercises: [...preset.exercises, exercise],
            }
          : preset
      )
    );
  };

  const handleDeleteExercise = (id: string) => {
    if (!selectedPreset) return;
    
    setMenuPresets(prev =>
      prev.map(preset =>
        preset.id === selectedPresetId
          ? {
              ...preset,
              exercises: preset.exercises.filter(ex => ex.id !== id),
            }
          : preset
      )
    );
  };

  const handleAddConsumedCalories = (calories: number) => {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = calorieHistory.findIndex(d => d.date === today);
    
    if (existingIndex >= 0) {
      setCalorieHistory(prev =>
        prev.map((d, index) =>
          index === existingIndex
            ? { ...d, consumed: d.consumed + calories }
            : d
        )
      );
    } else {
      setCalorieHistory(prev => [
        {
          date: today,
          consumed: calories,
          burned: 0,
          trainingSessions: [],
        },
        ...prev,
      ]);
    }
  };

  const handleAddBurnedCalories = (calories: number, activityName?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = calorieHistory.findIndex(d => d.date === today);
    
    const newSession = activityName ? {
      menuName: activityName,
      calories: calories,
      time: 0,
    } : null;
    
    if (existingIndex >= 0) {
      setCalorieHistory(prev =>
        prev.map((d, index) =>
          index === existingIndex
            ? {
                ...d,
                burned: d.burned + calories,
                trainingSessions: newSession 
                  ? [...d.trainingSessions, newSession]
                  : d.trainingSessions,
              }
            : d
        )
      );
    } else {
      setCalorieHistory(prev => [
        {
          date: today,
          consumed: 0,
          burned: calories,
          trainingSessions: newSession ? [newSession] : [],
        },
        ...prev,
      ]);
    }
  };

  if (isTraining && selectedPreset) {
    const enabledExercises = selectedPreset.exercises.filter(ex => ex.enabled);
    const userWeight = bodyDataHistory[0]?.weight || 70;
    return (
      <TrainingSession 
        exercises={enabledExercises} 
        userWeight={userWeight}
        onExit={() => setIsTraining(false)} 
        onComplete={handleFinishTraining} 
      />
    );
  }

  if (showTrainingResult && trainingResultData && selectedPreset) {
    return (
      <TrainingResult
        menuName={selectedPreset.name}
        exercises={selectedPreset.exercises}
        totalTime={trainingResultData.totalTime}
        totalCalories={trainingResultData.totalCalories}
        completedExercises={trainingResultData.completedExercises}
        onClose={() => setShowTrainingResult(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {activeTab === 'body' && (
        <BodyDataScreen
          bodyDataHistory={bodyDataHistory}
          onAddBodyData={handleAddBodyData}
          onUpdateBodyData={handleUpdateBodyData}
          onDeleteBodyData={handleDeleteBodyData}
        />
      )}
      {activeTab === 'menu' && (
        <MenuScreen
          exercises={selectedPreset?.exercises || []}
          onStartTraining={() => setIsTraining(true)}
          onUpdateExercise={handleUpdateExercise}
          selectedPresetId={selectedPresetId}
          setSelectedPresetId={setSelectedPresetId}
          menuPresets={menuPresets}
          onCreatePreset={handleCreatePreset}
          onDeletePreset={handleDeletePreset}
          onAddExercise={handleAddExercise}
          onDeleteExercise={handleDeleteExercise}
        />
      )}
      {activeTab === 'calories' && (
        <CaloriesScreen
          bodyDataHistory={bodyDataHistory}
          menuPresets={menuPresets}
          calorieHistory={calorieHistory}
          onAddConsumedCalories={handleAddConsumedCalories}
          onAddBurnedCalories={handleAddBurnedCalories}
        />
      )}
      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Calendar, Apple, Plus, Trash2, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { fetcher } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import FoodSearchModal from './FoodSearchModal';

interface FoodDiaryTabProps {
  studentId: string | number;
}

export default function FoodDiaryTab({ studentId }: FoodDiaryTabProps) {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [log, setLog] = useState<any>({ meals: [], total_macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadLog();
  }, [date, studentId]);

  async function loadLog() {
    setIsLoading(true);
    try {
      const data = await fetcher<any>(`/api/food/logs?student_id=${studentId}&date=${date}`);
      setLog(data);
    } catch (error) {
      console.error('Failed to load log', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveLog(updatedMeals: any[]) {
    const totals = updatedMeals.reduce((acc: any, meal: any) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    try {
      await fetcher('/api/food/logs', {
        method: 'POST',
        body: JSON.stringify({ date, meals: updatedMeals, total_macros: totals })
      });
      setLog({ meals: updatedMeals, total_macros: totals });
    } catch (error) {
      console.error('Failed to save log', error);
      loadLog(); // Reset on error
    }
  }

  function addFood(food: any) {
    const newMeal = {
      id: crypto.randomUUID(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      name: food.food_name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat
    };
    saveLog([...log.meals, newMeal]);
    setIsSearchOpen(false);
  }

  function removeFood(id: string) {
    saveLog(log.meals.filter((m: any) => m.id !== id));
  }

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 font-bold text-white">
          <Calendar className="w-5 h-5 text-violet-400" />
          {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Calorias', value: log.total_macros.calories, unit: 'kcal', color: 'text-white' },
          { label: 'Proteína', value: log.total_macros.protein, unit: 'g', color: 'text-emerald-400' },
          { label: 'Carbos', value: log.total_macros.carbs, unit: 'g', color: 'text-blue-400' },
          { label: 'Gordura', value: log.total_macros.fat, unit: 'g', color: 'text-red-400' }
        ].map((macro) => (
          <div key={macro.label} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{macro.label}</p>
            <p className={`text-xl font-black ${macro.color}`}>{macro.value.toFixed(0)} <span className="text-xs font-normal opacity-60">{macro.unit}</span></p>
          </div>
        ))}
      </div>

      {/* Meals List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Apple className="w-5 h-5 text-emerald-400" /> Ingestão Realizada
          </h3>
          {user?.role === 'student' && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar Alimento
            </button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {log.meals.map((meal: any) => (
            <div key={meal.id} className="group relative flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30 hover:border-violet-500/30 transition-all">
              <div className="flex gap-4 items-center">
                <div className="text-xs font-bold text-zinc-500">{meal.time}</div>
                <div>
                  <h4 className="font-bold text-white">{meal.name}</h4>
                  <div className="flex gap-3 text-xs text-zinc-400 mt-1">
                    <span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>G: {meal.fat}g</span>
                  </div>
                </div>
              </div>
              {user?.role === 'student' && (
                <button
                  onClick={() => removeFood(meal.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {log.meals.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Apple className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">Nenhum alimento registrado para esta data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Protocol vs Actual comparison (Simplified for now) */}
      <div className="bg-gradient-to-br from-violet-600/10 to-emerald-600/10 border border-violet-500/20 rounded-2xl p-6">
        <h4 className="font-bold text-white flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-violet-400" /> Resumo do Dia
        </h4>
        <p className="text-sm text-zinc-400">
           {log.meals.length > 0 
             ? `Você já consumiu ${log.total_macros.calories.toFixed(0)} calorias hoje. Continue focado no protocolo!` 
             : 'Aguardando seus registros do dia para análise de macros.'}
        </p>
      </div>

      <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} title="Buscar Alimento (FatSecret)">
        <FoodSearchModal onAdd={addFood} onClose={() => setIsSearchOpen(false)} />
      </Modal>
    </div>
  );
}

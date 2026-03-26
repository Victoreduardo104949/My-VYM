import { useState } from 'react';
import { Search, Plus, Loader2, X } from 'lucide-react';
import { fetcher } from '../lib/api';

interface FoodSearchModalProps {
  onAdd: (food: any) => void;
  onClose: () => void;
}

export default function FoodSearchModal({ onAdd, onClose }: FoodSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;
    setIsLoading(true);
    try {
      const data = await fetcher<any>(`/api/food/search?q=${encodeURIComponent(query)}`);
      // Edamam returns hints array
      setResults(data.hints || []);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd(item: any) {
    const food = item.food;
    const nutrients = food.nutrients || {};
    
    onAdd({
      food_name: food.label,
      calories: Math.round(nutrients.ENERC_KCAL || 0),
      protein: Number(nutrients.PROCNT || 0).toFixed(1),
      carbs: Number(nutrients.CHOCDF || 0).toFixed(1),
      fat: Number(nutrients.FAT || 0).toFixed(1)
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no Banco de Dados (ex: Ovo cozido, Frango...)"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white focus:border-violet-500 outline-none"
        />
        <button type="submit" disabled={isLoading} className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white transition-colors">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
        </button>
      </form>

      <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {results.map((item: any, idx: number) => {
          const food = item.food;
          const nutrients = food.nutrients || {};
          return (
            <button
              key={`${food.foodId}-${idx}`}
              onClick={() => handleAdd(item)}
              className="w-full text-left p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800 hover:border-violet-500/50 transition-all group"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  {food.image && (
                    <img src={food.image} alt={food.label} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <h4 className="font-bold text-white group-hover:text-violet-400">{food.label}</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {Math.round(nutrients.ENERC_KCAL || 0)} kcal • P: {Number(nutrients.PROCNT || 0).toFixed(1)}g • C: {Number(nutrients.CHOCDF || 0).toFixed(1)}g • G: {Number(nutrients.FAT || 0).toFixed(1)}g
                    </p>
                  </div>
                </div>
                <div className="bg-violet-600/10 p-2 rounded-lg group-hover:bg-violet-600 transition-colors">
                  <Plus className="w-4 h-4 text-violet-400 group-hover:text-white" />
                </div>
              </div>
            </button>
          );
        })}
        {results.length === 0 && !isLoading && query && (
          <p className="text-center text-zinc-500 py-8">Nenhum alimento encontrado.</p>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Utensils, Search, User, Clock } from 'lucide-react';
import { fetcher } from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Diet {
  id: number;
  student_id: number;
  title: string;
  description: string;
  meals: string;
  created_at: string;
}

interface Student {
  id: number;
  name: string;
}

export default function Diets() {
  const { user } = useAuth();
  const [diets, setDiets] = useState<Diet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [dietsData, studentsData] = await Promise.all([
        fetcher<Diet[]>('/api/diets'),
        user?.role === 'admin' ? fetcher<Student[]>('/api/students') : Promise.resolve([]),
      ]);
      setDiets(dietsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  }

  const getStudentName = (id: number) => students.find(s => s.id === id)?.name || 'Unknown';

  const filteredDiets = diets.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.role === 'admin' && getStudentName(d.student_id).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isStudent = user?.role === 'student';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          {isStudent ? 'Minhas Dietas' : 'Todas as Dietas'}
        </h1>
        <p className="text-zinc-400 mt-2">
          {isStudent
            ? 'Acompanhe seu plano alimentar.'
            : 'Visão geral de todas as dietas atribuídas aos alunos.'}
        </p>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <Search className="w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder={isStudent ? "Buscar dieta..." : "Buscar por dieta ou aluno..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiets.map((diet) => {
          const meals = JSON.parse(diet.meals || '[]');
          return (
            <div key={diet.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Utensils className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
                  {meals.length} refeições
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{diet.title}</h3>
              
              {!isStudent && (
                <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                  <User className="w-4 h-4" />
                  <Link to={`/students/${diet.student_id}`} className="hover:text-emerald-400 transition-colors">
                    {getStudentName(diet.student_id)}
                  </Link>
                </div>
              )}

              {diet.description && (
                <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{diet.description}</p>
              )}

              <div className="space-y-2">
                {meals.slice(0, 2).map((meal: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span className="font-medium text-zinc-400">{meal.time}</span>
                    <span className="truncate">{meal.description}</span>
                  </div>
                ))}
                {meals.length > 2 && (
                  <p className="text-xs text-zinc-600 italic">+ {meals.length - 2} outras refeições</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

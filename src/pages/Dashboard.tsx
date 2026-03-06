import { useEffect, useState } from 'react';
import { Users, Dumbbell, Utensils, TrendingUp } from 'lucide-react';
import { fetcher } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    workouts: 0,
    diets: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const students = await fetcher<any[]>('/api/students');
        const workouts = await fetcher<any[]>('/api/workouts');
        const diets = await fetcher<any[]>('/api/diets');
        setStats({
          students: students.length,
          workouts: workouts.length,
          diets: diets.length,
        });
      } catch (error) {
        console.error('Failed to load stats', error);
      }
    }
    loadStats();
  }, []);

  const cards = [
    {
      name: 'Total de Alunos',
      value: stats.students,
      icon: Users,
      color: 'from-violet-500 to-fuchsia-500',
      textColor: 'text-violet-400',
    },
    {
      name: 'Treinos Criados',
      value: stats.workouts,
      icon: Dumbbell,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400',
    },
    {
      name: 'Dietas Ativas',
      value: stats.diets,
      icon: Utensils,
      color: 'from-orange-500 to-amber-500',
      textColor: 'text-orange-400',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-2">Visão geral do seu negócio de consultoria.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.name}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${card.textColor} bg-zinc-800/50 px-2 py-1 rounded-lg`}>
                +12% este mês
              </span>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium">{card.name}</h3>
            <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Atividade Recente</h2>
            <TrendingUp className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Novo aluno cadastrado</p>
                  <p className="text-xs text-zinc-500">Há 2 horas</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Criar Novo Treino</h3>
          <p className="text-zinc-400 mb-6 max-w-xs">Adicione novos exercícios e rotinas para seus alunos.</p>
          <button className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors">
            Começar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
